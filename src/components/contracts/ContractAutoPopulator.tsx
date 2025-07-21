
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
        <div className="space-y-4">
          {confidence >= 0.8 ? (
            <p className="text-sm text-green-600">
              High confidence parsing detected. The extracted data appears accurate and complete.
            </p>
          ) : confidence >= 0.6 ? (
            <p className="text-sm text-yellow-600">
              Medium confidence parsing. Please review the extracted data before proceeding.
            </p>
          ) : (
            <p className="text-sm text-red-600">
              Low confidence parsing detected. Manual review strongly recommended.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <h4 className="font-medium">Extracted Information Preview:</h4>
          
          {/* Basic Contract Info */}
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
          </div>

          {/* Parties Information */}
          {parsedData.parties && parsedData.parties.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Parties</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {parsedData.parties.map((party, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-medium capitalize">{party.role}:</div>
                    <p className="text-muted-foreground">{party.name}</p>
                    {party.contact_info && (
                      <div className="mt-2 space-y-1">
                        {party.contact_info.email && (
                          <p className="text-xs text-muted-foreground">📧 {party.contact_info.email}</p>
                        )}
                        {party.contact_info.phone && (
                          <p className="text-xs text-muted-foreground">📞 {party.contact_info.phone}</p>
                        )}
                        {party.contact_info.address && (
                          <p className="text-xs text-muted-foreground">📍 {party.contact_info.address}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Terms */}
          {parsedData.financial_terms && (
            <div>
              <h5 className="font-medium mb-2">Financial Terms</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {parsedData.financial_terms.advance_amount && (
                  <div>
                    <span className="font-medium">Advance:</span>
                    <p className="text-muted-foreground">${parsedData.financial_terms.advance_amount.toLocaleString()}</p>
                  </div>
                )}
                {parsedData.financial_terms.commission_percentage && (
                  <div>
                    <span className="font-medium">Commission:</span>
                    <p className="text-muted-foreground">{(parsedData.financial_terms.commission_percentage * 100).toFixed(1)}%</p>
                  </div>
                )}
                {parsedData.financial_terms.royalty_rates?.mechanical && (
                  <div>
                    <span className="font-medium">Mechanical Royalty:</span>
                    <p className="text-muted-foreground">{(parsedData.financial_terms.royalty_rates.mechanical * 100).toFixed(1)}%</p>
                  </div>
                )}
                {parsedData.financial_terms.royalty_rates?.performance && (
                  <div>
                    <span className="font-medium">Performance Royalty:</span>
                    <p className="text-muted-foreground">{(parsedData.financial_terms.royalty_rates.performance * 100).toFixed(1)}%</p>
                  </div>
                )}
                {parsedData.financial_terms.royalty_rates?.synchronization && (
                  <div>
                    <span className="font-medium">Sync Royalty:</span>
                    <p className="text-muted-foreground">{(parsedData.financial_terms.royalty_rates.synchronization * 100).toFixed(1)}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Dates */}
          {parsedData.key_dates && (
            <div>
              <h5 className="font-medium mb-2">Key Dates</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {parsedData.key_dates.start_date && (
                  <div>
                    <span className="font-medium">Start Date:</span>
                    <p className="text-muted-foreground">{parsedData.key_dates.start_date}</p>
                  </div>
                )}
                {parsedData.key_dates.end_date && (
                  <div>
                    <span className="font-medium">End Date:</span>
                    <p className="text-muted-foreground">{parsedData.key_dates.end_date}</p>
                  </div>
                )}
                {parsedData.key_dates.renewal_terms && (
                  <div>
                    <span className="font-medium">Renewal Terms:</span>
                    <p className="text-muted-foreground">{parsedData.key_dates.renewal_terms}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Works Covered */}
          {parsedData.works_covered && parsedData.works_covered.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Works Covered ({parsedData.works_covered.length})</h5>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {parsedData.works_covered.slice(0, 5).map((work, index) => (
                  <div key={index} className="border rounded p-2 text-sm">
                    <div className="font-medium">{work.title}</div>
                    {work.artist && <p className="text-muted-foreground">Artist: {work.artist}</p>}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {work.isrc && <span>ISRC: {work.isrc}</span>}
                      {work.iswc && <span>ISWC: {work.iswc}</span>}
                    </div>
                  </div>
                ))}
                {parsedData.works_covered.length > 5 && (
                  <p className="text-xs text-muted-foreground">...and {parsedData.works_covered.length - 5} more works</p>
                )}
              </div>
            </div>
          )}

          {/* Additional Terms */}
          {(parsedData.payment_terms || parsedData.recoupment_status || parsedData.termination_clauses || parsedData.additional_terms) && (
            <div>
              <h5 className="font-medium mb-2">Additional Terms</h5>
              <div className="space-y-2 text-sm">
                {parsedData.payment_terms && (
                  <div>
                    <span className="font-medium">Payment Terms:</span>
                    <p className="text-muted-foreground">{parsedData.payment_terms}</p>
                  </div>
                )}
                {parsedData.recoupment_status && (
                  <div>
                    <span className="font-medium">Recoupment:</span>
                    <p className="text-muted-foreground">{parsedData.recoupment_status}</p>
                  </div>
                )}
                {parsedData.termination_clauses && (
                  <div>
                    <span className="font-medium">Termination:</span>
                    <p className="text-muted-foreground">{parsedData.termination_clauses}</p>
                  </div>
                )}
                {parsedData.additional_terms && (
                  <div>
                    <span className="font-medium">Additional Terms:</span>
                    <p className="text-muted-foreground">{parsedData.additional_terms}</p>
                  </div>
                )}
              </div>
            </div>
          )}
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
