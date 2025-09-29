import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useHistoricalStatements } from '@/hooks/useHistoricalStatements';
import Papa from 'papaparse';

interface StatementUploaderProps {
  artistName: string;
  onSuccess?: () => void;
}

export default function StatementUploader({ artistName, onSuccess }: StatementUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { addStatement } = useHistoricalStatements(artistName);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setErrors([]);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data;
          const validationErrors: string[] = [];

          // Validate rows
          const statements = parsedData.map((row: any, index) => {
            if (!row.Year || !row.Quarter) {
              validationErrors.push(`Row ${index + 1}: Missing Year or Quarter`);
              return null;
            }

            if (!row['Gross Revenue'] || !row['Net Revenue']) {
              validationErrors.push(`Row ${index + 1}: Missing revenue data`);
              return null;
            }

            return {
              artist_name: artistName,
              year: parseInt(row.Year),
              quarter: parseInt(row.Quarter),
              period_label: `Q${row.Quarter} ${row.Year}`,
              statement_type: row['Statement Type'] || 'both',
              gross_revenue: parseFloat(row['Gross Revenue']) || 0,
              net_revenue: parseFloat(row['Net Revenue']) || 0,
              streams: row.Streams ? parseInt(row.Streams) : undefined,
              mechanical_royalties: parseFloat(row['Mechanical Royalties']) || 0,
              performance_royalties: parseFloat(row['Performance Royalties']) || 0,
              sync_revenue: parseFloat(row['Sync Revenue']) || 0,
              streaming_revenue: parseFloat(row['Streaming Revenue']) || 0,
              other_revenue: parseFloat(row['Other Revenue']) || 0,
              expenses: parseFloat(row.Expenses) || 0,
              notes: row.Notes || '',
            };
          }).filter(Boolean);

          if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setUploading(false);
            return;
          }

          if (statements.length > 8) {
            setErrors(['Maximum 8 quarters allowed. Please reduce your data.']);
            setUploading(false);
            return;
          }

          setPreview(statements);
          setUploading(false);
        },
        error: (error) => {
          setErrors([`Failed to parse CSV: ${error.message}`]);
          setUploading(false);
        },
      });
    } catch (error) {
      setErrors(['Failed to process file']);
      setUploading(false);
    }
  }, [artistName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    setUploading(true);
    try {
      for (const statement of preview) {
        await addStatement(statement);
      }
      onSuccess?.();
    } catch (error) {
      setErrors(['Failed to import statements']);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Year,Quarter,Statement Type,Gross Revenue,Net Revenue,Streams,Mechanical Royalties,Performance Royalties,Sync Revenue,Streaming Revenue,Other Revenue,Expenses,Notes
2024,1,both,50000,35000,5000000,5000,10000,2000,15000,3000,1000,Q1 2024 statements
2024,2,both,52000,36400,5200000,5200,10400,2100,15600,3100,1050,Q2 2024 statements`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'statement_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {preview.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg mb-2">Drag & drop a CSV file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse files</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports CSV, XLS, XLSX (max 8 quarters)
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {preview.length} statements ready to import
              </span>
            </div>

            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Period</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-right">Gross Revenue</th>
                    <th className="p-2 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((statement, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{statement.period_label}</td>
                      <td className="p-2 capitalize">{statement.statement_type}</td>
                      <td className="p-2 text-right">
                        ${statement.gross_revenue.toLocaleString()}
                      </td>
                      <td className="p-2 text-right">
                        ${statement.net_revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreview([])}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={uploading}>
                {uploading ? 'Importing...' : 'Import Statements'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
