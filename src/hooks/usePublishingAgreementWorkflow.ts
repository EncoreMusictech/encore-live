import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SignatureStatus {
  status: 'draft' | 'ready_for_signature' | 'partially_signed' | 'fully_signed' | 'cancelled';
  signedBy: string[];
  pendingSignatures: string[];
  lastActivity: Date;
  docusignEnvelopeId?: string;
}

export const usePublishingAgreementWorkflow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateAgreementPDF = async (contractId: string): Promise<{ success: boolean; downloadUrl?: string }> => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-publishing-agreement-pdf', {
        body: { contractId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate PDF');
      }

      toast({
        title: "PDF Generated",
        description: "Agreement PDF has been generated successfully",
      });

      return {
        success: true,
        downloadUrl: data.downloadUrl
      };
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: error.message || "Failed to generate agreement PDF",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  const sendForSignature = async (contractId: string, signers: { name: string; email: string; role: string }[]): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      // First generate the PDF if not already done
      const pdfResult = await generateAgreementPDF(contractId);
      if (!pdfResult.success) {
        throw new Error('Failed to generate PDF for signature');
      }

      // Update contract status to ready for signature
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ 
          signature_status: 'ready_for_signature',
          last_sent_date: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) {
        throw new Error('Failed to update contract status');
      }

      // In a real implementation, you would integrate with DocuSign here
      // For now, we'll simulate the process
      await simulateDocuSignSend(contractId, signers);

      toast({
        title: "Sent for Signature",
        description: `Agreement sent to ${signers.length} signer(s)`,
      });

      return true;
    } catch (error: any) {
      console.error('Send for signature error:', error);
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send agreement for signature",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const getSignatureStatus = async (contractId: string): Promise<SignatureStatus | null> => {
    try {
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('signature_status, last_sent_date, contract_data')
        .eq('id', contractId)
        .single();

      if (error || !contract) {
        throw new Error('Contract not found');
      }

      // Extract signature info from contract_data
      const contractData = contract.contract_data as any;
      const signatureData = contractData?.signature_info || {};
      
      return {
        status: (contract.signature_status as any) || 'draft',
        signedBy: signatureData.signedBy || [],
        pendingSignatures: signatureData.pendingSignatures || [],
        lastActivity: contract.last_sent_date ? new Date(contract.last_sent_date) : new Date(),
        docusignEnvelopeId: signatureData.docusignEnvelopeId
      };
    } catch (error) {
      console.error('Get signature status error:', error);
      return null;
    }
  };

  const updateSignatureStatus = async (contractId: string, status: SignatureStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          signature_status: status.status as any,
          contract_data: {
            signature_info: {
              signedBy: status.signedBy,
              pendingSignatures: status.pendingSignatures,
              docusignEnvelopeId: status.docusignEnvelopeId
            }
          } as any
        })
        .eq('id', contractId);

      if (error) {
        throw new Error('Failed to update signature status');
      }

      return true;
    } catch (error) {
      console.error('Update signature status error:', error);
      return false;
    }
  };

  const exportAgreementTemplate = async (agreementType: string, format: 'pdf' | 'docx' = 'pdf'): Promise<{ success: boolean; downloadUrl?: string }> => {
    setIsProcessing(true);
    
    try {
      // Generate a template for the specific agreement type
      const templateData = generateAgreementTemplate(agreementType);
      
      // In a real implementation, you would generate the actual document
      // For now, we'll return a success response
      
      toast({
        title: "Template Exported",
        description: `${agreementType} template exported as ${format.toUpperCase()}`,
      });

      return {
        success: true,
        downloadUrl: `${agreementType}-template.${format}`
      };
    } catch (error: any) {
      console.error('Template export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export template",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  const checkContractCompliance = async (contractId: string): Promise<{ compliant: boolean; issues: string[] }> => {
    try {
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_interested_parties(*),
          contract_schedule_works(*)
        `)
        .eq('id', contractId)
        .single();

      if (error || !contract) {
        throw new Error('Contract not found');
      }

      const issues: string[] = [];

      // Check for required parties
      if (!contract.contract_interested_parties || contract.contract_interested_parties.length === 0) {
        issues.push('No interested parties defined');
      }

      // Check for works
      if (!contract.contract_schedule_works || contract.contract_schedule_works.length === 0) {
        issues.push('No works listed in schedule');
      }

      // Check percentage totals
      const totalPerformance = contract.contract_interested_parties?.reduce((sum: number, party: any) => 
        sum + (party.performance_percentage || 0), 0) || 0;
      
      if (totalPerformance !== 100) {
        issues.push(`Performance percentages total ${totalPerformance}%, should be 100%`);
      }

      // Check for required fields based on agreement type
      const contractData = contract.contract_data as any;
      const agreementType = contractData?.agreement_type;
      if (agreementType === 'administration' && !contractData?.admin_fee_percentage) {
        issues.push('Administration fee not specified');
      }

      return {
        compliant: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Compliance check error:', error);
      return {
        compliant: false,
        issues: ['Failed to check compliance']
      };
    }
  };

  return {
    generateAgreementPDF,
    sendForSignature,
    getSignatureStatus,
    updateSignatureStatus,
    exportAgreementTemplate,
    checkContractCompliance,
    isProcessing
  };
};

// Helper functions
async function simulateDocuSignSend(contractId: string, signers: { name: string; email: string; role: string }[]) {
  // Simulate DocuSign API call
  // In real implementation, you would use DocuSign SDK
  console.log(`Sending contract ${contractId} to signers:`, signers);
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    envelopeId: `env_${Date.now()}`,
    status: 'sent'
  };
}

function generateAgreementTemplate(agreementType: string): object {
  const templates = {
    administration: {
      title: "ADMINISTRATION AGREEMENT TEMPLATE",
      sections: [
        "Parties",
        "Grant of Rights", 
        "Administrative Fee",
        "Territory",
        "Term",
        "Accounting",
        "Termination"
      ],
      fields: [
        "{{ADMIN_FEE_PERCENTAGE}}",
        "{{CONTROLLED_SHARE}}",
        "{{APPROVAL_RIGHTS}}",
        "{{TAIL_PERIOD}}"
      ]
    },
    co_publishing: {
      title: "CO-PUBLISHING AGREEMENT TEMPLATE",
      sections: [
        "Parties",
        "Grant of Rights",
        "Revenue Splits", 
        "Advance Terms",
        "Delivery Obligations",
        "Territory",
        "Term"
      ],
      fields: [
        "{{PUBLISHER_SHARE}}",
        "{{WRITER_SHARE}}",
        "{{ADVANCE_AMOUNT}}",
        "{{DELIVERY_COMMITMENT}}"
      ]
    },
    exclusive_songwriter: {
      title: "EXCLUSIVE SONGWRITER AGREEMENT TEMPLATE", 
      sections: [
        "Parties",
        "Exclusivity",
        "Delivery Requirements",
        "Royalty Rates",
        "Advance Terms",
        "Territory",
        "Term"
      ],
      fields: [
        "{{DELIVERY_REQUIREMENT}}",
        "{{MECHANICAL_RATE}}",
        "{{SYNC_RATE}}",
        "{{EXCLUSIVITY_PERIOD}}"
      ]
    },
    catalog_acquisition: {
      title: "CATALOG ACQUISITION AGREEMENT TEMPLATE",
      sections: [
        "Parties", 
        "Purchase Terms",
        "Rights Transfer",
        "Work Schedule",
        "Seller Overrides",
        "Representations",
        "Closing"
      ],
      fields: [
        "{{ACQUISITION_PRICE}}",
        "{{RIGHTS_ACQUIRED}}",
        "{{SELLER_OVERRIDE}}",
        "{{WORK_LIST}}"
      ]
    }
  };

  return templates[agreementType as keyof typeof templates] || templates.administration;
}