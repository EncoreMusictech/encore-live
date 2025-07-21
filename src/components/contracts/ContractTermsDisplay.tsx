import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Globe, 
  FileText, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContractParty {
  name: string;
  role: string;
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface FinancialTerms {
  advance_amount?: number;
  royalty_rates?: {
    mechanical?: number;
    performance?: number;
    synchronization?: number;
  };
  commission_percentage?: number;
}

interface KeyDates {
  start_date?: string;
  end_date?: string;
  renewal_terms?: string;
}

interface Work {
  title: string;
  artist?: string;
  isrc?: string;
  iswc?: string;
}

interface ParsedContractData {
  contract_type?: string;
  parties?: ContractParty[];
  financial_terms?: FinancialTerms;
  key_dates?: KeyDates;
  territory?: string;
  works_covered?: Work[];
  payment_terms?: string;
  recoupment_status?: string;
  termination_clauses?: string;
  additional_terms?: string;
  raw_response?: string;
  error?: string;
}

interface ContractTermsDisplayProps {
  parsedData: ParsedContractData;
  confidence?: number;
  extractedText?: string;
}

export const ContractTermsDisplay: React.FC<ContractTermsDisplayProps> = ({
  parsedData,
  confidence,
  extractedText
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (parsedData.error || parsedData.raw_response) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Processing Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {parsedData.error ? 
                "The contract couldn't be fully parsed. Please review the extracted text below." :
                "The contract was processed but may need manual review for best results."
              }
            </AlertDescription>
          </Alert>
          
          {extractedText && (
            <div className="space-y-2">
              <h4 className="font-medium">Extracted Text:</h4>
              <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{extractedText}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Terms
          </CardTitle>
          {confidence && (
            <Badge variant={confidence > 0.7 ? "default" : "secondary"}>
              {Math.round(confidence * 100)}% confidence
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
        {/* Contract Type */}
        {parsedData.contract_type && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contract Type
            </h3>
            <Badge variant="outline" className="capitalize">
              {parsedData.contract_type}
            </Badge>
          </div>
        )}

        {/* Parties */}
        {parsedData.parties && parsedData.parties.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parties Involved
            </h3>
            <div className="space-y-3">
              {parsedData.parties.map((party, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{party.name}</span>
                    <Badge variant="secondary">{party.role}</Badge>
                  </div>
                  {party.contact_info && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {party.contact_info.email && (
                        <div>Email: {party.contact_info.email}</div>
                      )}
                      {party.contact_info.phone && (
                        <div>Phone: {party.contact_info.phone}</div>
                      )}
                      {party.contact_info.address && (
                        <div>Address: {party.contact_info.address}</div>
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
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Terms
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {parsedData.financial_terms.advance_amount && (
                <div className="flex justify-between">
                  <span>Advance Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(parsedData.financial_terms.advance_amount)}
                  </span>
                </div>
              )}
              {parsedData.financial_terms.commission_percentage && (
                <div className="flex justify-between">
                  <span>Commission:</span>
                  <span className="font-medium">
                    {formatPercentage(parsedData.financial_terms.commission_percentage)}
                  </span>
                </div>
              )}
              {parsedData.financial_terms.royalty_rates && (
                <div className="space-y-2">
                  <span className="font-medium">Royalty Rates:</span>
                  <div className="ml-4 space-y-1">
                    {parsedData.financial_terms.royalty_rates.mechanical && (
                      <div className="flex justify-between">
                        <span>Mechanical:</span>
                        <span>{formatPercentage(parsedData.financial_terms.royalty_rates.mechanical)}</span>
                      </div>
                    )}
                    {parsedData.financial_terms.royalty_rates.performance && (
                      <div className="flex justify-between">
                        <span>Performance:</span>
                        <span>{formatPercentage(parsedData.financial_terms.royalty_rates.performance)}</span>
                      </div>
                    )}
                    {parsedData.financial_terms.royalty_rates.synchronization && (
                      <div className="flex justify-between">
                        <span>Synchronization:</span>
                        <span>{formatPercentage(parsedData.financial_terms.royalty_rates.synchronization)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Dates */}
        {parsedData.key_dates && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Key Dates
            </h3>
            <div className="space-y-2">
              {parsedData.key_dates.start_date && (
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="font-medium">{formatDate(parsedData.key_dates.start_date)}</span>
                </div>
              )}
              {parsedData.key_dates.end_date && (
                <div className="flex justify-between">
                  <span>End Date:</span>
                  <span className="font-medium">{formatDate(parsedData.key_dates.end_date)}</span>
                </div>
              )}
              {parsedData.key_dates.renewal_terms && (
                <div>
                  <span className="font-medium">Renewal Terms:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {parsedData.key_dates.renewal_terms}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Territory */}
        {parsedData.territory && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Territory
            </h3>
            <p className="text-muted-foreground">{parsedData.territory}</p>
          </div>
        )}

        {/* Works Covered */}
        {parsedData.works_covered && parsedData.works_covered.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Works Covered</h3>
            <div className="space-y-2">
              {parsedData.works_covered.map((work, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="font-medium">{work.title}</div>
                  {work.artist && (
                    <div className="text-sm text-muted-foreground">Artist: {work.artist}</div>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    {work.isrc && <span>ISRC: {work.isrc}</span>}
                    {work.iswc && <span>ISWC: {work.iswc}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Terms */}
        {parsedData.payment_terms && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Terms
            </h3>
            <p className="text-muted-foreground">{parsedData.payment_terms}</p>
          </div>
        )}

        {/* Recoupment Status */}
        {parsedData.recoupment_status && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recoupment Status
            </h3>
            <Badge variant="outline">{parsedData.recoupment_status}</Badge>
          </div>
        )}

        {/* Termination Clauses */}
        {parsedData.termination_clauses && (
          <div className="space-y-2">
            <h3 className="font-semibold">Termination Clauses</h3>
            <p className="text-muted-foreground">{parsedData.termination_clauses}</p>
          </div>
        )}

        {/* Additional Terms */}
        {parsedData.additional_terms && (
          <div className="space-y-2">
            <h3 className="font-semibold">Additional Terms</h3>
            <p className="text-muted-foreground">{parsedData.additional_terms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};