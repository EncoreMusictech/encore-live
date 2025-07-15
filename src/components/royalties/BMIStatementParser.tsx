import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { BMIStatementMapper } from "./BMIStatementMapper";
import { toast } from "@/hooks/use-toast";

interface BMIRawRow {
  'Work Title': string;
  'ISWC': string;
  'BMI Work #': string;
  'Interested Parties (IP Names)': string;
  'Share %': number;
  'Role': string;
  'Source Code': string;
  'Usage Type': string;
  'Period': string;
  'Amount Paid': number;
  'Payment Date': string;
  [key: string]: any;
}

interface ParsedData {
  totalRows: number;
  validRows: number;
  errors: string[];
  data: BMIRawRow[];
  fileName: string;
}

export function BMIStatementParser() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showMapper, setShowMapper] = useState(false);

  const validateBMIRow = (row: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const requiredFields = ['Work Title', 'BMI Work #', 'Amount Paid'];
    
    requiredFields.forEach(field => {
      if (!row[field] || row[field] === '') {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate amount is numeric
    if (row['Amount Paid'] && isNaN(parseFloat(row['Amount Paid']))) {
      errors.push('Amount Paid must be a valid number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const parseFile = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const errors: string[] = [];
          const validData: BMIRawRow[] = [];
          let validRows = 0;

          jsonData.forEach((row: any, index: number) => {
            const validation = validateBMIRow(row);
            
            if (validation.isValid) {
              validData.push(row as BMIRawRow);
              validRows++;
            } else {
              errors.push(`Row ${index + 2}: ${validation.errors.join(', ')}`);
            }
          });

          resolve({
            totalRows: jsonData.length,
            validRows,
            errors,
            data: validData,
            fileName: file.name
          });
        } catch (error) {
          reject(new Error(`Failed to parse file: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file (.csv, .xls, .xlsx)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate processing progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await parseFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      setParsedData(result);

      toast({
        title: "File Parsed Successfully",
        description: `Processed ${result.validRows} of ${result.totalRows} rows`,
      });

    } catch (error) {
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  if (showMapper && parsedData) {
    return (
      <BMIStatementMapper 
        parsedData={parsedData}
        onBack={() => setShowMapper(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card className={`border-dashed border-2 transition-colors ${
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}>
        <CardContent 
          className="p-8"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center">
            <Upload className={`mx-auto h-16 w-16 transition-colors ${
              isDragOver ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Upload BMI Statement</h3>
              <p className="text-muted-foreground mt-2">
                Drag and drop your BMI statement file here, or click to browse
              </p>
            </div>
            <div className="mt-6">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button asChild variant="outline">
                  <span>Choose File</span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xls,.xlsx"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                disabled={isProcessing}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Supports: BMI Bulk Works Spreadsheet Template 2.0 (.csv, .xlsx, .xls)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing BMI Statement...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parse Results */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Parse Results: {parsedData.fileName}
            </CardTitle>
            <CardDescription>
              Review the parsed data before proceeding to mapping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  <strong>{parsedData.validRows}</strong> valid rows
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  <strong>{parsedData.totalRows}</strong> total rows
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm">
                  <strong>{parsedData.errors.length}</strong> errors
                </span>
              </div>
            </div>

            {/* Errors */}
            {parsedData.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Validation Errors:</strong>
                    <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                      {parsedData.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {parsedData.errors.length > 10 && (
                        <li>... and {parsedData.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Sample Data Preview */}
            <div>
              <h4 className="text-sm font-medium mb-2">Sample Data (First 3 rows):</h4>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Work Title</th>
                        <th className="p-2 text-left">BMI Work #</th>
                        <th className="p-2 text-left">ISWC</th>
                        <th className="p-2 text-left">IP Names</th>
                        <th className="p-2 text-left">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.data.slice(0, 3).map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{row['Work Title']}</td>
                          <td className="p-2">{row['BMI Work #']}</td>
                          <td className="p-2">{row['ISWC'] || '-'}</td>
                          <td className="p-2">{row['Interested Parties (IP Names)']}</td>
                          <td className="p-2">${row['Amount Paid']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <Badge variant="secondary">
                Ready for mapping
              </Badge>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setParsedData(null)}
                >
                  Upload New File
                </Button>
                <Button 
                  onClick={() => setShowMapper(true)}
                  disabled={parsedData.validRows === 0}
                >
                  Proceed to Mapping
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}