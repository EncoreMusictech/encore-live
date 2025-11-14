import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SmartCSVImporterProps {
  companyId: string;
  companyName: string;
}

interface ParsedRow {
  artist: string;
  track: string;
  isrc: string;
}

export const SmartCSVImporter: React.FC<SmartCSVImporterProps> = ({ companyId, companyName }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResults({ success: 0, failed: 0, errors: [] });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const detectColumnMapping = (headers: string[]): { artist: number; track: number; isrc: number } | null => {
    const normalized = headers.map(h => h.toLowerCase().trim());
    
    const artistIndex = normalized.findIndex(h => 
      h.includes('artist') || h.includes('performer')
    );
    const trackIndex = normalized.findIndex(h => 
      h.includes('track') || h.includes('title') || h.includes('song')
    );
    const isrcIndex = normalized.findIndex(h => 
      h.includes('isrc')
    );

    if (artistIndex === -1 || trackIndex === -1 || isrcIndex === -1) {
      return null;
    }

    return { artist: artistIndex, track: trackIndex, isrc: isrcIndex };
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      if (jsonData.length < 2) {
        throw new Error("File must contain headers and at least one data row");
      }

      // Detect column mapping
      const headers = jsonData[0];
      const mapping = detectColumnMapping(headers);
      
      if (!mapping) {
        throw new Error("Could not detect required columns (ARTIST, TRACK, ISRC). Please ensure your CSV has these columns.");
      }

      toast.success(`Detected columns: ARTIST (col ${mapping.artist + 1}), TRACK (col ${mapping.track + 1}), ISRC (col ${mapping.isrc + 1})`);

      // Fetch existing ISRCs AND titles to avoid duplicates (ISRC + name combo)
      const { data: existingRecordings } = await supabase
        .from('copyright_recordings')
        .select('isrc, recording_title');
      
      const existingCombos = new Set(
        existingRecordings?.map(r => `${r.isrc}||${r.recording_title?.toLowerCase().trim()}`) || []
      );

      const dataRows = jsonData.slice(1);
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        setProgress(Math.round(((i + 1) / dataRows.length) * 100));

        try {
          const artist = row[mapping.artist]?.toString().trim();
          const track = row[mapping.track]?.toString().trim();
          const isrc = row[mapping.isrc]?.toString().trim();

          // Validate required fields
          if (!artist || !track || !isrc) {
            errors.push(`Row ${i + 2}: Missing required data`);
            failedCount++;
            continue;
          }

          // Check for duplicates using ISRC + track name combination
          const comboKey = `${isrc}||${track.toLowerCase().trim()}`;
          if (existingCombos.has(comboKey)) {
            console.log(`Skipping duplicate: ${track} (${isrc})`);
            continue;
          }

          // Detect if this is a video based on title
          const isVideo = track.toLowerCase().includes('video');
          const mediaType = isVideo ? 'Video' : 'Audio';
          const format = isVideo ? 'Video' : 'Digital';

          // Create copyright entry
          const { data: copyright, error: copyrightError } = await supabase
            .from('copyrights')
            .insert({
              work_title: track,
              user_id: user.id,
              work_type: mediaType,
              status: 'registered'
            })
            .select()
            .single();

          if (copyrightError) throw copyrightError;

          // Create recording entry
          const { error: recordingError } = await supabase
            .from('copyright_recordings')
            .insert({
              copyright_id: copyright.id,
              recording_title: track,
              artist_name: artist,
              isrc: isrc
            });

          if (recordingError) throw recordingError;

          // Link to catalog
          const { error: catalogError } = await supabase
            .from('catalog_items')
            .insert({
              title: track,
              artist: artist,
              isrc: isrc,
              company_id: companyId,
              user_id: user.id,
              format: format
            });

          if (catalogError) throw catalogError;

          existingCombos.add(comboKey);
          successCount++;

        } catch (error: any) {
          console.error(`Error processing row ${i + 2}:`, error);
          errors.push(`Row ${i + 2}: ${error.message}`);
          failedCount++;
        }
      }

      setResults({ success: successCount, failed: failedCount, errors });
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} works!`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to import ${failedCount} works. Check the results below.`);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "An error occurred during upload");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart CSV Importer</CardTitle>
        <CardDescription>
          Upload a CSV file with any column names. System will auto-detect ARTIST, TRACK, and ISRC columns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop your file here' : 'Drag & drop a CSV/Excel file, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              System will automatically detect columns for ARTIST, TRACK, and ISRC
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="ml-auto"
                >
                  Remove
                </Button>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  Processing... {progress}%
                </p>
              </div>
            )}

            {!uploading && results.success === 0 && results.failed === 0 && (
              <Button onClick={handleUpload} className="w-full">
                Import Works
              </Button>
            )}

            {(results.success > 0 || results.failed > 0) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">
                    {results.success} works imported successfully
                  </span>
                </div>
                
                {results.failed > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-destructive font-medium">
                        {results.failed} works failed
                      </span>
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted">
                      {results.errors.map((error, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground mb-1">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setFile(null);
                    setResults({ success: 0, failed: 0, errors: [] });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Import Another File
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
