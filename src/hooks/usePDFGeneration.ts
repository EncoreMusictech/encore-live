
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
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(htmlContent);
      doc.close();
      await new Promise((r) => setTimeout(r, 100));
      // Wait for fonts if supported
      try { await (doc as any).fonts?.ready; } catch {}

      const target = doc.body as HTMLElement;
      target.style.background = '#ffffff';
      target.style.width = '794px';

      const canvas = await html2canvas(target, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const imgWidth = pageWidth - margin * 2;
      const scale = imgWidth / canvas.width;
      const pageHeightPx = Math.floor((pageHeight - margin * 2) / scale);

      let y = 0;
      let pageIndex = 0;
      while (y < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const imgData = pageCanvas.toDataURL('image/png');
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, sliceHeight * scale, undefined, 'FAST');
        y += sliceHeight;
        pageIndex++;
      }

      pdf.save(`${fileName}.pdf`);
      document.body.removeChild(iframe);
      toast({ title: 'Downloaded', description: `${fileName}.pdf has been downloaded` });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download Error', description: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  const openPDFInNewWindow = async (htmlContent: string, contractTitle: string) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      document.body.appendChild(iframe);
      const docNode = iframe.contentDocument!;
      docNode.open();
      docNode.write(htmlContent);
      docNode.close();
      await new Promise((r) => setTimeout(r, 100));
      try { await (docNode as any).fonts?.ready; } catch {}

      const target = docNode.body as HTMLElement;
      target.style.background = '#ffffff';
      target.style.width = '794px';

      const canvas = await html2canvas(target, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const imgWidth = pageWidth - margin * 2;
      const scale = imgWidth / canvas.width;
      const pageHeightPx = Math.floor((pageHeight - margin * 2) / scale);

      let y = 0;
      let pageIndex = 0;
      while (y < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const imgData = pageCanvas.toDataURL('image/png');
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, sliceHeight * scale, undefined, 'FAST');
        y += sliceHeight;
        pageIndex++;
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      document.body.removeChild(iframe);
      toast({ title: 'PDF Opened', description: 'Agreement opened in a new tab' });
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
