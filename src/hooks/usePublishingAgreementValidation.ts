import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface ValidationRule {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  suggestions: ValidationRule[];
}

export const usePublishingAgreementValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateAgreement = async (agreementType: string, formData: any): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      const errors: ValidationRule[] = [];
      const warnings: ValidationRule[] = [];
      const suggestions: ValidationRule[] = [];

      // Core validation rules
      if (!formData.title?.trim()) {
        errors.push({
          field: 'title',
          rule: 'required',
          message: 'Agreement title is required',
          severity: 'error'
        });
      }

      if (!formData.counterparty_name?.trim()) {
        errors.push({
          field: 'counterparty_name',
          rule: 'required',
          message: 'Counterparty name is required',
          severity: 'error'
        });
      }

      // Date validation
      if (formData.effective_date && formData.end_date) {
        if (new Date(formData.effective_date) >= new Date(formData.end_date)) {
          errors.push({
            field: 'end_date',
            rule: 'date_order',
            message: 'End date must be after effective date',
            severity: 'error'
          });
        }
      }

      // Agreement type specific validations
      switch (agreementType) {
        case 'administration':
          validateAdministrationAgreement(formData, errors, warnings, suggestions);
          break;
        case 'co_publishing':
          validateCoPublishingAgreement(formData, errors, warnings, suggestions);
          break;
        case 'exclusive_songwriter':
          validateExclusiveSongwriterAgreement(formData, errors, warnings, suggestions);
          break;
        case 'catalog_acquisition':
          validateCatalogAcquisitionAgreement(formData, errors, warnings, suggestions);
          break;
      }

      // Cross-field validations
      validateCrossFields(formData, errors, warnings, suggestions);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate agreement",
        variant: "destructive",
      });
      return {
        isValid: false,
        errors: [{
          field: 'general',
          rule: 'validation_failed',
          message: 'Validation process failed',
          severity: 'error'
        }],
        warnings: [],
        suggestions: []
      };
    } finally {
      setIsValidating(false);
    }
  };

  const generateAgreementId = async (): Promise<string> => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Generate sequential number for the day
    const { data: existingContracts } = await supabase
      .from('contracts')
      .select('agreement_id')
      .like('agreement_id', `AGR-${year}${month}${day}%`)
      .order('created_at', { ascending: false });

    const sequenceNumber = (existingContracts?.length || 0) + 1;
    const paddedSequence = String(sequenceNumber).padStart(3, '0');
    
    return `AGR-${year}${month}${day}-${paddedSequence}`;
  };

  return {
    validateAgreement,
    generateAgreementId,
    isValidating
  };
};

// Administration Agreement Validation
function validateAdministrationAgreement(
  formData: any, 
  errors: ValidationRule[], 
  warnings: ValidationRule[], 
  suggestions: ValidationRule[]
) {
  if (!formData.admin_fee_percentage || formData.admin_fee_percentage <= 0) {
    warnings.push({
      field: 'admin_fee_percentage',
      rule: 'admin_fee_missing',
      message: 'Admin fee percentage should be specified',
      severity: 'warning'
    });
  }

  if (formData.admin_fee_percentage > 25) {
    warnings.push({
      field: 'admin_fee_percentage',
      rule: 'admin_fee_high',
      message: 'Admin fee above 25% is unusually high',
      severity: 'warning'
    });
  }

  if (!formData.admin_rights || formData.admin_rights.length === 0) {
    errors.push({
      field: 'admin_rights',
      rule: 'admin_rights_required',
      message: 'At least one administrative right must be specified',
      severity: 'error'
    });
  }

  if (!formData.approval_rights) {
    suggestions.push({
      field: 'approval_rights',
      rule: 'approval_rights_recommended',
      message: 'Consider specifying approval rights for sync licenses',
      severity: 'info'
    });
  }
}

// Co-Publishing Agreement Validation
function validateCoPublishingAgreement(
  formData: any, 
  errors: ValidationRule[], 
  warnings: ValidationRule[], 
  suggestions: ValidationRule[]
) {
  const publisherShare = formData.publisher_share_percentage || 0;
  const writerShare = formData.writer_share_percentage || 0;

  if (publisherShare + writerShare > 100) {
    errors.push({
      field: 'publisher_share_percentage',
      rule: 'shares_exceed_100',
      message: 'Combined publisher and writer shares cannot exceed 100%',
      severity: 'error'
    });
  }

  if (publisherShare === 0) {
    warnings.push({
      field: 'publisher_share_percentage',
      rule: 'publisher_share_zero',
      message: 'Publisher share is 0% - verify this is intentional',
      severity: 'warning'
    });
  }

  if (formData.advance_amount > 0 && !formData.recoupable) {
    warnings.push({
      field: 'recoupable',
      rule: 'advance_not_recoupable',
      message: 'Advance amount specified but marked as non-recoupable',
      severity: 'warning'
    });
  }

  if (formData.exclusivity && !formData.delivery_commitment) {
    suggestions.push({
      field: 'delivery_commitment',
      rule: 'delivery_commitment_recommended',
      message: 'Consider adding delivery commitment for exclusive agreements',
      severity: 'info'
    });
  }
}

// Exclusive Songwriter Agreement Validation
function validateExclusiveSongwriterAgreement(
  formData: any, 
  errors: ValidationRule[], 
  warnings: ValidationRule[], 
  suggestions: ValidationRule[]
) {
  if (!formData.delivery_requirement || formData.delivery_requirement === 0) {
    errors.push({
      field: 'delivery_requirement',
      rule: 'delivery_requirement_required',
      message: 'Delivery requirement is mandatory for exclusive songwriter agreements',
      severity: 'error'
    });
  }

  if (formData.delivery_requirement > 50) {
    warnings.push({
      field: 'delivery_requirement',
      rule: 'delivery_requirement_high',
      message: 'Delivery requirement above 50 songs per year is very high',
      severity: 'warning'
    });
  }

  if (!formData.exclusivity_period_start || !formData.exclusivity_period_end) {
    suggestions.push({
      field: 'exclusivity_period_start',
      rule: 'exclusivity_period_recommended',
      message: 'Consider specifying exact exclusivity period dates',
      severity: 'info'
    });
  }

  const mechanicalRate = formData.mechanical_royalty_rate || 0;
  if (mechanicalRate < 50) {
    warnings.push({
      field: 'mechanical_royalty_rate',
      rule: 'mechanical_rate_low',
      message: 'Mechanical royalty rate below 50% is low for songwriter agreements',
      severity: 'warning'
    });
  }
}

// Catalog Acquisition Agreement Validation
function validateCatalogAcquisitionAgreement(
  formData: any, 
  errors: ValidationRule[], 
  warnings: ValidationRule[], 
  suggestions: ValidationRule[]
) {
  if (!formData.acquisition_price || formData.acquisition_price <= 0) {
    errors.push({
      field: 'acquisition_price',
      rule: 'acquisition_price_required',
      message: 'Acquisition price must be specified and greater than 0',
      severity: 'error'
    });
  }

  if (!formData.rights_acquired) {
    errors.push({
      field: 'rights_acquired',
      rule: 'rights_acquired_required',
      message: 'Type of rights being acquired must be specified',
      severity: 'error'
    });
  }

  if (formData.royalty_override_to_seller > 50) {
    warnings.push({
      field: 'royalty_override_to_seller',
      rule: 'override_high',
      message: 'Royalty override above 50% significantly reduces acquisition value',
      severity: 'warning'
    });
  }

  if (!formData.acquired_work_list_url) {
    suggestions.push({
      field: 'acquired_work_list_url',
      rule: 'work_list_recommended',
      message: 'Consider uploading a detailed work list for catalog acquisitions',
      severity: 'info'
    });
  }
}

// Cross-field validations
function validateCrossFields(
  formData: any, 
  errors: ValidationRule[], 
  warnings: ValidationRule[], 
  suggestions: ValidationRule[]
) {
  // Territory and governing law consistency
  if (formData.territory?.includes('United States') && formData.governing_law && 
      !['new_york', 'california', 'tennessee'].includes(formData.governing_law)) {
    suggestions.push({
      field: 'governing_law',
      rule: 'territory_law_mismatch',
      message: 'Consider using US state law for US territory agreements',
      severity: 'info'
    });
  }

  // Delivery requirements and approvals
  if (formData.delivery_requirements?.length > 0 && !formData.approvals_required) {
    suggestions.push({
      field: 'approvals_required',
      rule: 'delivery_approval_sync',
      message: 'Consider approval requirements when delivery obligations exist',
      severity: 'info'
    });
  }
}

export default usePublishingAgreementValidation;