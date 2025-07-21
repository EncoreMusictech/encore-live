import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FileCheck,
  AlertTriangle,
  Download
} from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import { ContractTermsDisplay } from './ContractTermsDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ContractReviewViewProps {
  parsingResultId: string;
  pdfUrl: string;
  fileName: string;
  onBack: () => void;
  onApprove?: (contractData: any) => void;
}

export const ContractReviewView: React.FC<ContractReviewViewProps> = ({
  parsingResultId,
  pdfUrl,
  fileName,
  onBack,
  onApprove
}) => {
  const { user } = useAuth();
  const [parsingResult, setParsingResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadParsingResult();
  }, [parsingResultId]);

  const loadParsingResult = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contract_parsing_results')
        .select('*')
        .eq('id', parsingResultId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setParsingResult(data);
    } catch (err: any) {
      console.error('Error loading parsing result:', err);
      setError(err.message);
      toast.error('Failed to load contract analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (onApprove && parsingResult) {
      onApprove({
        parsedData: parsingResult.parsed_data,
        extractedText: parsingResult.original_text,
        confidence: parsingResult.parsing_confidence,
        pdfUrl,
        fileName
      });
    }
  };

  const handleReprocess = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Call the parse-contract function again
      const { data, error } = await supabase.functions.invoke('parse-contract', {
        body: {
          fileUrl: pdfUrl,
          fileName: fileName,
          userId: user.id
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Reload the parsing result
      await loadParsingResult();
      toast.success('Contract reprocessed successfully');
    } catch (err: any) {
      console.error('Error reprocessing contract:', err);
      toast.error('Failed to reprocess contract');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading contract analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold">Error Loading Contract</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={loadParsingResult}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!parsingResult) return null;

    const status = parsingResult.parsing_status;
    const confidence = parsingResult.parsing_confidence || 0;

    if (status === 'completed') {
      if (confidence > 0.7) {
        return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
      } else if (confidence > 0.4) {
        return <Badge variant="secondary">Medium Confidence</Badge>;
      } else {
        return <Badge variant="destructive">Low Confidence</Badge>;
      }
    }

    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-lg font-semibold">Contract Review</h1>
                <p className="text-sm text-muted-foreground">{fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReprocess}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reprocess
                </Button>
                {onApprove && parsingResult?.parsing_status === 'completed' && (
                  <Button onClick={handleApprove}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Create Contract
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {parsingResult?.parsing_confidence !== undefined && (
            <div className="mt-3">
              <Alert className={
                parsingResult.parsing_confidence > 0.7 ? "border-green-200 bg-green-50" :
                parsingResult.parsing_confidence > 0.4 ? "border-yellow-200 bg-yellow-50" :
                "border-red-200 bg-red-50"
              }>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Contract analysis completed with {Math.round(parsingResult.parsing_confidence * 100)}% confidence.
                  {parsingResult.parsing_confidence < 0.7 && " Please review the extracted terms carefully."}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
        {/* PDF Viewer */}
        <div className="order-2 lg:order-1">
          <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
        </div>

        {/* Contract Terms */}
        <div className="order-1 lg:order-2">
          {parsingResult && (
            <ContractTermsDisplay
              parsedData={parsingResult.parsed_data}
              confidence={parsingResult.parsing_confidence}
              extractedText={parsingResult.original_text}
            />
          )}
        </div>
      </div>
    </div>
  );
};