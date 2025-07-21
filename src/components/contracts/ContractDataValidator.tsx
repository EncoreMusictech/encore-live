
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ValidationResult {
  field: string;
  status: 'valid' | 'warning' | 'error' | 'missing';
  message: string;
  value?: any;
}

interface ContractDataValidatorProps {
  parsedData: any;
  confidence: number;
}

export const ContractDataValidator: React.FC<ContractDataValidatorProps> = ({
  parsedData,
  confidence
}) => {
  const validateContractData = (): ValidationResult[] => {
    const results: ValidationResult[] = [];

    // Contract Type Validation
    if (!parsedData.contract_type || parsedData.contract_type === 'other') {
      results.push({
        field: 'Contract Type',
        status: 'warning',
        message: 'Contract type could not be determined accurately',
        value: parsedData.contract_type
      });
    } else {
      results.push({
        field: 'Contract Type',
        status: 'valid',
        message: 'Contract type successfully identified',
        value: parsedData.contract_type
      });
    }

    // Parties Validation
    if (!parsedData.parties || parsedData.parties.length < 2) {
      results.push({
        field: 'Parties',
        status: 'error',
        message: 'At least two parties are required for a valid contract',
        value: parsedData.parties?.length || 0
      });
    } else {
      results.push({
        field: 'Parties',
        status: 'valid',
        message: `${parsedData.parties.length} parties identified`,
        value: parsedData.parties.length
      });
    }

    // Financial Terms Validation
    const hasFinancialTerms = parsedData.financial_terms && 
      (parsedData.financial_terms.advance_amount !== null || 
       parsedData.financial_terms.commission_percentage !== null ||
       parsedData.financial_terms.royalty_rates);

    if (!hasFinancialTerms) {
      results.push({
        field: 'Financial Terms',
        status: 'warning',
        message: 'No financial terms detected - may require manual entry',
        value: null
      });
    } else {
      results.push({
        field: 'Financial Terms',
        status: 'valid',
        message: 'Financial terms successfully extracted',
        value: parsedData.financial_terms
      });
    }

    // Dates Validation
    const hasDates = parsedData.key_dates && 
      (parsedData.key_dates.start_date || parsedData.key_dates.end_date);

    if (!hasDates) {
      results.push({
        field: 'Contract Dates',
        status: 'warning',
        message: 'Contract dates not found - may need manual input',
        value: null
      });
    } else {
      results.push({
        field: 'Contract Dates',
        status: 'valid',
        message: 'Contract dates successfully extracted',
        value: parsedData.key_dates
      });
    }

    // Territory Validation
    if (!parsedData.territory || parsedData.territory.trim().length === 0) {
      results.push({
        field: 'Territory',
        status: 'missing',
        message: 'Territory information not found',
        value: null
      });
    } else {
      results.push({
        field: 'Territory',
        status: 'valid',
        message: 'Territory information extracted',
        value: parsedData.territory
      });
    }

    // Commission Validation
    if (parsedData.financial_terms?.commission_percentage) {
      const commission = parsedData.financial_terms.commission_percentage;
      if (commission < 0 || commission > 1) {
        results.push({
          field: 'Commission Rate',
          status: 'error',
          message: 'Commission rate appears invalid (should be between 0-100%)',
          value: commission
        });
      } else {
        results.push({
          field: 'Commission Rate',
          status: 'valid',
          message: `Commission rate: ${(commission * 100).toFixed(1)}%`,
          value: commission
        });
      }
    }

    return results;
  };

  const validationResults = validateContractData();
  const validCount = validationResults.filter(r => r.status === 'valid').length;
  const warningCount = validationResults.filter(r => r.status === 'warning').length;
  const errorCount = validationResults.filter(r => r.status === 'error').length;
  const missingCount = validationResults.filter(r => r.status === 'missing').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'missing':
        return <Info className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'missing':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const overallQuality = () => {
    if (errorCount > 0) return { level: 'Poor', color: 'text-red-600 bg-red-50 border-red-200' };
    if (warningCount > validCount) return { level: 'Fair', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    if (validCount >= 4) return { level: 'Good', color: 'text-green-600 bg-green-50 border-green-200' };
    return { level: 'Fair', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
  };

  const quality = overallQuality();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Quality Assessment</CardTitle>
          <Badge className={quality.color}>
            {quality.level} Quality
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{validCount}</div>
            <div className="text-xs text-muted-foreground">Valid</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-600">{missingCount}</div>
            <div className="text-xs text-muted-foreground">Missing</div>
          </div>
        </div>

        {errorCount > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Critical errors detected. Manual review required before proceeding.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <h4 className="font-medium">Validation Results:</h4>
          <div className="space-y-2">
            {validationResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <span className="font-medium">{result.field}</span>
                    <p className={`text-sm ${getStatusColor(result.status)}`}>
                      {result.message}
                    </p>
                  </div>
                </div>
                {result.value && (
                  <Badge variant="outline" className="text-xs">
                    {typeof result.value === 'object' ? 'Data Available' : String(result.value)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Confidence Score: {Math.round(confidence * 100)}% | 
            Quality Assessment: {quality.level} | 
            {errorCount === 0 ? 'Ready for review' : 'Requires manual correction'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
