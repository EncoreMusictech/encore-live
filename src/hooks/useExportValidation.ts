import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ValidationResult {
  validationId?: string;
  overallScore: number;
  canExport: boolean;
  totalCopyrights: number;
  blockingIssuesCount: number;
  warningIssuesCount: number;
  blockingIssues: any[];
  warningIssues: any[];
  copyrightResults: any[];
  recommendations: string[];
}

export const useExportValidation = () => {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const validateExport = async (copyrightIds: string[], exportType: 'cwr' | 'ddex') => {
    if (!copyrightIds.length) {
      toast({
        title: "Validation Error",
        description: "Please select copyrights to validate",
        variant: "destructive"
      });
      return null;
    }

    setValidating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-export-compliance', {
        body: { copyrightIds, exportType }
      });

      if (error) {
        console.error('Validation error:', error);
        toast({
          title: "Validation Failed",
          description: error.message || "Failed to validate export compliance",
          variant: "destructive"
        });
        return null;
      }

      setValidationResult(data);
      
      if (data.canExport) {
        toast({
          title: "Validation Successful",
          description: `Export ready with ${data.overallScore.toFixed(1)}% compliance score`,
          variant: "default"
        });
      } else {
        toast({
          title: "Validation Issues Found",
          description: `${data.blockingIssuesCount} blocking issues must be resolved before export`,
          variant: "destructive"
        });
      }

      return data;
    } catch (error) {
      console.error('Error validating export:', error);
      toast({
        title: "Validation Error",
        description: "An unexpected error occurred during validation",
        variant: "destructive"
      });
      return null;
    } finally {
      setValidating(false);
    }
  };

  const clearValidation = () => {
    setValidationResult(null);
  };

  return {
    validating,
    validationResult,
    validateExport,
    clearValidation
  };
};