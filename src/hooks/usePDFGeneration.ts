import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { buildPdfFileName, sanitizeFileBaseName } from '@/lib/utils';

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

  const buildPrintHTML = (inner: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>
    html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif}
    /* Safer typography for canvas rendering */
    .print-root{box-sizing:border-box;width:794px;max-width:794px;padding:40px 48px;margin:0 auto;line-height:1.6;letter-spacing:0;word-spacing:0.06em;font-kerning:none;font-feature-settings:'liga' 0, 'kern' 0;white-space:normal;word-break:normal}
    h1,h2,h3{margin:0 0 14px;letter-spacing:0}
    p,li{margin:0 0 12px;line-height:1.6;letter-spacing:0;word-spacing:0.06em}
    section{page-break-inside:avoid}
    table{width:100%;border-collapse:collapse}
    table,th,td{border:1px solid #ddd}
    img{max-width:100%;height:auto}
  </style></head><body><div class="print-root">${inner}</div></body></html>`;
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
      doc.write(buildPrintHTML(htmlContent));
      doc.close();
      await new Promise((r) => setTimeout(r, 120));
      // Wait for fonts if supported
      try { await (doc as any).fonts?.ready; } catch {}

      const target = doc.body as HTMLElement;
      target.style.background = '#ffffff';
      target.style.width = '794px';

      const canvas = await html2canvas(target, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', letterRendering: true, foreignObjectRendering: true } as any);

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 48;
      const imgWidth = pageWidth - margin * 2;
      const scale = imgWidth / canvas.width;
      const pageHeightPx = Math.floor((pageHeight - margin * 2) / scale);
      const overlap = 8; // px overlap to avoid cutting lines

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
        y += (y + sliceHeight >= canvas.height) ? sliceHeight : (sliceHeight - overlap);
        pageIndex++;
      }

      const standardizedBase = buildPdfFileName({ kind: 'agreement', title: fileName, date: new Date() });
      pdf.save(`${standardizedBase}.pdf`);
      document.body.removeChild(iframe);
      toast({ title: 'Downloaded', description: `${standardizedBase}.pdf has been downloaded` });
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
      docNode.write(buildPrintHTML(htmlContent));
      docNode.close();
      await new Promise((r) => setTimeout(r, 120));
      try { await (docNode as any).fonts?.ready; } catch {}

      const target = docNode.body as HTMLElement;
      target.style.background = '#ffffff';
      target.style.width = '794px';

      const canvas = await html2canvas(target, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', letterRendering: true, foreignObjectRendering: true } as any);

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 48;
      const imgWidth = pageWidth - margin * 2;
      const scale = imgWidth / canvas.width;
      const pageHeightPx = Math.floor((pageHeight - margin * 2) / scale);
      const overlap = 8;

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
        y += (y + sliceHeight >= canvas.height) ? sliceHeight : (sliceHeight - overlap);
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
