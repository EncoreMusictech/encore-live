
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

      const { data, error } = await supabase.functions.invoke('generate-agreement-pdf', {
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
      // Create a blob from the HTML content
      const blob = new Blob([pdfData], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Create a temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.html`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: `${fileName}.html has been downloaded`,
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

  const openPDFInNewWindow = (pdfData: string, contractTitle: string) => {
    try {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(pdfData);
        newWindow.document.close();
        newWindow.document.title = contractTitle;
        
        toast({
          title: "PDF Opened",
          description: "Agreement opened in new window",
        });
      } else {
        throw new Error('Failed to open new window');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast({
        title: "Error",
        description: "Failed to open PDF in new window",
        variant: "destructive",
      });
    }
  };

  return {
    generatePDF,
    downloadPDF,
    openPDFInNewWindow,
    isGenerating
  };
};
