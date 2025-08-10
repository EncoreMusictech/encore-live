import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildPdfFileName } from '@/lib/utils';
interface PDFViewerProps {
  pdfUrl: string;
  fileName?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, fileName }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    const base = buildPdfFileName({ kind: 'document', title: fileName || 'contract', date: new Date() });
    link.download = `${base}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract PDF
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
          </div>
        </div>
        {fileName && (
          <p className="text-sm text-muted-foreground">{fileName}</p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[600px] w-full">
          <iframe
            src={pdfUrl}
            className="h-full w-full border-0"
            title="Contract PDF"
          />
          <Alert className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm">
            <AlertDescription>
              If the PDF doesn't display properly, try opening it in a new tab or downloading it.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};