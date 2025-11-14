import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkWorksUploadProps {
  companyId: string;
  companyName: string;
}

export function BulkWorksUpload({ companyId, companyName }: BulkWorksUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; total: number } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Read the Excel/CSV file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setProgress(20);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let successCount = 0;
      let failedCount = 0;

      // Fetch all existing ISRCs for this user at once (performance optimization)
      const { data: existingRecordings } = await supabase
        .from('copyright_recordings')
        .select('isrc, copyright_id')
        .not('isrc', 'is', null);

      // Get user's copyright IDs to filter recordings
      const { data: userCopyrights } = await supabase
        .from('copyrights')
        .select('id')
        .eq('user_id', user.id);

      const userCopyrightIds = new Set(userCopyrights?.map(c => c.id) || []);
      const existingIsrcs = new Set(
        existingRecordings
          ?.filter(r => userCopyrightIds.has(r.copyright_id))
          .map(r => r.isrc) || []
      );
      
      // Track ISRCs being added in this batch to prevent duplicates within upload
      const batchIsrcs = new Set<string>();
      setProgress(15);

      // Process each work
      for (let i = 0; i < jsonData.length; i++) {
        const work = jsonData[i] as Record<string, string>;
        
        try {
          const workTitle = work.title || work.work_title || 'Untitled';
          const isrc = work.isrc || work.ISRC || null;
          
          // Determine work type: if title contains (Video), it's a video, otherwise audio
          const isVideo = /\(video\)/i.test(workTitle);
          const workType = isVideo ? 'Video' : 'Audio Recording';
          
          // Check for ISRC duplicates (both existing and within current batch)
          if (isrc) {
            if (existingIsrcs.has(isrc)) {
              console.warn(`Row ${i + 1} - ${workTitle}: ISRC duplicate in database (${isrc}), skipping`);
              failedCount++;
              setProgress(15 + ((i + 1) / jsonData.length) * 85);
              continue;
            }
            if (batchIsrcs.has(isrc)) {
              console.warn(`Row ${i + 1} - ${workTitle}: ISRC duplicate in upload batch (${isrc}), skipping`);
              failedCount++;
              setProgress(15 + ((i + 1) / jsonData.length) * 85);
              continue;
            }
            batchIsrcs.add(isrc);
          }
          
          // Generate unique internal_id with UUID to prevent any duplicates
          const sanitizedTitle = workTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 40);
          const typeSlug = workType.toLowerCase().replace(/\s+/g, '-');
          const uniqueId = crypto.randomUUID().substring(0, 8);
          const internalId = `${sanitizedTitle}-${typeSlug}-${uniqueId}`;
          
          // @ts-ignore - Avoid deep type instantiation
          const { data: copyright, error: copyrightError } = await supabase
            .from('copyrights')
            .insert({
              user_id: user.id,
              work_title: workTitle,
              work_type: workType,
              internal_id: internalId,
              iswc: work.iswc || null,
              notes: `Bulk uploaded for ${companyName}`,
            })
            .select()
            .single();

          if (copyrightError) throw copyrightError;

          // Create recording entry with ISRC if provided
          if (isrc) {
            const { error: recordingError } = await supabase
              .from('copyright_recordings')
              .insert({
                copyright_id: copyright.id,
                isrc: isrc,
                recording_title: workTitle,
                artist_name: work.artist || work.writer || null,
              });

            if (recordingError) throw recordingError;
          }

          // Link to sub-account (using catalog_items for now as we don't have sub_account_works)
          // @ts-ignore - Avoid deep type instantiation
          const { error: linkError } = await supabase
            .from('catalog_items')
            .insert({
              company_id: companyId,
              user_id: user.id,
              title: workTitle,
              artist: work.artist || work.writer || 'Unknown',
              isrc: isrc,
              metadata: { 
                copyright_id: copyright.id, 
                bulk_upload: true,
                work_type: workType 
              },
            });

          if (linkError) throw linkError;

          successCount++;
        } catch (error: any) {
          console.error(`Error processing row ${i + 1}:`, error);
          failedCount++;
        }

        setProgress(15 + ((i + 1) / jsonData.length) * 85);
      }

      setResults({
        success: successCount,
        failed: failedCount,
        total: jsonData.length,
      });

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${successCount} of ${jsonData.length} works`,
      });

    } catch (error: any) {
      console.error('Error uploading works:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload works',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Works Upload</CardTitle>
        <CardDescription>
          Upload multiple works at once for {companyName} using Excel or CSV files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary hover:underline">Choose a file</span> or drag and drop
                </Label>
                <p className="text-sm text-muted-foreground mt-1">Excel (.xlsx, .xls) or CSV files</p>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
          </div>

          {file && !uploading && !results && (
            <Button onClick={handleUpload} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload Works
            </Button>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading works...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{results.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Success</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{results.success}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{results.failed}</div>
                </CardContent>
              </Card>
            </div>
            <Button variant="outline" onClick={() => setResults(null)} className="w-full">
              Upload Another File
            </Button>
          </div>
        )}

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              File Format Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Your file should include the following columns:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>title</strong> or <strong>work_title</strong> (required)</li>
              <li><strong>artist</strong> or <strong>writer</strong> (optional)</li>
              <li><strong>iswc</strong> (optional)</li>
              <li><strong>writers_publishers</strong> (optional, JSON format)</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
