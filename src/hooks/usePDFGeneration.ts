
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFGenerationResult {
  success: boolean;
  contractId: string;
  contractTitle: string;
  pdfData?: string; // HTML content returned by the server
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

  const downloadPDF = async (htmlContent: string, fileName: string) => {
    try {
      // Mount HTML in a hidden container for rendering
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px'; // ~A4 width at 96 DPI
      container.style.background = '#ffffff';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      // jsPDF's html() uses html2canvas under the hood
      await doc.html(container, {
        callback: (d) => {
          d.save(`${fileName}.pdf`);
          document.body.removeChild(container);
          toast({ title: 'Downloaded', description: `${fileName}.pdf has been downloaded` });
        },
        margin: [36, 36, 36, 36],
        autoPaging: 'text',
        html2canvas: { scale: 0.9, useCORS: true, logging: false },
        windowWidth: 794,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download Error', description: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  const openPDFInNewWindow = async (htmlContent: string, contractTitle: string) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px';
      container.style.background = '#ffffff';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      await doc.html(container, {
        callback: (d) => {
          const url = d.output('bloburl');
          window.open(url, '_blank');
          document.body.removeChild(container);
          toast({ title: 'PDF Opened', description: 'Agreement opened in a new tab' });
        },
        margin: [36, 36, 36, 36],
        autoPaging: 'text',
        html2canvas: { scale: 0.9, useCORS: true, logging: false },
        windowWidth: 794,
      });
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast({ title: 'Error', description: 'Failed to open PDF in new window', variant: 'destructive' });
    }
  };

  return {
    generatePDF,
    downloadPDF,
    openPDFInNewWindow,
    isGenerating
  };
};
