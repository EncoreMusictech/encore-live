import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCopyright } from '@/hooks/useCopyright';
import { useActivityLog } from '@/hooks/useActivityLog';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { isMLCFormat, parseMLCFormat, ParsedCopyright as MLCParsedCopyright } from '@/lib/mlc-csv-parser';

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
  const { createCopyright, copyrights, getWritersForCopyright, getRecordingsForCopyright } = useCopyright();
  const { logActivity } = useActivityLog();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCopyright[]>([]);
  const [validData, setValidData] = useState<ParsedCopyright[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    successCount: number;
    failureCount: number;
    skippedCount: number;
    successfulWorks: Array<{ row: number; title: string; work_id: string }>;
    skippedWorks: Array<{ row: number; title: string; reason: string }>;
    errors: Array<{ row: number; title: string; error: string }>;
  }>({ successCount: 0, failureCount: 0, skippedCount: 0, successfulWorks: [], skippedWorks: [], errors: [] });
  const [isRetrying, setIsRetrying] = useState(false);
  const [failedRecordsData, setFailedRecordsData] = useState<ParsedCopyright[]>([]);

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
    
    toast({
      title: "Template Downloaded",
      description: "Standard template downloaded. Note: You can also upload MLC Work Report exports directly.",
    });
  };

  // Function to check for potential duplicates
  const checkForDuplicates = useCallback(async (parsedCopyrights: ParsedCopyright[]) => {
    try {
      // Fetch ALL writers and recordings data once upfront to avoid thousands of sequential calls
      const writersMap = new Map();
      const recordingsMap = new Map();
      
      // Batch fetch all data for existing copyrights
      const { data: allWriters } = await supabase
        .from('copyright_writers')
        .select('*')
        .in('copyright_id', copyrights.map(c => c.id));
      
      const { data: allRecordings } = await supabase
        .from('copyright_recordings')
        .select('*')
        .in('copyright_id', copyrights.map(c => c.id));
      
      // Organize by copyright_id for fast lookup
      (allWriters || []).forEach(writer => {
        if (!writersMap.has(writer.copyright_id)) {
          writersMap.set(writer.copyright_id, []);
        }
        writersMap.get(writer.copyright_id).push(writer);
      });
      
      (allRecordings || []).forEach(recording => {
        if (!recordingsMap.has(recording.copyright_id)) {
          recordingsMap.set(recording.copyright_id, []);
        }
        recordingsMap.get(recording.copyright_id).push(recording);
      });

      // For each parsed copyright, check against existing copyrights
      for (const parsedCopyright of parsedCopyrights) {
        parsedCopyright.warnings = [];

        // Normalize ISRCs from parsed row
        const parsedIsrcs = (parsedCopyright.recordings || [])
          .map(r => r.isrc?.trim().toUpperCase())
          .filter((v): v is string => !!v);
        
        for (const existingCopyright of copyrights) {
          // Title-based matching (case-insensitive)
          const titleMatch = parsedCopyright.work_title.toLowerCase() === existingCopyright.work_title.toLowerCase();

          if (titleMatch) {
            // Get writers from pre-fetched map
            const existingWriters = writersMap.get(existingCopyright.id) || [];

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

          // ISRC-based matching: compare parsed ISRCs to existing recordings ISRCs
          if (parsedIsrcs.length > 0) {
            const existingRecordings = recordingsMap.get(existingCopyright.id) || [];
            const existingIsrcs = existingRecordings
              .map(r => (r.isrc || '').trim().toUpperCase())
              .filter((v): v is string => !!v);

            const isrcMatches = parsedIsrcs.filter(isrc => existingIsrcs.includes(isrc));
            if (isrcMatches.length > 0) {
              parsedCopyright.warnings!.push(`Potential duplicate: ISRC match (${isrcMatches.join(', ')}) with existing work "${existingCopyright.work_title}" (Work ID: ${existingCopyright.work_id || 'N/A'})`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    }
  }, [copyrights]);

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

      // Detect if this is an MLC export format
      const headers = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];
      const isMLCFile = isMLCFormat(headers);

      console.log(`File format detected: ${isMLCFile ? 'MLC Export' : 'Standard Template'}`);

      // Process and validate data based on format
      const processed = isMLCFile ? parseMLCFormat(filteredData) : processRawData(filteredData);
      
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

    // Helper to find value by checking multiple possible column names (case-insensitive)
    const findValue = (row: any, ...possibleNames: string[]): string | undefined => {
      for (const name of possibleNames) {
        // Try exact match first
        if (row[name] !== undefined) {
          return cleanValue(row[name]);
        }
        // Try case-insensitive match
        const foundKey = Object.keys(row).find(key => key.toLowerCase() === name.toLowerCase());
        if (foundKey && row[foundKey] !== undefined) {
          return cleanValue(row[foundKey]);
        }
      }
      return undefined;
    };

    return rawData.map((row, index) => {
      const processed: ParsedCopyright = {
        work_title: findValue(row, 'work_title', 'TRACK', 'track', 'title', 'TITLE') || '',
        row_number: index + 2, // +2 because of header row and 0-based index
        errors: []
      };

      // Validate required fields
      if (!processed.work_title) {
        processed.errors!.push('Work title is required (expected column: work_title, TRACK, or title)');
      }

      // Process optional fields with proper blank space handling
      const iswc = findValue(row, 'iswc', 'ISWC');
      if (iswc) processed.iswc = iswc;
      
      const albumTitle = findValue(row, 'album_title', 'ALBUM', 'album');
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
      // Support multiple column name formats: recording_title/TRACK, recording_artist/ARTIST, recording_isrc/ISRC
      processed.recordings = [];
      const recordingTitle = findValue(row, 'recording_title', 'TRACK', 'track', 'title', 'TITLE', 'work_title');
      const artistName = findValue(row, 'recording_artist', 'ARTIST', 'artist', 'artist_name');
      const isrc = findValue(row, 'recording_isrc', 'ISRC', 'isrc');
      
      // Create recording if we have at least a title, artist, or ISRC
      if (recordingTitle || artistName || isrc) {
        const recording: ParsedRecording = {
          recording_title: recordingTitle || processed.work_title // Use work title as fallback
        };
        
        if (artistName) recording.artist_name = artistName;
        if (isrc) recording.isrc = isrc;
        
        const releaseDate = findValue(row, 'recording_release_date', 'release_date', 'RELEASE_DATE');
        if (releaseDate) recording.release_date = releaseDate;
        
        const recordingDurationStr = findValue(row, 'recording_duration', 'duration', 'DURATION');
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

  const executeBulkUpload = async (dataToUpload: ParsedCopyright[], isRetry: boolean = false) => {
    if (dataToUpload.length === 0) {
      toast({
        title: "No Valid Data",
        description: "There are no valid records to upload.",
        variant: "destructive"
      });
      return;
    }

    // Pre-flight authentication check and refresh
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error('Your session has expired. Please refresh the page and sign in again.');
        }
      }
    } catch (authError) {
      toast({
        title: "Authentication Error",
        description: authError instanceof Error ? authError.message : "Please refresh the page and sign in again.",
        variant: "destructive"
      });
      setIsProcessing(false);
      setIsRetrying(false);
      return;
    }

    if (!isRetry) {
      // Keep preview dialog open and show progress there
      setCurrentStep('processing');
    }
    setUploadProgress(0);
    
    const batchId = crypto.randomUUID();
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    const detailedErrors: Array<{ row: number; title: string; error: string }> = [];
    const successfulWorks: Array<{ row: number; title: string; work_id: string }> = [];
    const skippedWorks: Array<{ row: number; title: string; reason: string }> = [];
    const failedRecords: ParsedCopyright[] = [];

    console.log(`Starting bulk upload of ${dataToUpload.length} copyrights`);

    try {
      // Process in batches of 5 for better performance
      const BATCH_SIZE = 5;
      
      for (let batchStart = 0; batchStart < dataToUpload.length; batchStart += BATCH_SIZE) {
        const batch = dataToUpload.slice(batchStart, batchStart + BATCH_SIZE);
        
        // Process batch items sequentially to prevent work_id collisions
        const batchResults = await Promise.allSettled(
          batch.map(async (copyright, batchIndex) => {
            // Add staggered delay to prevent work_id collisions (50ms between each)
            await new Promise(resolve => setTimeout(resolve, batchIndex * 50));

            try {
              // Check if work already exists in database (by title, ISWC, or ISRC)
              let existingWork = null;
              
              // Try to find by ISWC first if available
              if (copyright.iswc) {
                const { data } = await supabase
                  .from('copyrights')
                  .select('*')
                  .eq('iswc', copyright.iswc)
                  .limit(1)
                  .maybeSingle();
                existingWork = data;
              }
              
              // If not found by ISWC, try by title
              if (!existingWork) {
                const { data } = await supabase
                  .from('copyrights')
                  .select('*')
                  .ilike('work_title', copyright.work_title)
                  .limit(1)
                  .maybeSingle();
                existingWork = data;
              }

              if (existingWork) {
                // Compare data to see if update is needed
                const needsUpdate = 
                  (copyright.iswc && existingWork.iswc !== copyright.iswc) ||
                  (copyright.album_title && existingWork.album_title !== copyright.album_title) ||
                  (copyright.creation_date && existingWork.creation_date !== copyright.creation_date) ||
                  (copyright.copyright_date && existingWork.copyright_date !== copyright.copyright_date) ||
                  (copyright.language_code && existingWork.language_code !== copyright.language_code) ||
                  (copyright.work_type && existingWork.work_type !== copyright.work_type) ||
                  (copyright.duration_seconds && existingWork.duration_seconds !== copyright.duration_seconds) ||
                  (copyright.notes && existingWork.notes !== copyright.notes);

                if (!needsUpdate) {
                  // Check if writers, publishers, or recordings need updates
                  const [existingWriters, existingPublishers, existingRecordings] = await Promise.all([
                    supabase.from('copyright_writers').select('*').eq('copyright_id', existingWork.id),
                    supabase.from('copyright_publishers').select('*').eq('copyright_id', existingWork.id),
                    supabase.from('copyright_recordings').select('*').eq('copyright_id', existingWork.id)
                  ]);

                  const writersNeedUpdate = copyright.writers && copyright.writers.length > 0 && 
                    JSON.stringify((copyright.writers || []).map(w => ({ name: w.writer_name, pct: w.ownership_percentage }))) !==
                    JSON.stringify((existingWriters.data || []).map(w => ({ name: w.writer_name, pct: w.ownership_percentage })));

                  const publishersNeedUpdate = copyright.publishers && copyright.publishers.length > 0 &&
                    JSON.stringify((copyright.publishers || []).map(p => ({ name: p.publisher_name, pct: p.ownership_percentage }))) !==
                    JSON.stringify((existingPublishers.data || []).map(p => ({ name: p.publisher_name, pct: p.ownership_percentage })));

                  const recordingsNeedUpdate = copyright.recordings && copyright.recordings.length > 0 &&
                    JSON.stringify((copyright.recordings || []).map(r => ({ title: r.recording_title, artist: r.artist_name, isrc: r.isrc }))) !==
                    JSON.stringify((existingRecordings.data || []).map(r => ({ title: r.recording_title, artist: r.artist_name, isrc: r.isrc })));

                  if (!writersNeedUpdate && !publishersNeedUpdate && !recordingsNeedUpdate) {
                    // All data is identical, skip this record
                    return { 
                      skipped: true, 
                      copyright,
                      reason: `Work already exists with identical data (ID: ${existingWork.work_id || existingWork.id})`
                    };
                  }
                }

                // Update existing work
                const updateData: any = {
                  updated_at: new Date().toISOString()
                };
                
                if (copyright.iswc) updateData.iswc = copyright.iswc;
                if (copyright.album_title) updateData.album_title = copyright.album_title;
                if (copyright.creation_date) updateData.creation_date = copyright.creation_date;
                if (copyright.copyright_date) updateData.copyright_date = copyright.copyright_date;
                if (copyright.language_code) updateData.language_code = copyright.language_code;
                if (copyright.work_type) updateData.work_type = copyright.work_type;
                if (copyright.duration_seconds) updateData.duration_seconds = copyright.duration_seconds;
                if (copyright.notes) updateData.notes = copyright.notes;

                const { error: updateError } = await supabase
                  .from('copyrights')
                  .update(updateData)
                  .eq('id', existingWork.id);

                if (updateError) throw updateError;

                // Update related entities if provided
                if (copyright.writers && copyright.writers.length > 0) {
                  // Delete existing writers
                  await supabase.from('copyright_writers').delete().eq('copyright_id', existingWork.id);
                  // Insert new writers
                  await supabase.from('copyright_writers').insert(
                    copyright.writers.map(writer => ({
                      copyright_id: existingWork.id,
                      writer_name: writer.writer_name,
                      ownership_percentage: writer.ownership_percentage,
                      writer_role: writer.writer_role || undefined,
                      ipi_number: writer.ipi_number || undefined,
                      controlled_status: writer.controlled_status || undefined,
                      pro_affiliation: writer.pro_affiliation || undefined
                    }))
                  );
                }

                if (copyright.publishers && copyright.publishers.length > 0) {
                  await supabase.from('copyright_publishers').delete().eq('copyright_id', existingWork.id);
                  await supabase.from('copyright_publishers').insert(
                    copyright.publishers.map(publisher => ({
                      copyright_id: existingWork.id,
                      publisher_name: publisher.publisher_name,
                      ownership_percentage: publisher.ownership_percentage,
                      publisher_role: publisher.publisher_role || undefined,
                      ipi_number: publisher.ipi_number || undefined,
                      pro_affiliation: publisher.pro_affiliation || undefined
                    }))
                  );
                }

                if (copyright.recordings && copyright.recordings.length > 0) {
                  await supabase.from('copyright_recordings').delete().eq('copyright_id', existingWork.id);
                  await supabase.from('copyright_recordings').insert(
                    copyright.recordings.map(recording => ({
                      copyright_id: existingWork.id,
                      recording_title: recording.recording_title,
                      artist_name: recording.artist_name || undefined,
                      isrc: recording.isrc || undefined,
                      release_date: recording.release_date || undefined,
                      duration_seconds: recording.duration_seconds || undefined
                    }))
                  );
                }

                // Log update activity
                await logActivity({
                  copyright_id: existingWork.id,
                  action_type: 'update',
                  operation_details: {
                    batch_id: batchId,
                    file_name: file?.name,
                    row_number: copyright.row_number,
                    updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at')
                  },
                  new_values: updateData
                });

                return { 
                  success: true, 
                  copyright,
                  work_id: existingWork.work_id || existingWork.id,
                  updated: true
                };
              }

              // Create copyright (without related data) - SILENT MODE for bulk upload
              const uniqueWorkId = `WK-${crypto.randomUUID()}`;
              const createdCopyright = await createCopyright({
                work_id: uniqueWorkId,
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
              } as any, { silent: true });

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

              return { 
                success: true, 
                copyright,
                work_id: createdCopyright.work_id || createdCopyright.id 
              };
            } catch (error: any) {
              // Enhanced error logging and messaging
              console.error(`Failed to upload row ${copyright.row_number}:`, error);
              
              // Check if it's a duplicate work_id error
              if (error?.code === '23505' && error?.message?.includes('copyrights_work_id_key')) {
                console.warn(`Duplicate work_id detected for row ${copyright.row_number}: ${copyright.work_title}`);
                throw new Error('Duplicate work - this work may already exist in your catalog');
              }
              
              // Check for authentication errors
              if (error?.message?.includes('No authenticated user') || error?.message?.includes('JWT')) {
                throw new Error(`Authentication error - Your session expired during upload. Row ${copyright.row_number}: ${copyright.work_title}. Please refresh the page and try again.`);
              }
              
              // Check for RLS policy errors
              if (error?.code === '42501' || error?.message?.includes('policy')) {
                throw new Error(`Permission denied for row ${copyright.row_number}: ${copyright.work_title}. Check your account permissions. (Error code: ${error?.code || 'RLS'})`);
              }
              
              // Provide detailed error message with row number and work title
              const detailedError = `Row ${copyright.row_number} - ${copyright.work_title}: ${error?.message || error?.toString() || 'Unknown error occurred'}`;
              throw new Error(detailedError);
            }
          })
        );

        // Process batch results
        batchResults.forEach((result, index) => {
          const copyright = batch[index];
          if (result.status === 'fulfilled') {
            if (result.value.skipped) {
              // Work was skipped because it already exists
              skippedCount++;
              skippedWorks.push({
                row: copyright.row_number || 0,
                title: copyright.work_title,
                reason: result.value.reason
              });
              console.log(`Skipped existing work: ${copyright.work_title}`);
            } else {
              // Work was successfully uploaded or updated
              successCount++;
              const action = result.value.updated ? 'updated' : 'created';
              successfulWorks.push({
                row: copyright.row_number || 0,
                title: `${copyright.work_title} (${action})`,
                work_id: result.value.work_id
              });
              console.log(`Successfully ${action}: ${copyright.work_title}`);
            }
          } else {
            failureCount++;
            const errorMsg = result.reason instanceof Error ? result.reason.message : 'Upload failed';
            console.error(`Failed to upload row ${copyright.row_number}: ${errorMsg}`);
            detailedErrors.push({
              row: copyright.row_number || 0,
              title: copyright.work_title,
              error: errorMsg
            });
            failedRecords.push(copyright);
          }
        });

        // Update progress
        setUploadProgress(((batchStart + batch.length) / dataToUpload.length) * 100);
      }

      console.log(`Bulk upload complete: ${successCount} successful, ${skippedCount} skipped, ${failureCount} failed`);
      console.log('Successful works:', successfulWorks);
      console.log('Skipped works:', skippedWorks);
      console.log('Failed works:', detailedErrors);
      
      // Store failed records for retry functionality
      setFailedRecordsData(failedRecords);
      
      // Store results for modal - ALWAYS show modal regardless of success/failure
      if (isRetry) {
        // Merge with previous results for retry
        setUploadResults(prev => ({
          successCount: prev.successCount + successCount,
          failureCount: failureCount,
          skippedCount: prev.skippedCount + skippedCount,
          successfulWorks: [...prev.successfulWorks, ...successfulWorks],
          skippedWorks: [...prev.skippedWorks, ...skippedWorks],
          errors: detailedErrors
        }));
      } else {
        setUploadResults({
          successCount,
          failureCount,
          skippedCount,
          successfulWorks,
          skippedWorks,
          errors: detailedErrors
        });
      }

      if (!isRetry) {
        // Close preview and show results modal - ensure modal is always shown
        setShowPreview(false);
        setCurrentStep('complete');
        
        // Add small delay to ensure state updates before showing modal
        setTimeout(() => {
          setShowResultsModal(true);
        }, 100);
      } else {
        setIsRetrying(false);
        toast({
          title: "Retry Complete",
          description: `${successCount} uploaded, ${skippedCount} skipped, ${failureCount} failed.`,
          variant: failureCount === 0 ? "default" : "destructive"
        });
      }

// Delay onSuccess until user closes the results modal


    } catch (error) {
      console.error('Bulk upload error:', error);
      
      // Even on critical error, try to show what we processed
      setUploadResults({
        successCount,
        failureCount,
        skippedCount,
        successfulWorks,
        skippedWorks,
        errors: [...detailedErrors, {
          row: 0,
          title: 'System Error',
          error: error instanceof Error ? error.message : "An error occurred during the bulk upload process."
        }]
      });
      
      setShowPreview(false);
      setShowResultsModal(true);
      setIsRetrying(false);
      
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "An error occurred during the bulk upload process.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!file || validData.length === 0) {
      toast({
        title: "No Data to Upload",
        description: "Please upload and validate a file first.",
        variant: "destructive"
      });
      return;
    }

    await executeBulkUpload(validData, false);
  };

  const handleRetryFailed = async () => {
    if (failedRecordsData.length === 0) {
      toast({
        title: "No Failed Records",
        description: "There are no failed records to retry.",
        variant: "destructive"
      });
      return;
    }

    setIsRetrying(true);
    
    toast({
      title: "Retrying Failed Records",
      description: `Attempting to upload ${failedRecordsData.length} failed records...`,
    });

    await executeBulkUpload(failedRecordsData, true);
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
            Upload multiple copyrights from a CSV or Excel file. Supports standard template format or simple ARTIST, TRACK, ISRC columns for MLC enrichment.
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

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Flexible column names:</strong> You can use simple column names like ARTIST, TRACK, ISRC (or recording_artist, recording_title, recording_isrc) for MLC enrichment. The system will automatically detect and parse your format.
                </AlertDescription>
              </Alert>

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
      <Dialog open={showPreview} onOpenChange={(open) => {
        // Only allow closing if not processing
        if (!open && currentStep !== 'processing') {
          setShowPreview(false);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentStep === 'processing' ? 'Uploading Copyrights' : 'Preview Upload Data'}
            </DialogTitle>
            {currentStep === 'processing' && (
              <DialogDescription>
                Please wait while we process your data. Do not close this window.
              </DialogDescription>
            )}
          </DialogHeader>
          
          {currentStep === 'processing' ? (
            <div className="space-y-6 py-8">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-lg font-semibold">Processing {validData.length} copyrights...</p>
                <p className="text-sm text-muted-foreground">
                  Uploading works, writers, publishers, and recordings
                </p>
              </div>
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full h-3" />
                <div className="text-center text-sm font-medium">
                  {Math.round(uploadProgress)}% complete
                </div>
              </div>
            </div>
          ) : (
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
                          <TableHead>Recording</TableHead>
                          <TableHead>Artist</TableHead>
                          <TableHead>ISRC</TableHead>
                          <TableHead>ISWC</TableHead>
                          <TableHead>Writers</TableHead>
                          <TableHead>Publishers</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validData.slice(0, 10).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.row_number}</TableCell>
                            <TableCell className="font-medium">{item.work_title}</TableCell>
                            <TableCell>
                              {item.recordings?.length > 0 ? (
                                <div className="space-y-1">
                                  {item.recordings.map((r, i) => (
                                    <div key={i} className="text-sm">{r.recording_title || '-'}</div>
                                  ))}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {item.recordings?.length > 0 ? (
                                <div className="space-y-1">
                                  {item.recordings.map((r, i) => (
                                    <div key={i} className="text-sm">{r.artist_name || '-'}</div>
                                  ))}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {item.recordings?.length > 0 ? (
                                <div className="space-y-1">
                                  {item.recordings.map((r, i) => (
                                    <div key={i} className="font-mono text-xs">{r.isrc || '-'}</div>
                                  ))}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{item.iswc || '-'}</TableCell>
                            <TableCell>
                              {item.writers?.map(w => `${w.writer_name} (${w.ownership_percentage}%)`).join(', ') || '-'}
                            </TableCell>
                            <TableCell>
                              {item.publishers?.map(p => `${p.publisher_name} (${p.ownership_percentage}%)`).join(', ') || '-'}
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
                      <Button onClick={handleUpload}>
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
          )}
        </DialogContent>
      </Dialog>

      {/* Results Modal - CRITICAL: Always shown after upload */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent 
          className="max-w-5xl max-h-[90vh] flex flex-col"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {uploadResults.failureCount === 0 && uploadResults.successCount > 0 ? (
                <CheckCircle className="w-7 h-7 text-green-600" />
              ) : uploadResults.successCount > 0 && uploadResults.failureCount > 0 ? (
                <AlertCircle className="w-7 h-7 text-yellow-600" />
              ) : (
                <AlertCircle className="w-7 h-7 text-red-600" />
              )}
              Bulk Upload Complete - Detailed Report
            </DialogTitle>
            <DialogDescription className="text-base">
              Processed {uploadResults.successCount + uploadResults.skippedCount + uploadResults.failureCount} total records: 
              <span className="font-semibold text-green-600 ml-1">{uploadResults.successCount} successful</span>
              {uploadResults.skippedCount > 0 && (
                <span className="font-semibold text-blue-600 ml-1">, {uploadResults.skippedCount} skipped</span>
              )}
              {uploadResults.failureCount > 0 && (
                <span className="font-semibold text-red-600 ml-1">, {uploadResults.failureCount} failed</span>
              )}
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              aria-label="Close"
              onClick={() => { setShowResultsModal(false); if (onSuccess && uploadResults.successCount > 0) onSuccess(); }}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-auto pr-4">
          <div className="space-y-4">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-950 border-2 border-green-500 dark:border-green-600">
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <div className="text-4xl font-bold text-green-700 dark:text-green-300">{uploadResults.successCount}</div>
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300 mt-2">Successfully Uploaded</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">Works added to catalog</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={`border-2 ${uploadResults.skippedCount > 0 ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 dark:border-blue-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600'}`}>
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <AlertCircle className={`w-10 h-10 mx-auto mb-3 ${uploadResults.skippedCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                    <div className={`text-4xl font-bold ${uploadResults.skippedCount > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                      {uploadResults.skippedCount}
                    </div>
                    <div className={`text-sm font-semibold mt-2 ${uploadResults.skippedCount > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                      Skipped
                    </div>
                    <div className={`text-xs mt-1 ${uploadResults.skippedCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                      {uploadResults.skippedCount > 0 ? 'Already exist' : 'No duplicates'}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={`border-2 ${uploadResults.failureCount > 0 ? 'bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600'}`}>
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    {uploadResults.failureCount > 0 ? (
                      <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto mb-3" />
                    ) : (
                      <CheckCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    )}
                    <div className={`text-4xl font-bold ${uploadResults.failureCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-500'}`}>
                      {uploadResults.failureCount}
                    </div>
                    <div className={`text-sm font-semibold mt-2 ${uploadResults.failureCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-500'}`}>
                      Failed to Upload
                    </div>
                    <div className={`text-xs mt-1 ${uploadResults.failureCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                      {uploadResults.failureCount > 0 ? 'Review errors below' : 'No errors!'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Success, Skipped and Failed Entries */}
            <Tabs defaultValue={uploadResults.failureCount > 0 ? "failed" : uploadResults.skippedCount > 0 ? "skipped" : "success"} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="success">
                  Successful ({uploadResults.successCount})
                </TabsTrigger>
                <TabsTrigger value="skipped">
                  Skipped ({uploadResults.skippedCount})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Failed ({uploadResults.failureCount})
                </TabsTrigger>
              </TabsList>

              {/* Successful Entries - Enhanced Detail */}
              <TabsContent value="success">
                {uploadResults.successCount > 0 ? (
                  <div className="border-2 border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
                    <div className="bg-green-100 dark:bg-green-950 px-4 py-3 font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-400" />
                        <span className="text-green-900 dark:text-green-100">Successfully Uploaded Works</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100">
                        {uploadResults.successCount} works
                      </Badge>
                    </div>
                     <ScrollArea className="h-[350px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-20">Row #</TableHead>
                            <TableHead className="min-w-[300px]">Work Title</TableHead>
                            <TableHead className="min-w-[200px]">Work ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadResults.successfulWorks.map((work, index) => (
                            <TableRow key={index} className="hover:bg-green-50 dark:hover:bg-green-950/30">
                              <TableCell className="font-mono text-sm">{work.row}</TableCell>
                              <TableCell className="font-semibold">{work.title}</TableCell>
                              <TableCell className="font-mono text-sm text-muted-foreground">{work.work_id}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="font-semibold text-lg">No successful uploads</p>
                    <p className="text-sm mt-1">All records failed - check the Failed tab for details</p>
                  </div>
                )}
              </TabsContent>

              {/* Skipped Entries - Already Existing Works */}
              <TabsContent value="skipped">
                {uploadResults.skippedCount > 0 ? (
                  <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                    <div className="bg-blue-100 dark:bg-blue-950 px-4 py-3 font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                        <span className="text-blue-900 dark:text-blue-100">Skipped Works - Already Exist</span>
                      </div>
                      <Badge variant="secondary" className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                        {uploadResults.skippedCount} skipped
                      </Badge>
                    </div>
                    <ScrollArea className="h-[350px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-20">Row #</TableHead>
                            <TableHead className="min-w-[200px]">Work Title</TableHead>
                            <TableHead className="min-w-[300px]">Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadResults.skippedWorks.map((work, index) => (
                            <TableRow key={index} className="hover:bg-blue-50 dark:hover:bg-blue-950/30">
                              <TableCell className="font-mono text-sm font-medium">{work.row}</TableCell>
                              <TableCell className="font-semibold">{work.title}</TableCell>
                              <TableCell className="text-blue-700 dark:text-blue-300 text-sm">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span className="break-words">{work.reason}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    <div className="bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-800 dark:text-blue-200 border-t border-blue-200 dark:border-blue-800">
                      <p className="font-semibold mb-1">ℹ️ Info:</p>
                      <p className="text-xs">These works were automatically skipped because they already exist in your database. No duplicates were created.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="font-semibold text-lg">No Duplicates Found</p>
                    <p className="text-sm mt-1">All uploaded works were new to your catalog</p>
                  </div>
                )}
              </TabsContent>

              {/* Failed Entries - Enhanced Error Details */}
              <TabsContent value="failed">
                {uploadResults.failureCount > 0 ? (
                  <div className="border-2 border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                    <div className="bg-red-100 dark:bg-red-950 px-4 py-3 font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-400" />
                        <span className="text-red-900 dark:text-red-100">Failed Uploads - Action Required</span>
                      </div>
                      <Badge variant="destructive" className="bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100">
                        {uploadResults.failureCount} errors
                      </Badge>
                    </div>
                    <ScrollArea className="h-[350px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-20">Row #</TableHead>
                            <TableHead className="min-w-[200px]">Work Title</TableHead>
                            <TableHead className="min-w-[400px]">Error Details & Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadResults.errors.map((error, index) => (
                            <TableRow key={index} className="hover:bg-red-50 dark:hover:bg-red-950/30">
                              <TableCell className="font-mono text-sm font-medium">{error.row}</TableCell>
                              <TableCell className="font-semibold">{error.title || 'N/A'}</TableCell>
                              <TableCell className="text-destructive text-sm">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <div className="break-words whitespace-pre-wrap">{error.error}</div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    <div className="bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm text-red-800 dark:text-red-200 border-t border-red-200 dark:border-red-800">
                      <p className="font-semibold mb-1">💡 Next Steps:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        <li>Click <strong>"Retry Failed"</strong> button below to automatically retry all failed records</li>
                        <li>Or review error details and fix issues in your CSV file</li>
                        <li>Retry will attempt to upload these exact records again</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="font-bold text-xl text-green-700 dark:text-green-400">Perfect! No Errors</p>
                    <p className="text-sm mt-2">All records uploaded successfully</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          </ScrollArea>

          <DialogFooter className="flex justify-between items-center gap-3">
            <div className="text-sm text-muted-foreground flex-1">
              {uploadResults.failureCount > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-medium">⚠️ Review failed entries or retry</span>
              ) : (
                <span className="text-green-600 dark:text-green-400 font-medium">✓ All records processed successfully</span>
              )}
            </div>
            <div className="flex gap-2">
              {uploadResults.failureCount > 0 && failedRecordsData.length > 0 && (
                <Button 
                  variant="default" 
                  onClick={handleRetryFailed}
                  disabled={isRetrying || isProcessing}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry {failedRecordsData.length} Failed
                    </>
                  )}
                </Button>
              )}
              <Button 
                onClick={() => {
                  setShowResultsModal(false);
                  resetUpload();
                  if (uploadResults.successCount > 0 && onSuccess) {
                    onSuccess();
                  }
                  if (uploadResults.successCount > 0) {
                    toast({
                      title: "Upload Complete",
                      description: `Successfully uploaded ${uploadResults.successCount} copyright${uploadResults.successCount !== 1 ? 's' : ''}`,
                    });
                  }
                }}
                variant={uploadResults.successCount > 0 && uploadResults.failureCount === 0 ? 'default' : 'outline'}
              >
                {uploadResults.successCount > 0 && uploadResults.failureCount === 0 ? 'Done' : 'Close'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};