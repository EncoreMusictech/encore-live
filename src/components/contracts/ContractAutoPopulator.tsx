
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ParsedContractData {
  contract_type?: string;
  parties?: Array<{
    name: string;
    role: string;
    contact_info?: {
      email?: string;
      phone?: string;
      address?: string;
    };
  }>;
  financial_terms?: {
    advance_amount?: number;
    commission_percentage?: number;
    royalty_rates?: {
      mechanical?: number;
      performance?: number;
      synchronization?: number;
    };
  };
  key_dates?: {
    start_date?: string;
    end_date?: string;
    renewal_terms?: string;
  };
  territory?: string;
  works_covered?: Array<{
    title: string;
    artist?: string;
    isrc?: string;
    iswc?: string;
  }>;
  payment_terms?: string;
  recoupment_status?: string;
  termination_clauses?: string;
  additional_terms?: string;
}

interface ContractAutoPopulatorProps {
  parsedData: ParsedContractData;
  confidence: number;
  onAutoPopulate: (formData: any) => void;
  onEditManually: () => void;
}

export const ContractAutoPopulator: React.FC<ContractAutoPopulatorProps> = ({
  parsedData,
  confidence,
  onAutoPopulate,
  onEditManually
}) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const convertParsedDataToFormData = () => {
    const counterparty = parsedData.parties?.find(p => p.role !== 'administrator') || parsedData.parties?.[0];
    
    return {
      title: `${parsedData.contract_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Agreement`,
      counterparty_name: counterparty?.name || '',
      contract_type: parsedData.contract_type || 'other',
      start_date: parsedData.key_dates?.start_date || null,
      end_date: parsedData.key_dates?.end_date || null,
      advance_amount: parsedData.financial_terms?.advance_amount || 0,
      commission_percentage: parsedData.financial_terms?.commission_percentage ? 
        parsedData.financial_terms.commission_percentage * 100 : 0,
      territories: parsedData.territory ? [parsedData.territory] : [],
      financial_terms: parsedData.financial_terms || {},
      royalty_splits: parsedData.financial_terms?.royalty_rates || {},
      notes: [
        parsedData.payment_terms && `Payment Terms: ${parsedData.payment_terms}`,
        parsedData.recoupment_status && `Recoupment: ${parsedData.recoupment_status}`,
        parsedData.termination_clauses && `Termination: ${parsedData.termination_clauses}`,
        parsedData.additional_terms && `Additional Terms: ${parsedData.additional_terms}`
      ].filter(Boolean).join('\n\n'),
      contact_name: counterparty?.name || '',
      contact_phone: counterparty?.contact_info?.phone || '',
      contact_address: counterparty?.contact_info?.address || '',
      recipient_email: counterparty?.contact_info?.email || ''
    };
  };

  const handleAutoPopulate = () => {
    const formData = convertParsedDataToFormData();
    onAutoPopulate(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getConfidenceIcon(confidence)}
            Auto-Population Ready
          </CardTitle>
          <Badge className={getConfidenceColor(confidence)}>
            {Math.round(confidence * 100)}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className={confidence >= 0.6 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {confidence >= 0.8 ? (
              "High confidence parsing detected. The extracted data appears accurate and complete."
            ) : confidence >= 0.6 ? (
              "Medium confidence parsing. Please review the extracted data before proceeding."
            ) : (
              "Low confidence parsing detected. Manual review strongly recommended."
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Extracted Information Preview:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Contract Type:</span>
              <p className="text-muted-foreground capitalize">
                {parsedData.contract_type?.replace('_', ' ') || 'Not detected'}
              </p>
            </div>
            <div>
              <span className="font-medium">Territory:</span>
              <p className="text-muted-foreground">
                {parsedData.territory || 'Not specified'}
              </p>
            </div>
            <div>
              <span className="font-medium">Counterparty:</span>
              <p className="text-muted-foreground">
                {parsedData.parties?.find(p => p.role !== 'administrator')?.name || 'Not identified'}
              </p>
            </div>
            <div>
              <span className="font-medium">Commission:</span>
              <p className="text-muted-foreground">
                {parsedData.financial_terms?.commission_percentage ? 
                  `${(parsedData.financial_terms.commission_percentage * 100).toFixed(1)}%` : 
                  'Not specified'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleAutoPopulate} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Auto-Populate Contract
          </Button>
          <Button variant="outline" onClick={onEditManually}>
            Edit Manually
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
