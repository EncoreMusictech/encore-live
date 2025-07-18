
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PDFGenerationResult {
  success: boolean;
  contractId: string;
  contractTitle: string;
  pdfData?: string;
  downloadUrl?: string;
}

export const usePDFGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async (contractId: string): Promise<PDFGenerationResult | null> => {
    if (!contractId) {
      toast({
        title: "Error",
        description: "Contract ID is required",
        variant: "destructive",
      });
      return null;
    }

    setIsGenerating(true);

    try {
      console.log('Generating PDF for contract:', contractId);

      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { contractId }
      });

      if (error) {
        console.error('PDF generation error:', error);
        throw new Error(error.message || 'Failed to generate PDF');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'PDF generation failed');
      }

      console.log('PDF generated successfully:', data);

      toast({
        title: "Success",
        description: `PDF generated for ${data.contractTitle}`,
      });

      return data;

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = (pdfData: string, fileName: string) => {
    try {
      // Create a blob from the PDF data
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Create a temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: `${fileName}.pdf has been downloaded`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  return {
    generatePDF,
    downloadPDF,
    isGenerating
  };
};
