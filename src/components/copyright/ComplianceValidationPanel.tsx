import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Globe, 
  FileText, 
  Users,
  Building,
  Music,
  Loader2,
  Shield
} from 'lucide-react';
import { 
  validateCopyrightData, 
  ValidationResult,
  TERRITORY_MAPPINGS,
  transformContractData 
} from '@/lib/copyright-field-mappings';
import { useContractLinking } from '@/hooks/useContractLinking';

interface ComplianceValidationPanelProps {
  copyright: any;
  writers?: any[];
  publishers?: any[];
  recordings?: any[];
  onValidationComplete?: (isValid: boolean, score: number) => void;
}

export const ComplianceValidationPanel: React.FC<ComplianceValidationPanelProps> = ({
  copyright,
  writers = [],
  publishers = [],
  recordings = [],
  onValidationComplete
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const [linkedContracts, setLinkedContracts] = useState<any[]>([]);
  const [validating, setValidating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const { getLinkedContracts } = useContractLinking();

  useEffect(() => {
    if (copyright?.id) {
      loadLinkedContracts();
      runValidation();
    }
  }, [copyright, writers, publishers, recordings]);

  const loadLinkedContracts = async () => {
    if (!copyright?.id) return;
    
    try {
      const contracts = await getLinkedContracts(copyright.id);
      setLinkedContracts(contracts);
    } catch (error) {
      console.error('Failed to load linked contracts:', error);
    }
  };

  const runValidation = async () => {
    if (!copyright) return;
    
    setValidating(true);
    
    try {
      // Enhance copyright data with contract information
      const contractData = linkedContracts.length > 0 ? linkedContracts[0] : null;
      const enhancedData = transformContractData(copyright, contractData);
      
      // Run field validation
      const fieldValidation = validateCopyrightData(enhancedData);
      
      // Additional business validations
      const businessValidation = validateBusinessRules();
      
      const combined: ValidationResult = {
        isValid: fieldValidation.isValid && businessValidation.isValid,
        errors: [...fieldValidation.errors, ...businessValidation.errors],
        warnings: [...fieldValidation.warnings, ...businessValidation.warnings]
      };
      
      setValidationResult(combined);
      
      // Calculate compliance score
      const score = calculateComplianceScore(combined);
      setComplianceScore(score);
      
      onValidationComplete?.(combined.isValid, score);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setValidating(false);
    }
  };

  const validateBusinessRules = (): ValidationResult => {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    // Writer ownership validation
    if (writers.length > 0) {
      const totalWriterShare = writers.reduce((sum, writer) => sum + (writer.ownership_percentage || 0), 0);
      
      if (totalWriterShare > 100) {
        result.isValid = false;
        result.errors.push(`Writer shares exceed 100% (${totalWriterShare}%)`);
      } else if (totalWriterShare < 100) {
        result.warnings.push(`Writer shares total less than 100% (${totalWriterShare}%)`);
      }
    } else {
      result.warnings.push('No writers specified');
    }

    // Publisher ownership validation
    if (publishers.length > 0) {
      const totalPublisherShare = publishers.reduce((sum, pub) => sum + (pub.ownership_percentage || 0), 0);
      
      if (totalPublisherShare > 100) {
        result.isValid = false;
        result.errors.push(`Publisher shares exceed 100% (${totalPublisherShare}%)`);
      }
    }

    // Territory validation
    if (!copyright.collection_territories?.length && linkedContracts.length === 0) {
      result.warnings.push('No territories specified, defaulting to worldwide');
    }

    // Contract validation
    if (linkedContracts.length > 0) {
      linkedContracts.forEach((contract, index) => {
        if (!contract.start_date) {
          result.warnings.push(`Contract ${index + 1} missing start date`);
        }
        if (contract.controlled_percentage === null || contract.controlled_percentage === undefined) {
          result.warnings.push(`Contract ${index + 1} missing controlled percentage`);
        }
      });
    }

    return result;
  };

  const calculateComplianceScore = (validation: ValidationResult): number => {
    let score = 100;
    
    // Deduct for errors (critical issues)
    score -= validation.errors.length * 20;
    
    // Deduct for warnings (minor issues)
    score -= validation.warnings.length * 5;
    
    // Bonus for having required fields
    if (copyright.work_title) score += 5;
    if (copyright.iswc) score += 5;
    if (copyright.language_code) score += 5;
    if (writers.length > 0) score += 10;
    if (linkedContracts.length > 0) score += 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!copyright) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Select a copyright to view compliance validation
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          CWR/DDEX Compliance Validation
          {validating && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Compliance Score</span>
            <Badge variant={getScoreBadgeVariant(complianceScore)}>
              {complianceScore}%
            </Badge>
          </div>
          <Progress value={complianceScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Score based on field completeness, validation rules, and industry standards
          </p>
        </div>

        <Separator />

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">
                  {validationResult.isValid ? 'Compliance Check Passed' : 'Compliance Issues Found'}
                </span>
              </div>
              {(!validationResult.isValid || validationResult.warnings.length > 0) && (
                <AlertDescription className="mt-2">
                  <div className="space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <XCircle className="h-3 w-3 text-red-500" />
                        {error}
                      </div>
                    ))}
                    {validationResult.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-yellow-700">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        {warning}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              )}
            </Alert>

            {/* Detailed Sections */}
            <div className="space-y-3">
              {/* Work Information */}
              <div className="border rounded-lg p-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('work')}
                  className="w-full justify-between p-0 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <span className="font-medium">Work Information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {copyright.work_title && copyright.language_code ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </Button>
                {expandedSections.has('work') && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Work Title:</span>
                      <span className={copyright.work_title ? 'text-green-600' : 'text-red-600'}>
                        {copyright.work_title ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ISWC:</span>
                      <span className={copyright.iswc ? 'text-green-600' : 'text-yellow-600'}>
                        {copyright.iswc ? '✓' : 'Optional'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Language Code:</span>
                      <span className={copyright.language_code ? 'text-green-600' : 'text-yellow-600'}>
                        {copyright.language_code || 'Not specified'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Writers */}
              <div className="border rounded-lg p-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('writers')}
                  className="w-full justify-between p-0 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Writers ({writers.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {writers.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </Button>
                {expandedSections.has('writers') && (
                  <div className="mt-3 space-y-2 text-sm">
                    {writers.map((writer, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{writer.writer_name}</span>
                        <Badge variant="outline">
                          {writer.ownership_percentage}%
                        </Badge>
                      </div>
                    ))}
                    {writers.length === 0 && (
                      <div className="text-muted-foreground">No writers specified</div>
                    )}
                  </div>
                )}
              </div>

              {/* Publishers */}
              <div className="border rounded-lg p-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('publishers')}
                  className="w-full justify-between p-0 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">Publishers ({publishers.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {publishers.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </Button>
                {expandedSections.has('publishers') && (
                  <div className="mt-3 space-y-2 text-sm">
                    {publishers.map((publisher, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{publisher.publisher_name}</span>
                        <Badge variant="outline">
                          {publisher.ownership_percentage}%
                        </Badge>
                      </div>
                    ))}
                    {publishers.length === 0 && (
                      <div className="text-muted-foreground">No publishers specified</div>
                    )}
                  </div>
                )}
              </div>

              {/* Territories */}
              <div className="border rounded-lg p-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('territories')}
                  className="w-full justify-between p-0 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Territories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {copyright.collection_territories?.length > 0 || linkedContracts.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </Button>
                {expandedSections.has('territories') && (
                  <div className="mt-3 space-y-2 text-sm">
                    {copyright.collection_territories?.map((territory: string, index: number) => {
                      const mapping = TERRITORY_MAPPINGS.find(t => t.code === territory);
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span>{mapping?.name || territory}</span>
                          <Badge variant="outline" className="text-xs">
                            {mapping?.cwrCode || 'Unknown'}
                          </Badge>
                        </div>
                      );
                    })}
                    {linkedContracts.map((contract, index) => (
                      <div key={`contract-${index}`} className="space-y-1">
                        <span className="text-muted-foreground">From Contract:</span>
                        {contract.territories?.map((territory: string, tIndex: number) => {
                          const mapping = TERRITORY_MAPPINGS.find(t => t.code === territory);
                          return (
                            <div key={tIndex} className="flex items-center justify-between ml-4">
                              <span>{mapping?.name || territory}</span>
                              <Badge variant="outline" className="text-xs">
                                {mapping?.cwrCode || 'Unknown'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {!copyright.collection_territories?.length && linkedContracts.length === 0 && (
                      <div className="text-muted-foreground">Defaulting to Worldwide</div>
                    )}
                  </div>
                )}
              </div>

              {/* Contracts */}
              <div className="border rounded-lg p-3">
                <Button
                  variant="ghost"
                  onClick={() => toggleSection('contracts')}
                  className="w-full justify-between p-0 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Linked Contracts ({linkedContracts.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {linkedContracts.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </Button>
                {expandedSections.has('contracts') && (
                  <div className="mt-3 space-y-2 text-sm">
                    {linkedContracts.map((contract, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{contract.title}</span>
                          <Badge variant="outline">
                            {contract.controlled_percentage}%
                          </Badge>
                        </div>
                        <div className="text-muted-foreground ml-4">
                          Type: {contract.contract_type} | Status: {contract.contract_status}
                        </div>
                      </div>
                    ))}
                    {linkedContracts.length === 0 && (
                      <div className="text-muted-foreground">No contracts linked</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runValidation}
            disabled={validating}
            className="flex-1"
          >
            {validating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Validating
              </>
            ) : (
              'Re-validate'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};