import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Code, Table, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCopyrightExports, ExportOptions } from '@/hooks/useCopyrightExports';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCopyrights: string[];
  copyrightTitles: { [key: string]: string };
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  selectedCopyrights,
  copyrightTitles
}) => {
  const { exporting, exportCopyrights, validateExport } = useCopyrightExports();
  const [exportFormat, setExportFormat] = useState<'cwr' | 'ddex' | 'csv'>('csv');
  const [includeRecordings, setIncludeRecordings] = useState(true);
  const [includePublishers, setIncludePublishers] = useState(true);
  const [includeWriters, setIncludeWriters] = useState(true);
  const [validationResults, setValidationResults] = useState<{ isValid: boolean; errors: string[] } | null>(null);
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const results = await validateExport(selectedCopyrights);
      setValidationResults(results);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResults({
        isValid: false,
        errors: ['Failed to validate copyrights']
      });
    } finally {
      setValidating(false);
    }
  };

  const handleExport = async () => {
    const options: ExportOptions = {
      format: exportFormat,
      copyrightIds: selectedCopyrights,
      includeRecordings,
      includePublishers,
      includeWriters,
    };

    await exportCopyrights(options);
    onOpenChange(false);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'cwr':
        return <FileText className="h-4 w-4" />;
      case 'ddex':
        return <Code className="h-4 w-4" />;
      case 'csv':
        return <Table className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'cwr':
        return 'Common Works Registration format for PRO submissions';
      case 'ddex':
        return 'DDEX XML format for digital music distribution';
      case 'csv':
        return 'Comma-separated values for spreadsheet applications';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Copyrights</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Selected works summary */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Works ({selectedCopyrights.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-muted rounded-md border">
              {selectedCopyrights.map(id => (
                <div key={id} className="text-sm text-muted-foreground flex items-center justify-between">
                  <span className="truncate">{copyrightTitles[id] || `Work ${id.slice(0, 8)}`}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {id.slice(0, 8)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Export format selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              {(['cwr', 'ddex', 'csv'] as const).map((format) => (
                <div key={format} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={format} id={format} />
                  <div className="flex-1">
                    <Label htmlFor={format} className="flex items-center gap-2 cursor-pointer">
                      {getFormatIcon(format)}
                      <span className="font-medium">{format.toUpperCase()}</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getFormatDescription(format)}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Include options (for CSV) */}
          {exportFormat === 'csv' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Include Related Data</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-writers"
                    checked={includeWriters}
                    onCheckedChange={(checked) => setIncludeWriters(checked as boolean)}
                  />
                  <Label htmlFor="include-writers" className="text-sm">Writers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-publishers"
                    checked={includePublishers}
                    onCheckedChange={(checked) => setIncludePublishers(checked as boolean)}
                  />
                  <Label htmlFor="include-publishers" className="text-sm">Publishers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-recordings"
                    checked={includeRecordings}
                    onCheckedChange={(checked) => setIncludeRecordings(checked as boolean)}
                  />
                  <Label htmlFor="include-recordings" className="text-sm">Recordings</Label>
                </div>
              </div>
            </div>
          )}

          {/* Validation for CWR/DDEX */}
          {(exportFormat === 'cwr' || exportFormat === 'ddex') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Validation Check</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={validating}
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Validating
                    </>
                  ) : (
                    'Validate'
                  )}
                </Button>
              </div>
              
              {validationResults && (
                <Alert className={cn(
                  "border-2",
                  validationResults.isValid 
                    ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100' 
                    : 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                )}>
                  <div className="flex items-center gap-2">
                    {validationResults.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium">
                      {validationResults.isValid ? 'Validation Passed' : 'Validation Issues Found'}
                    </span>
                  </div>
                  {!validationResults.isValid && (
                    <AlertDescription className="mt-2">
                      <div className="max-h-32 overflow-y-auto">
                        <ul className="list-disc pl-4 space-y-1">
                          {validationResults.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  )}
                </Alert>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={exporting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || (exportFormat !== 'csv' && validationResults && !validationResults.isValid)}
              className="flex-1"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Exporting
                </>
              ) : (
                'Export'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};