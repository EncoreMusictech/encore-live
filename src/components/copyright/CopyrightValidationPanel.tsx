import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Code, 
  Info,
  RefreshCw
} from 'lucide-react';
import { Copyright, CopyrightWriter, CopyrightPublisher } from '@/hooks/useCopyright';

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
}

interface ValidationResult {
  isValid: boolean;
  compliance: {
    cwr: number;
    ddex: number;
  };
  issues: ValidationIssue[];
  completeness: number;
}

interface CopyrightValidationPanelProps {
  copyright: Copyright;
  writers: CopyrightWriter[];
  publishers: CopyrightPublisher[];
  onValidationComplete?: (result: ValidationResult) => void;
}

export const CopyrightValidationPanel: React.FC<CopyrightValidationPanelProps> = ({
  copyright,
  writers,
  publishers,
  onValidationComplete
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const validateCopyright = () => {
    setValidating(true);
    
    setTimeout(() => {
      const issues: ValidationIssue[] = [];
      
      // Core field validation
      if (!copyright.work_title?.trim()) {
        issues.push({
          severity: 'error',
          field: 'work_title',
          message: 'Work title is required',
          suggestion: 'Add a descriptive title for the musical work'
        });
      }

      if (!copyright.language_code) {
        issues.push({
          severity: 'warning',
          field: 'language_code',
          message: 'Language code missing',
          suggestion: 'Specify the language of the work for better compliance'
        });
      }

      if (!copyright.work_type) {
        issues.push({
          severity: 'warning',
          field: 'work_type',
          message: 'Work type not specified',
          suggestion: 'Specify if this is an original work, arrangement, or translation'
        });
      }

      // ISWC validation
      if (copyright.iswc && !/^T-\d{9}-\d$/.test(copyright.iswc)) {
        issues.push({
          severity: 'error',
          field: 'iswc',
          message: 'Invalid ISWC format',
          suggestion: 'ISWC should follow format T-123456789-0'
        });
      }

      // Writer validation
      if (writers.length === 0) {
        issues.push({
          severity: 'error',
          field: 'writers',
          message: 'At least one writer is required',
          suggestion: 'Add writer information including name and ownership percentage'
        });
      } else {
        const totalWriterShare = writers.reduce((sum, w) => sum + w.ownership_percentage, 0);
        if (totalWriterShare > 100) {
          issues.push({
            severity: 'error',
            field: 'writers',
            message: `Writer shares exceed 100% (${totalWriterShare}%)`,
            suggestion: 'Adjust writer ownership percentages to total 100% or less'
          });
        } else if (totalWriterShare < 100) {
          issues.push({
            severity: 'warning',
            field: 'writers',
            message: `Writer shares total ${totalWriterShare}% (less than 100%)`,
            suggestion: 'Consider if additional writers should be added'
          });
        }

        writers.forEach((writer, index) => {
          if (!writer.writer_name?.trim()) {
            issues.push({
              severity: 'error',
              field: 'writers',
              message: `Writer ${index + 1} name is missing`,
              suggestion: 'Provide the full legal name of the writer'
            });
          }

          if (writer.ipi_number && !/^\d{9,11}$/.test(writer.ipi_number.replace(/\D/g, ''))) {
            issues.push({
              severity: 'warning',
              field: 'writers',
              message: `Writer ${writer.writer_name} has invalid IPI number format`,
              suggestion: 'IPI numbers should be 9-11 digits'
            });
          }
        });
      }

      // Publisher validation
      if (publishers.length > 0) {
        const totalPublisherShare = publishers.reduce((sum, p) => sum + p.ownership_percentage, 0);
        if (totalPublisherShare > 100) {
          issues.push({
            severity: 'error',
            field: 'publishers',
            message: `Publisher shares exceed 100% (${totalPublisherShare}%)`,
            suggestion: 'Adjust publisher ownership percentages'
          });
        }

        publishers.forEach((publisher, index) => {
          if (!publisher.publisher_name?.trim()) {
            issues.push({
              severity: 'error',
              field: 'publishers',
              message: `Publisher ${index + 1} name is missing`,
              suggestion: 'Provide the full legal name of the publisher'
            });
          }
        });
      }

      // Calculate compliance scores
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;
      
      const maxScore = 100;
      const errorPenalty = errorCount * 25;
      const warningPenalty = warningCount * 10;
      
      const cwrCompliance = Math.max(0, maxScore - errorPenalty - warningPenalty);
      const ddexCompliance = Math.max(0, maxScore - errorPenalty - (warningPenalty * 0.5));

      // Calculate completeness
      const requiredFields = [
        'work_title', 'language_code', 'work_type', 'creation_date'
      ];
      const completedRequired = requiredFields.filter(field => 
        copyright[field as keyof Copyright]
      ).length;
      
      const optionalFields = ['iswc', 'notes', 'duration_seconds'];
      const completedOptional = optionalFields.filter(field => 
        copyright[field as keyof Copyright]
      ).length;
      
      const completeness = Math.round(
        ((completedRequired / requiredFields.length) * 70) + 
        ((completedOptional / optionalFields.length) * 30)
      );

      const result: ValidationResult = {
        isValid: errorCount === 0,
        compliance: {
          cwr: cwrCompliance,
          ddex: ddexCompliance
        },
        issues,
        completeness
      };

      setValidationResult(result);
      onValidationComplete?.(result);
      setValidating(false);
    }, 1000);
  };

  useEffect(() => {
    validateCopyright();
  }, [copyright, writers, publishers]);

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 50) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!validationResult && !validating) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Button onClick={validateCopyright}>
            Run Validation Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CWR/DDEX Compliance
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={validateCopyright}
            disabled={validating}
          >
            {validating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="mb-2">
              <div className={`text-2xl font-bold ${getComplianceColor(validationResult?.compliance.cwr || 0)}`}>
                {validationResult?.compliance.cwr || 0}%
              </div>
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">CWR</span>
              </div>
            </div>
            {getComplianceBadge(validationResult?.compliance.cwr || 0)}
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <div className={`text-2xl font-bold ${getComplianceColor(validationResult?.compliance.ddex || 0)}`}>
                {validationResult?.compliance.ddex || 0}%
              </div>
              <div className="flex items-center justify-center gap-2">
                <Code className="h-4 w-4" />
                <span className="text-sm font-medium">DDEX</span>
              </div>
            </div>
            {getComplianceBadge(validationResult?.compliance.ddex || 0)}
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <div className={`text-2xl font-bold ${getComplianceColor(validationResult?.completeness || 0)}`}>
                {validationResult?.completeness || 0}%
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            </div>
            <Progress 
              value={validationResult?.completeness || 0} 
              className="w-full h-2"
            />
          </div>
        </div>

        {/* Overall Status */}
        {validationResult && (
          <Alert className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="font-medium">
                {validationResult.isValid ? 'Ready for Export' : 'Issues Found'}
              </span>
            </div>
            <AlertDescription className="mt-1">
              {validationResult.isValid 
                ? 'This copyright meets the requirements for CWR and DDEX export.'
                : `${validationResult.issues.filter(i => i.severity === 'error').length} error(s) and ${validationResult.issues.filter(i => i.severity === 'warning').length} warning(s) found.`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Issues */}
        {validationResult && validationResult.issues.length > 0 && (
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="errors">
                Errors ({validationResult.issues.filter(i => i.severity === 'error').length})
              </TabsTrigger>
              <TabsTrigger value="warnings">
                Warnings ({validationResult.issues.filter(i => i.severity === 'warning').length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="errors" className="space-y-3">
              {validationResult.issues
                .filter(issue => issue.severity === 'error')
                .map((issue, index) => (
                  <div key={index} className="flex gap-3 p-3 border rounded-lg bg-red-50 border-red-200">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{issue.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">Field: {issue.field}</div>
                      {issue.suggestion && (
                        <div className="text-xs text-blue-600 mt-1">{issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                ))}
              {validationResult.issues.filter(i => i.severity === 'error').length === 0 && (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  No errors found
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="warnings" className="space-y-3">
              {validationResult.issues
                .filter(issue => issue.severity === 'warning')
                .map((issue, index) => (
                  <div key={index} className="flex gap-3 p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{issue.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">Field: {issue.field}</div>
                      {issue.suggestion && (
                        <div className="text-xs text-blue-600 mt-1">{issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                ))}
              {validationResult.issues.filter(i => i.severity === 'warning').length === 0 && (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  No warnings found
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};