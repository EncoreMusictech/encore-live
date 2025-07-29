import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Code, 
  Info,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Shield,
  Award,
  Clock
} from 'lucide-react';
import { Copyright, CopyrightWriter, CopyrightPublisher, CopyrightRecording } from '@/hooks/useCopyright';
import { validateCWRCompliance, CWRValidationResult, validateFieldRealTime } from '@/lib/cwr-validation';

interface EnhancedCWRValidationProps {
  copyright: Copyright;
  writers: CopyrightWriter[];
  publishers: CopyrightPublisher[];
  recordings?: CopyrightRecording[];
  onValidationComplete?: (result: CWRValidationResult) => void;
  realTimeMode?: boolean;
}

export const EnhancedCWRValidation: React.FC<EnhancedCWRValidationProps> = ({
  copyright,
  writers,
  publishers,
  recordings = [],
  onValidationComplete,
  realTimeMode = false
}) => {
  const [validationResult, setValidationResult] = useState<CWRValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    warnings: false,
    compliance: false,
    fieldDetails: false
  });

  // Real-time validation
  const runValidation = useMemo(() => {
    if (!realTimeMode) return () => {};
    
    return () => {
      setValidating(true);
      
      setTimeout(() => {
        const result = validateCWRCompliance(copyright, writers, publishers, recordings);
        setValidationResult(result);
        onValidationComplete?.(result);
        setValidating(false);
      }, 200); // Reduced delay for real-time
    };
  }, [copyright, writers, publishers, recordings, realTimeMode, onValidationComplete]);

  // Manual validation
  const validateCopyright = () => {
    setValidating(true);
    
    setTimeout(() => {
      const result = validateCWRCompliance(copyright, writers, publishers, recordings);
      setValidationResult(result);
      onValidationComplete?.(result);
      setValidating(false);
    }, 1000);
  };

  useEffect(() => {
    if (realTimeMode) {
      runValidation();
    }
  }, [realTimeMode, runValidation]);

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (score: number, label: string) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 border-green-200">{label}: Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{label}: Good</Badge>;
    if (score >= 50) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{label}: Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-red-200">{label}: Poor</Badge>;
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!validationResult && !validating && !realTimeMode) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">CWR 2.1 Compliance Check</h3>
          <p className="text-muted-foreground mb-4">
            Validate your copyright registration against industry standards
          </p>
          <Button onClick={validateCopyright} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Run Comprehensive Validation
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
            <Shield className="h-5 w-5" />
            CWR 2.1 Compliance Analysis
            {realTimeMode && <Badge variant="outline" className="text-xs">Real-time</Badge>}
          </CardTitle>
          {!realTimeMode && (
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
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {validating && (
          <div className="text-center py-4">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground">
              Running CWR 2.1 compliance validation...
            </p>
          </div>
        )}

        {validationResult && (
          <>
            {/* Compliance Scores Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="mb-3">
                  <div className={`text-3xl font-bold ${getComplianceColor(validationResult.compliance.cwr21)}`}>
                    {validationResult.compliance.cwr21}%
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>CWR 2.1</span>
                  </div>
                </div>
                <Progress value={validationResult.compliance.cwr21} className="mb-2" />
                {getComplianceBadge(validationResult.compliance.cwr21, 'CWR')}
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="mb-3">
                  <div className={`text-3xl font-bold ${getComplianceColor(validationResult.compliance.ddex)}`}>
                    {validationResult.compliance.ddex}%
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Code className="h-4 w-4" />
                    <span>DDEX</span>
                  </div>
                </div>
                <Progress value={validationResult.compliance.ddex} className="mb-2" />
                {getComplianceBadge(validationResult.compliance.ddex, 'DDEX')}
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="mb-3">
                  <div className={`text-3xl font-bold ${getComplianceColor(validationResult.compliance.format)}`}>
                    {validationResult.compliance.format}%
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>Format</span>
                  </div>
                </div>
                <Progress value={validationResult.compliance.format} className="mb-2" />
                {getComplianceBadge(validationResult.compliance.format, 'Format')}
              </div>
            </div>

            {/* Overall Status */}
            <Alert className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium text-lg">
                  {validationResult.isValid ? 'Ready for Export' : 'Issues Detected'}
                </span>
              </div>
              <AlertDescription className="mt-2">
                {validationResult.isValid 
                  ? 'This copyright registration meets CWR 2.1 and DDEX standards for professional submission.'
                  : `Found ${validationResult.errors.length} error(s) and ${validationResult.warnings.length} warning(s) that should be addressed.`
                }
              </AlertDescription>
            </Alert>

            {/* Issues Breakdown */}
            {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
              <div className="space-y-4">
                {/* Critical Errors */}
                {validationResult.errors.length > 0 && (
                  <Collapsible 
                    open={expandedSections.errors} 
                    onOpenChange={() => toggleSection('errors')}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 border border-red-200 bg-red-50">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium">Critical Errors ({validationResult.errors.length})</span>
                        </div>
                        {expandedSections.errors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="flex gap-3 p-3 border rounded-lg bg-red-50 border-red-200">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-red-800">{error}</div>
                            <div className="text-xs text-red-600 mt-1">
                              Must be fixed before export
                            </div>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <Collapsible 
                    open={expandedSections.warnings} 
                    onOpenChange={() => toggleSection('warnings')}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 border border-yellow-200 bg-yellow-50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium">Warnings ({validationResult.warnings.length})</span>
                        </div>
                        {expandedSections.warnings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="flex gap-3 p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-yellow-800">{warning}</div>
                            <div className="text-xs text-yellow-600 mt-1">
                              Recommended to fix for optimal compliance
                            </div>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}

            {/* All Clear State */}
            {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-green-200 rounded-lg bg-green-50">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Perfect Compliance
                </h3>
                <p className="text-green-600">
                  Your copyright registration meets all CWR 2.1 and DDEX requirements.
                </p>
              </div>
            )}

            {/* Submission Readiness Indicator */}
            <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Last validated: {new Date().toLocaleTimeString()}
                </span>
              </div>
              {validationResult.isValid && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Ready for Submission
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};