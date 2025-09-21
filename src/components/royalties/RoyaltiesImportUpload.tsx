import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import { StatementParser } from "@/lib/statement-parser";
import { EncoreMapper } from "@/lib/encore-mapper";
import { useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { toast } from "@/hooks/use-toast";

interface RoyaltiesImportUploadProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export function RoyaltiesImportUpload({ onComplete, onCancel }: RoyaltiesImportUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [manualSource, setManualSource] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { name: "Parse File", status: 'pending' },
    { name: "Detect Source", status: 'pending' },
    { name: "Map Fields", status: 'pending' },
    { name: "Validate Data", status: 'pending' },
    { name: "Save to Staging", status: 'pending' },
  ]);

  const { createStagingRecord, mappingConfigs, updateMappingConfig } = useRoyaltiesImport();

  const updateStep = (stepIndex: number, status: ProcessingStep['status'], message?: string) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status, message } : step
    ));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    const parser = new StatementParser();
    const mapper = new EncoreMapper();

    try {
      // Step 1: Parse File
      updateStep(0, 'processing');
      const parsedData = await parser.parseFile(file);
      updateStep(0, 'completed', `Parsed ${parsedData.data.length} rows`);

      // Step 2: Detect Source (or use manual selection)
      updateStep(1, 'processing');
      let detectedSource = (manualSource && manualSource !== "auto-detect") ? manualSource : parsedData.detectedSource;
      if (detectedSource === 'Unknown' && (!manualSource || manualSource === "auto-detect")) {
        updateStep(1, 'error', 'Could not detect source. Please select manually.');
        return;
      }
      updateStep(1, 'completed', `Detected: ${detectedSource} (${Math.round(parsedData.confidence * 100)}% confidence)`);

      // Step 3: Map Fields with saved mappings
      updateStep(2, 'processing');
      
      // Find saved mapping configuration for this source
      const savedConfig = mappingConfigs.find(config => config.source_name === detectedSource);
      const mapperWithConfig = new EncoreMapper(undefined, savedConfig ? [savedConfig] : []);
      
      const mappingResult = mapperWithConfig.mapData(parsedData.data, detectedSource);
      
      if (savedConfig) {
        updateStep(2, 'completed', `Applied saved ${detectedSource} field mappings to ${mappingResult.mappedData.length} records`);
        console.log(`Used saved mapping configuration for ${detectedSource}:`, savedConfig.mapping_rules);
      } else {
        updateStep(2, 'completed', `Applied default ${detectedSource} mappings to ${mappingResult.mappedData.length} records (no saved mappings found)`);
      }

      // Step 4: Validate Data
      updateStep(3, 'processing');
      const hasErrors = mappingResult.validationErrors.length > 0;
      const hasUnmapped = mappingResult.unmappedFields.length > 0;
      
      // All imported statements need user approval - never auto-mark as 'processed'
      let processingStatus: 'pending' | 'needs_review' = 'pending';
      if (hasErrors || hasUnmapped) {
        processingStatus = 'needs_review';
      }

      updateStep(3, hasErrors ? 'error' : 'completed', 
        hasErrors ? `${mappingResult.validationErrors.length} validation errors - needs review` : 'Validation passed - ready for approval');

      // Step 5: Save to Staging
      updateStep(4, 'processing');
      
      console.log('About to save staging record:', {
        filename: file.name,
        detectedSource,
        recordCount: mappingResult.mappedData.length,
        hasErrors,
        hasUnmapped
      });
      
      // Import statements are not linked to batches during import
      // Batches are created manually through the Reconciliation tab
      const stagingRecord = await createStagingRecord({
        batch_id: null, // No batch association during import
        original_filename: file.name,
        detected_source: detectedSource,
        mapping_version: '1.0',
        raw_data: parsedData.data,
        mapped_data: mappingResult.mappedData,
        validation_status: {
          errors: mappingResult.validationErrors,
          hasErrors,
          hasUnmapped,
        },
        unmapped_fields: mappingResult.unmappedFields,
        processing_status: processingStatus,
        work_matches: {},
        payee_matches: {},
        import_tags: hasErrors || hasUnmapped ? ['Needs Review'] : ['Ready for Approval'],
      });

      console.log('Staging record result:', stagingRecord);

      if (!stagingRecord) {
        updateStep(4, 'error', 'Failed to save to staging table');
        return;
      }

      updateStep(4, 'completed', 'Saved to staging table');

      toast({
        title: "Import Successful",
        description: savedConfig 
          ? `Imported ${mappingResult.mappedData.length} records using saved ${detectedSource} mappings`
          : `Imported ${mappingResult.mappedData.length} records using default ${detectedSource} mappings`,
      });

      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (error) {
      console.error('Processing error:', error);
      const currentStep = steps.findIndex(step => step.status === 'processing');
      updateStep(currentStep, 'error', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const currentStepIndex = steps.findIndex(step => step.status === 'processing');
  const progress = ((steps.filter(step => step.status === 'completed').length) / steps.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Import Royalty Statement</CardTitle>
              <CardDescription>
                Upload and process a royalty statement from any supported source
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statement Source Selection */}
          <div>
            <h3 className="text-lg font-medium mb-4">1. Select Statement Source</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the statement source or use auto-detect during processing
            </p>
            <Select value={manualSource} onValueChange={setManualSource}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-detect source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto-detect">Auto-detect</SelectItem>
                <SelectItem value="BMI">BMI</SelectItem>
                <SelectItem value="ASCAP">ASCAP</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="SoundExchange">SoundExchange</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div>
            <h3 className="text-lg font-medium mb-4">2. Upload Statement File</h3>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg">Drop your statement file here</p>
                  <p className="text-sm text-muted-foreground">
                    Supports CSV, XLS, and XLSX files
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Process Button */}
          {file && (
            <div className="flex justify-end">
              <Button onClick={processFile} disabled={processing}>
                {processing ? 'Processing...' : 'Process File'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {(processing || steps.some(step => step.status !== 'pending')) && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>
              Import progress and results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.name} className="flex items-center gap-3">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="font-medium">{step.name}</div>
                    {step.message && (
                      <div className="text-sm text-muted-foreground">{step.message}</div>
                    )}
                  </div>
                  <Badge 
                    variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'error' ? 'destructive' :
                      step.status === 'processing' ? 'secondary' : 'outline'
                    }
                  >
                    {step.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}