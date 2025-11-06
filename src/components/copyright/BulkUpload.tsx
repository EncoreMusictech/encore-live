import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCopyright } from '@/hooks/useCopyright';
import { useActivityLog } from '@/hooks/useActivityLog';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ParsedCopyright {
  work_title: string;
  iswc?: string;
  album_title?: string;
  creation_date?: string;
  copyright_date?: string;
  language_code?: string;
  work_type?: string;
  contains_sample?: boolean;
  duration_seconds?: number;
  notes?: string;
  writers?: ParsedWriter[];
  publishers?: ParsedPublisher[];
  recordings?: ParsedRecording[];
  errors?: string[];
  warnings?: string[];
  row_number?: number;
}

interface ParsedWriter {
  writer_name: string;
  ownership_percentage: number;
  writer_role?: string;
  ipi_number?: string;
  controlled_status?: string;
  pro_affiliation?: string;
}

interface ParsedPublisher {
  publisher_name: string;
  ownership_percentage: number;
  publisher_role?: string;
  ipi_number?: string;
  pro_affiliation?: string;
}

interface ParsedRecording {
  recording_title?: string;
  artist_name?: string;
  isrc?: string;
  release_date?: string;
  duration_seconds?: number;
}

interface BulkUploadProps {
  onSuccess?: () => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { createCopyright, copyrights, getWritersForCopyright } = useCopyright();
  const { logActivity } = useActivityLog();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCopyright[]>([]);
  const [validData, setValidData] = useState<ParsedCopyright[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');

  // Sample CSV template data
  const csvTemplate = `work_title,iswc,album_title,creation_date,copyright_date,language_code,work_type,contains_sample,duration_seconds,notes,writer_1_name,writer_1_ownership,writer_1_role,writer_1_ipi,writer_1_controlled,writer_1_pro,writer_2_name,writer_2_ownership,writer_2_role,writer_2_ipi,writer_2_controlled,writer_2_pro,publisher_1_name,publisher_1_ownership,publisher_1_role,publisher_1_ipi,publisher_1_pro,recording_title,recording_artist,recording_isrc,recording_release_date,recording_duration
"Sample Song Title",T-123456789-C,"Sample Album","2024-01-15","2024-01-15",EN,original,false,180,"Sample copyright work","John Doe",50,composer,12345678,C,ASCAP,"Jane Smith",50,lyricist,87654321,C,BMI,"Sample Music Publishing",100,original_publisher,11111111,ASCAP,"Sample Song Title","John Doe & Jane Smith",USRC12345678,2024-02-01,180`;

  const fieldMappings = {
    // Core work fields
    work_title: 'work_title',
    iswc: 'iswc', 
    album_title: 'album_title',
    creation_date: 'creation_date',
    copyright_date: 'copyright_date',
    language_code: 'language_code',
    work_type: 'work_type',
    contains_sample: 'contains_sample',
    duration_seconds: 'duration_seconds',
    notes: 'notes',
    
    // Writer fields (support up to 5 writers)
    writer_1_name: 'writer_name',
    writer_1_ownership: 'ownership_percentage',
    writer_1_role: 'writer_role',
    writer_1_ipi: 'ipi_number',
    writer_1_controlled: 'controlled_status',
    writer_1_pro: 'pro_affiliation',
    
    // Publisher fields (support up to 3 publishers)
    publisher_1_name: 'publisher_name',
    publisher_1_ownership: 'ownership_percentage',
    publisher_1_role: 'publisher_role',
    publisher_1_ipi: 'ipi_number',
    publisher_1_pro: 'pro_affiliation',
    
    // Recording fields
    recording_title: 'recording_title',
    recording_artist: 'artist_name',
    recording_isrc: 'isrc',
    recording_release_date: 'release_date',
    recording_duration: 'duration_seconds'
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'copyright_bulk_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Function to check for potential duplicates
  const checkForDuplicates = useCallback(async (parsedCopyrights: ParsedCopyright[]) => {
    try {
      // For each parsed copyright, check against existing copyrights
      for (const parsedCopyright of parsedCopyrights) {
        parsedCopyright.warnings = [];
        
        for (const existingCopyright of copyrights) {
          // Check work title similarity (case-insensitive)
          const titleMatch = parsedCopyright.work_title.toLowerCase() === existingCopyright.work_title.toLowerCase();
          
          if (titleMatch) {
            // Get writers for the existing copyright
            const existingWriters = await getWritersForCopyright(existingCopyright.id);
            
            // Compare writers and splits
            const parsedWriterNames = (parsedCopyright.writers || []).map(w => w.writer_name.toLowerCase().trim()).sort();
            const existingWriterNames = existingWriters.map(w => w.writer_name.toLowerCase().trim()).sort();
            
            const writersMatch = parsedWriterNames.length === existingWriterNames.length && 
                               parsedWriterNames.every((name, index) => name === existingWriterNames[index]);
            
            if (writersMatch) {
              // Compare ownership splits
              const parsedSplits = (parsedCopyright.writers || []).map(w => w.ownership_percentage).sort();
              const existingSplits = existingWriters.map(w => w.ownership_percentage).sort();
              
              const splitsMatch = parsedSplits.length === existingSplits.length &&
                                parsedSplits.every((split, index) => Math.abs(split - existingSplits[index]) < 0.01);
              
              if (splitsMatch) {
                parsedCopyright.warnings!.push(`Potential duplicate: Exact match found with existing work "${existingCopyright.work_title}" (Work ID: ${existingCopyright.work_id || 'N/A'})`);
              } else {
                parsedCopyright.warnings!.push(`Potential duplicate: Similar work found with different splits "${existingCopyright.work_title}" (Work ID: ${existingCopyright.work_id || 'N/A'})`);
              }
            } else {
              parsedCopyright.warnings!.push(`Potential duplicate: Same title with different writers "${existingCopyright.work_title}" (Work ID: ${existingCopyright.work_id || 'N/A'})`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    }
  }, [copyrights, getWritersForCopyright]);

  const parseFile = useCallback(async (uploadedFile: File) => {
    try {
      setIsProcessing(true);
      setErrors([]);
      
      const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();
      let rawData: any[] = [];

      if (fileExtension === 'csv') {
        // Parse CSV with proper blank space handling
        const text = await uploadedFile.text();
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: 'greedy', // Skip rows that are completely empty
          transformHeader: (header) => header.trim(),
          transform: (value) => {
            // Trim all values and convert empty strings to null
            const trimmed = value.trim();
            return trimmed === '' ? null : trimmed;
          }
        });
        
        if (result.errors.length > 0) {
          // Only show critical parsing errors, ignore empty row warnings
          const criticalErrors = result.errors.filter(err => 
            err.type !== 'FieldMismatch' && !err.message.includes('Too few fields')
          );
          if (criticalErrors.length > 0) {
            setErrors(criticalErrors.map(err => `Row ${err.row}: ${err.message}`));
          }
        }
        
        rawData = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel with proper blank handling
        const buffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json(sheet, { 
          defval: null, // Use null for empty cells instead of empty string
          raw: false // Convert values to strings
        });
      } else {
        setErrors(['Unsupported file format. Please upload CSV or Excel files only.']);
        return;
      }

      // Filter out completely empty rows
      const filteredData = rawData.filter(row => {
        return Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '');
      });

      console.log(`Parsed ${filteredData.length} rows from file (${rawData.length} total, ${rawData.length - filteredData.length} empty rows removed)`);

      // Process and validate data
      const processed = processRawData(filteredData);
      
      // Check for duplicates against existing copyrights
      await checkForDuplicates(processed);
      
      setParsedData(processed);
      
      const valid = processed.filter(item => !item.errors || item.errors.length === 0);
      setValidData(valid);
      
      console.log(`Valid records: ${valid.length} of ${processed.length} processed rows`);
      
      if (processed.length > 0) {
        setCurrentStep('preview');
        setShowPreview(true);
      } else {
        setErrors(['No valid data found in the file. Please check the format and ensure there is at least one row with a work title.']);
      }
      
    } catch (error) {
      console.error('Error parsing file:', error);
      setErrors(['Failed to parse file. Please check the format and try again.']);
    } finally {
      setIsProcessing(false);
    }
  }, [checkForDuplicates]);

  const processRawData = (rawData: any[]): ParsedCopyright[] => {
    // Helper function to clean and check if value is truly empty
    const cleanValue = (value: any): string | undefined => {
      if (value === null || value === undefined) return undefined;
      const cleaned = String(value).trim();
      return cleaned === '' ? undefined : cleaned;
    };

    return rawData.map((row, index) => {
      const processed: ParsedCopyright = {
        work_title: cleanValue(row.work_title) || '',
        row_number: index + 2, // +2 because of header row and 0-based index
        errors: []
      };

      // Validate required fields
      if (!processed.work_title) {
        processed.errors!.push('Work title is required');
      }

      // Process optional fields with proper blank space handling
      const iswc = cleanValue(row.iswc);
      if (iswc) processed.iswc = iswc;
      
      const albumTitle = cleanValue(row.album_title);
      if (albumTitle) processed.album_title = albumTitle;
      
      const creationDate = cleanValue(row.creation_date);
      if (creationDate) processed.creation_date = creationDate;
      
      const copyrightDate = cleanValue(row.copyright_date);
      if (copyrightDate) processed.copyright_date = copyrightDate;
      
      const languageCode = cleanValue(row.language_code);
      if (languageCode) processed.language_code = languageCode;
      
      const workType = cleanValue(row.work_type);
      if (workType) processed.work_type = workType;
      
      const notes = cleanValue(row.notes);
      if (notes) processed.notes = notes;
      
      // Parse boolean fields - ignore blank spaces
      const containsSample = cleanValue(row.contains_sample);
      if (containsSample) {
        processed.contains_sample = ['true', '1', 'yes', 'y'].includes(containsSample.toLowerCase());
      }
      
      // Parse numeric fields - ignore blank spaces
      const durationStr = cleanValue(row.duration_seconds);
      if (durationStr) {
        const duration = parseInt(durationStr);
        if (!isNaN(duration) && duration > 0) processed.duration_seconds = duration;
      }

      // Process writers - ignore blank entries
      processed.writers = [];
      for (let i = 1; i <= 5; i++) {
        const writerName = cleanValue(row[`writer_${i}_name`]);
        if (writerName) {
          const ownershipStr = cleanValue(row[`writer_${i}_ownership`]);
          const ownership = ownershipStr ? parseFloat(ownershipStr) : 0;
          
          const writer: ParsedWriter = {
            writer_name: writerName,
            ownership_percentage: isNaN(ownership) ? 0 : ownership
          };
          
          const writerRole = cleanValue(row[`writer_${i}_role`]);
          if (writerRole) writer.writer_role = writerRole;
          
          const writerIpi = cleanValue(row[`writer_${i}_ipi`]);
          if (writerIpi) writer.ipi_number = writerIpi;
          
          const writerControlled = cleanValue(row[`writer_${i}_controlled`]);
          if (writerControlled) writer.controlled_status = writerControlled;
          
          const writerPro = cleanValue(row[`writer_${i}_pro`]);
          if (writerPro) writer.pro_affiliation = writerPro;
          
          processed.writers.push(writer);
        }
      }

      // Process publishers - ignore blank entries
      processed.publishers = [];
      for (let i = 1; i <= 3; i++) {
        const publisherName = cleanValue(row[`publisher_${i}_name`]);
        if (publisherName) {
          const ownershipStr = cleanValue(row[`publisher_${i}_ownership`]);
          const ownership = ownershipStr ? parseFloat(ownershipStr) : 0;
          
          const publisher: ParsedPublisher = {
            publisher_name: publisherName,
            ownership_percentage: isNaN(ownership) ? 0 : ownership
          };
          
          const publisherRole = cleanValue(row[`publisher_${i}_role`]);
          if (publisherRole) publisher.publisher_role = publisherRole;
          
          const publisherIpi = cleanValue(row[`publisher_${i}_ipi`]);
          if (publisherIpi) publisher.ipi_number = publisherIpi;
          
          const publisherPro = cleanValue(row[`publisher_${i}_pro`]);
          if (publisherPro) publisher.pro_affiliation = publisherPro;
          
          processed.publishers.push(publisher);
        }
      }

      // Process recordings - ignore blank entries
      processed.recordings = [];
      const recordingTitle = cleanValue(row.recording_title);
      if (recordingTitle) {
        const recording: ParsedRecording = {
          recording_title: recordingTitle
        };
        
        const artistName = cleanValue(row.recording_artist);
        if (artistName) recording.artist_name = artistName;
        
        const isrc = cleanValue(row.recording_isrc);
        if (isrc) recording.isrc = isrc;
        
        const releaseDate = cleanValue(row.recording_release_date);
        if (releaseDate) recording.release_date = releaseDate;
        
        const recordingDurationStr = cleanValue(row.recording_duration);
        if (recordingDurationStr) {
          const duration = parseInt(recordingDurationStr);
          if (!isNaN(duration) && duration > 0) recording.duration_seconds = duration;
        }
        
        processed.recordings.push(recording);
      }

      // Validate ownership percentages - only check if there are actual values
      if (processed.writers && processed.writers.length > 0) {
        const totalWriterOwnership = processed.writers.reduce((sum, w) => sum + w.ownership_percentage, 0);
        if (totalWriterOwnership > 100.1) { // Allow small rounding errors
          processed.errors!.push(`Writer ownership total (${totalWriterOwnership.toFixed(2)}%) exceeds 100%`);
        }
      }

      if (processed.publishers && processed.publishers.length > 0) {
        const totalPublisherOwnership = processed.publishers.reduce((sum, p) => sum + p.ownership_percentage, 0);
        if (totalPublisherOwnership > 100.1) { // Allow small rounding errors
          processed.errors!.push(`Publisher ownership total (${totalPublisherOwnership.toFixed(2)}%) exceeds 100%`);
        }
      }

      return processed;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseFile(uploadedFile);
    }
  };

  const executeBulkUpload = async () => {
    if (validData.length === 0) {
      toast({
        title: "No Valid Data",
        description: "There are no valid records to upload.",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep('processing');
    setUploadProgress(0);
    
    const batchId = crypto.randomUUID();
    let successCount = 0;
    let failureCount = 0;
    const uploadErrors: string[] = [];

    console.log(`Starting bulk upload of ${validData.length} copyrights`);

    try {
      // Process in batches of 5 for better performance
      const BATCH_SIZE = 5;
      
      for (let batchStart = 0; batchStart < validData.length; batchStart += BATCH_SIZE) {
        const batch = validData.slice(batchStart, batchStart + BATCH_SIZE);
        
        // Process batch items in parallel
        const batchResults = await Promise.allSettled(
          batch.map(async (copyright) => {
            // Add small random delay to prevent work_id collisions
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

            // Create copyright (without related data)
            const createdCopyright = await createCopyright({
              work_title: copyright.work_title,
              iswc: copyright.iswc || undefined,
              album_title: copyright.album_title || undefined,
              creation_date: copyright.creation_date || undefined,
              copyright_date: copyright.copyright_date || undefined,
              language_code: copyright.language_code || 'EN',
              work_type: copyright.work_type || 'original',
              contains_sample: copyright.contains_sample || false,
              duration_seconds: copyright.duration_seconds || undefined,
              notes: copyright.notes || undefined
            } as any);

            // Insert writers in parallel
            const writersPromise = copyright.writers && copyright.writers.length > 0
              ? supabase
                  .from('copyright_writers')
                  .insert(
                    copyright.writers.map(writer => ({
                      copyright_id: createdCopyright.id,
                      writer_name: writer.writer_name,
                      ownership_percentage: writer.ownership_percentage,
                      writer_role: writer.writer_role || undefined,
                      ipi_number: writer.ipi_number || undefined,
                      controlled_status: writer.controlled_status || undefined,
                      pro_affiliation: writer.pro_affiliation || undefined
                    }))
                  )
              : Promise.resolve({ error: null });

            // Insert publishers in parallel
            const publishersPromise = copyright.publishers && copyright.publishers.length > 0
              ? supabase
                  .from('copyright_publishers')
                  .insert(
                    copyright.publishers.map(publisher => ({
                      copyright_id: createdCopyright.id,
                      publisher_name: publisher.publisher_name,
                      ownership_percentage: publisher.ownership_percentage,
                      publisher_role: publisher.publisher_role || undefined,
                      ipi_number: publisher.ipi_number || undefined,
                      pro_affiliation: publisher.pro_affiliation || undefined
                    }))
                  )
              : Promise.resolve({ error: null });

            // Insert recordings in parallel
            const recordingsPromise = copyright.recordings && copyright.recordings.length > 0
              ? supabase
                  .from('copyright_recordings')
                  .insert(
                    copyright.recordings.map(recording => ({
                      copyright_id: createdCopyright.id,
                      recording_title: recording.recording_title,
                      artist_name: recording.artist_name || undefined,
                      isrc: recording.isrc || undefined,
                      release_date: recording.release_date || undefined,
                      duration_seconds: recording.duration_seconds || undefined
                    }))
                  )
              : Promise.resolve({ error: null });

            // Wait for all inserts to complete
            const [writersResult, publishersResult, recordingsResult] = await Promise.all([
              writersPromise,
              publishersPromise,
              recordingsPromise
            ]);

            if (writersResult.error) {
              console.error('Error inserting writers:', writersResult.error);
            }
            if (publishersResult.error) {
              console.error('Error inserting publishers:', publishersResult.error);
            }
            if (recordingsResult.error) {
              console.error('Error inserting recordings:', recordingsResult.error);
            }

            // Log bulk upload activity
            await logActivity({
              copyright_id: createdCopyright.id,
              action_type: 'bulk_upload',
              operation_details: {
                batch_id: batchId,
                file_name: file?.name,
                row_number: copyright.row_number,
                writers_count: copyright.writers?.length || 0,
                publishers_count: copyright.publishers?.length || 0,
                recordings_count: copyright.recordings?.length || 0
              },
              new_values: createdCopyright
            });

            return { success: true, copyright };
          })
        );

        // Process batch results
        batchResults.forEach((result, index) => {
          const copyright = batch[index];
          if (result.status === 'fulfilled') {
            successCount++;
            console.log(`Successfully uploaded: ${copyright.work_title}`);
          } else {
            failureCount++;
            const errorMsg = result.reason instanceof Error ? result.reason.message : 'Upload failed';
            console.error(`Failed to upload row ${copyright.row_number}: ${errorMsg}`);
            uploadErrors.push(`Row ${copyright.row_number} (${copyright.work_title}): ${errorMsg}`);
          }
        });

        // Update progress
        setUploadProgress(((batchStart + batch.length) / validData.length) * 100);
      }

      setCurrentStep('complete');
      
      console.log(`Bulk upload complete: ${successCount} successful, ${failureCount} failed`);
      
      toast({
        title: "Bulk Upload Complete",
        description: `Successfully uploaded ${successCount} of ${validData.length} copyrights.${failureCount > 0 ? ` ${failureCount} failed.` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      if (uploadErrors.length > 0) {
        console.error('Upload errors:', uploadErrors);
        setErrors(uploadErrors);
      }

      if (onSuccess && successCount > 0) {
        onSuccess();
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during the bulk upload process.",
        variant: "destructive"
      });
      setCurrentStep('upload');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setParsedData([]);
    setValidData([]);
    setErrors([]);
    setCurrentStep('upload');
    setShowPreview(false);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Upload Copyrights
          </CardTitle>
          <CardDescription>
            Upload multiple copyrights from a CSV or Excel file. Download the template to ensure proper formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 'upload' && (
            <>
              <div className="flex items-center gap-4">
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <span className="text-sm text-muted-foreground">
                  Use this template to format your data correctly
                </span>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="bulk-upload">Upload CSV or Excel File</Label>
                <Input
                  id="bulk-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Processing file...</div>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          )}

          {currentStep === 'processing' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Uploading Copyrights</h3>
                <p className="text-muted-foreground">Please wait while we process your data...</p>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <div className="text-center text-sm text-muted-foreground">
                {Math.round(uploadProgress)}% complete
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Upload Complete</h3>
                <p className="text-muted-foreground">Your copyrights have been successfully uploaded.</p>
              </div>
              <Button onClick={resetUpload}>Upload Another File</Button>
            </div>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-semibold">Errors found:</div>
                  {errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm">{error}</div>
                  ))}
                  {errors.length > 5 && (
                    <div className="text-sm">... and {errors.length - 5} more errors</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Upload Data</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="valid" className="space-y-4">
            <TabsList>
              <TabsTrigger value="valid">
                Valid Records ({validData.length})
              </TabsTrigger>
              <TabsTrigger value="warnings">
                Warnings ({parsedData.filter(item => item.warnings && item.warnings.length > 0).length})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Errors ({parsedData.length - validData.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="valid" className="space-y-4">
              {validData.length > 0 ? (
                <>
                  <div className="overflow-x-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Work Title</TableHead>
                          <TableHead>ISWC</TableHead>
                          <TableHead>Writers</TableHead>
                          <TableHead>Publishers</TableHead>
                          <TableHead>Recordings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validData.slice(0, 10).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.row_number}</TableCell>
                            <TableCell className="font-medium">{item.work_title}</TableCell>
                            <TableCell className="font-mono text-sm">{item.iswc || '-'}</TableCell>
                            <TableCell>
                              {item.writers?.map(w => `${w.writer_name} (${w.ownership_percentage}%)`).join(', ') || '-'}
                            </TableCell>
                            <TableCell>
                              {item.publishers?.map(p => `${p.publisher_name} (${p.ownership_percentage}%)`).join(', ') || '-'}
                            </TableCell>
                            <TableCell>
                              {item.recordings?.map(r => r.recording_title).join(', ') || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {validData.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center">
                      Showing first 10 of {validData.length} valid records
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-muted-foreground">
                      Ready to upload {validData.length} copyright{validData.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowPreview(false)}>
                        Cancel
                      </Button>
                      <Button onClick={executeBulkUpload}>
                        Upload {validData.length} Copyright{validData.length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No valid records found. Please fix the errors and try again.
                </div>
              )}
            </TabsContent>

            <TabsContent value="warnings" className="space-y-4">
              {parsedData.filter(item => item.warnings && item.warnings.length > 0).length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Work Title</TableHead>
                        <TableHead>Writers</TableHead>
                        <TableHead>Duplicate Warnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData
                        .filter(item => item.warnings && item.warnings.length > 0)
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.row_number}</TableCell>
                            <TableCell className="font-medium">{item.work_title}</TableCell>
                            <TableCell>
                              {item.writers?.map(w => `${w.writer_name} (${w.ownership_percentage}%)`).join(', ') || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {item.warnings!.map((warning, warningIndex) => (
                                  <Badge key={warningIndex} variant="secondary" className="text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {warning}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No potential duplicates found. All records appear to be unique!
                </div>
              )}
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              {parsedData.filter(item => item.errors && item.errors.length > 0).length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Work Title</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData
                        .filter(item => item.errors && item.errors.length > 0)
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.row_number}</TableCell>
                            <TableCell>{item.work_title || 'Missing title'}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {item.errors!.map((error, errorIndex) => (
                                  <Badge key={errorIndex} variant="destructive" className="text-xs">
                                    {error}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No errors found. All records are valid!
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};