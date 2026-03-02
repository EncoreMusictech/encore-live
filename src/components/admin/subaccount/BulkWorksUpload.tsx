import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { logPlatformError } from '@/lib/platformErrorLogger';
import { showUploadFailure } from '@/hooks/useUploadFailureModal';
import { groupRowsIntoWorks, type GroupedWork } from './bulkUploadUtils';

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

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Work Title': 'Best Friends',
        'Alternate Title': '',
        'Main Artist': 'Sophia Grace',
        'Featured Artist': '',
        'ISRC': 'QMFEX1300002',
        'ISWC': '',
        'Album Title': 'Sample Album',
        'Administrator': 'PAQ Publishing',
        'Content (Clean / Explicit / Neither)': 'Clean',
        'Name of Writer(s)': 'Donald Augustus Sales pka Hazel',
        'First Name': 'Donald',
        'Last Name': 'Sales',
        'Share': 70,
        'PRO': 'ASCAP',
        'IPI': '423630488',
        'Controlled (Y/N)': 'Y',
        'Writer Role': 'composer',
        'Notes': '',
      },
      {
        'Work Title': '',
        'Alternate Title': '',
        'Main Artist': '',
        'Featured Artist': '',
        'ISRC': '',
        'ISWC': '',
        'Album Title': '',
        'Administrator': '',
        'Content (Clean / Explicit / Neither)': '',
        'Name of Writer(s)': 'Sophia Grace Brownlee',
        'First Name': 'Sophia',
        'Last Name': 'Brownlee',
        'Share': 30,
        'PRO': 'ASCAP',
        'IPI': '766580896',
        'Controlled (Y/N)': 'N',
        'Writer Role': 'lyricist',
        'Notes': '',
      },
      {
        'Work Title': 'Another Song',
        'Alternate Title': '',
        'Main Artist': 'John Doe',
        'Featured Artist': '',
        'ISRC': 'USRC12345678',
        'ISWC': 'T-123456789-C',
        'Album Title': '',
        'Administrator': '',
        'Content (Clean / Explicit / Neither)': '',
        'Name of Writer(s)': 'John Doe',
        'First Name': 'John',
        'Last Name': 'Doe',
        'Share': 100,
        'PRO': 'BMI',
        'IPI': '12345678',
        'Controlled (Y/N)': 'Y',
        'Writer Role': 'composer',
        'Notes': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Copyright Bulk Upload Template');

    const cols = Object.keys(templateData[0]).map(key => ({ wch: Math.max(key.length + 4, 18) }));
    ws['!cols'] = cols;

    XLSX.writeFile(wb, 'copyright_bulk_upload_template.xlsx');
    toast({ title: 'Template Downloaded', description: 'Open the file and fill in your works data. Works with multiple writers use multiple rows (leave Work Title blank for additional writers).' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'Error', description: 'Please select a file to upload', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Parse the file
      let jsonData: Record<string, string>[];
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];
      } catch (parseError: any) {
        await logPlatformError({
          error_source: 'bulk_works_upload', error_type: 'file_parse_error',
          error_message: `Failed to parse uploaded file: ${parseError.message}`,
          error_details: { file_name: file.name, file_size: file.size, file_type: file.type, stack: parseError.stack },
          module: 'sub_account_works', action: 'bulk_upload_parse', severity: 'error',
          company_id: companyId, company_name: companyName,
        });
        throw parseError;
      }

      if (!jsonData.length) {
        await logPlatformError({
          error_source: 'bulk_works_upload', error_type: 'empty_file',
          error_message: 'Uploaded file contains no data rows',
          error_details: { file_name: file.name },
          module: 'sub_account_works', action: 'bulk_upload_validate', severity: 'warning',
          company_id: companyId, company_name: companyName,
        });
        toast({ title: 'Error', description: 'File contains no data rows', variant: 'destructive' });
        setUploading(false);
        setFile(null);
        return;
      }

      setProgress(10);

      // Group rows into works (handles both flat and PAQ multi-row formats)
      const groupedWorks = groupRowsIntoWorks(jsonData);

      if (!groupedWorks.length) {
        toast({ title: 'Error', description: 'No works found in file. Ensure at least one row has a Work Title.', variant: 'destructive' });
        setUploading(false);
        setFile(null);
        return;
      }

      setProgress(15);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await logPlatformError({
          error_source: 'bulk_works_upload', error_type: 'auth_error',
          error_message: 'User not authenticated during bulk upload',
          error_details: { file_name: file.name, work_count: groupedWorks.length },
          module: 'sub_account_works', action: 'bulk_upload_auth', severity: 'error',
          company_id: companyId, company_name: companyName,
        });
        throw new Error('Not authenticated');
      }

      // Resolve the effective user_id for this sub-account:
      // 1. Try the company's service account first
      // 2. Fall back to the first active company_user
      // 3. Last resort: use the current (admin) user
      let effectiveUserId = user.id;

      const { data: serviceAccount } = await supabase
        .from('company_service_accounts')
        .select('service_user_id')
        .eq('company_id', companyId)
        .maybeSingle();

      if (serviceAccount?.service_user_id) {
        effectiveUserId = serviceAccount.service_user_id;
      } else {
        const { data: companyUser } = await supabase
          .from('company_users')
          .select('user_id')
          .eq('company_id', companyId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (companyUser?.user_id) {
          effectiveUserId = companyUser.user_id;
        }
      }

      let successCount = 0;
      let failedCount = 0;
      const failedRows: { row: number | string; title: string; error: string; details: any }[] = [];

      // Prefetch existing ISRCs for duplicate detection
      const { data: existingRecordings } = await supabase
        .from('copyright_recordings')
        .select('isrc, copyright_id')
        .not('isrc', 'is', null);

      const { data: userCopyrights } = await supabase
        .from('copyrights')
        .select('id')
        .eq('user_id', effectiveUserId);
      const userCopyrightIds = new Set(userCopyrights?.map(c => c.id) || []);
      const existingIsrcs = new Set(
        existingRecordings?.filter(r => userCopyrightIds.has(r.copyright_id)).map(r => r.isrc) || []
      );
      const batchIsrcs = new Set<string>();

      // Prefetch publishing entities for this company to resolve Administrator names
      const { data: publishingEntities } = await supabase
        .from('publishing_entities')
        .select('id, name, display_name, administrator')
        .eq('company_id', companyId)
        .eq('status', 'active');

      // Build lookup map: lowercase name/display_name/administrator → entity id
      const entityLookup = new Map<string, string>();
      for (const entity of publishingEntities || []) {
        if (entity.name) entityLookup.set(entity.name.toLowerCase(), entity.id);
        if (entity.display_name) entityLookup.set(entity.display_name.toLowerCase(), entity.id);
        if (entity.administrator) entityLookup.set(entity.administrator.toLowerCase(), entity.id);
      }

      setProgress(20);

      // Process each grouped work
      for (let i = 0; i < groupedWorks.length; i++) {
        const work = groupedWorks[i];
        const rowLabel = work.sourceRows.join(',');

        try {
          // ISRC duplicate checks
          if (work.isrc) {
            if (existingIsrcs.has(work.isrc)) {
              failedRows.push({ row: rowLabel, title: work.title, error: `ISRC duplicate in database (${work.isrc})`, details: { isrc: work.isrc, duplicate_type: 'database' } });
              failedCount++;
              setProgress(20 + ((i + 1) / groupedWorks.length) * 75);
              continue;
            }
            if (batchIsrcs.has(work.isrc)) {
              failedRows.push({ row: rowLabel, title: work.title, error: `ISRC duplicate in upload batch (${work.isrc})`, details: { isrc: work.isrc, duplicate_type: 'batch' } });
              failedCount++;
              setProgress(20 + ((i + 1) / groupedWorks.length) * 75);
              continue;
            }
            batchIsrcs.add(work.isrc);
          }

          // Generate unique internal_id
          const sanitizedTitle = work.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40);
          const typeSlug = work.workType.toLowerCase().replace(/\s+/g, '-');
          const uniqueId = crypto.randomUUID().substring(0, 8);
          const internalId = `${sanitizedTitle}-${typeSlug}-${uniqueId}`;

          // Generate a unique work_id to avoid collisions on copyrights_work_id_key
          const workIdDate = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 8);
          const workIdUnique = crypto.randomUUID().substring(0, 8);
          const workId = `W${workIdDate}-${workIdUnique}`;

          // Resolve publishing entity from Administrator column
          const resolvedEntityId = work.administrator
            ? entityLookup.get(work.administrator.toLowerCase()) || null
            : null;

          // Insert copyright record
          // @ts-ignore - Avoid deep type instantiation
          const { data: copyright, error: copyrightError } = await supabase
            .from('copyrights')
            .insert({
              user_id: effectiveUserId,
              work_title: work.title,
              work_type: work.workType,
              internal_id: internalId,
              work_id: workId,
              iswc: work.iswc || null,
              album_title: work.albumTitle || null,
              publishing_entity_id: resolvedEntityId,
              notes: `Bulk uploaded for ${companyName}`,
            })
            .select()
            .single();

          if (copyrightError) {
            failedRows.push({ row: rowLabel, title: work.title, error: `Copyright insert failed: ${copyrightError.message}`, details: { code: copyrightError.code } });
            throw copyrightError;
          }

          // Insert recording if ISRC exists
          if (work.isrc) {
            const { error: recordingError } = await supabase
              .from('copyright_recordings')
              .insert({
                copyright_id: copyright.id,
                isrc: work.isrc,
                recording_title: work.title,
                artist_name: work.artist || null,
              });

            if (recordingError) {
              failedRows.push({ row: rowLabel, title: work.title, error: `Recording insert failed: ${recordingError.message}`, details: { code: recordingError.code, isrc: work.isrc } });
              throw recordingError;
            }
          }

          // Insert writers
          if (work.writers.length > 0) {
            for (const writer of work.writers) {
              const { error: writerError } = await supabase
                .from('copyright_writers')
                .insert({
                  copyright_id: copyright.id,
                  writer_name: writer.name,
                  ipi_number: writer.ipi || null,
                  ownership_percentage: writer.share,
                  pro_affiliation: writer.pro || null,
                  controlled_status: writer.controlled ? 'C' : 'NC',
                  writer_role: writer.role || 'composer',
                });

              if (writerError) {
                console.error(`Writer insert failed for "${writer.name}":`, writerError);
                // Non-fatal: log but continue with other writers
              }
            }
          }

          // Link to sub-account catalog
          // @ts-ignore - Avoid deep type instantiation
          const { error: linkError } = await supabase
            .from('catalog_items')
            .insert({
              company_id: companyId,
              user_id: effectiveUserId,
              title: work.title,
              artist: work.artist || (work.writers[0]?.name) || 'Unknown',
              isrc: work.isrc,
              metadata: {
                copyright_id: copyright.id,
                bulk_upload: true,
                work_type: work.workType,
                writer_count: work.writers.length,
              },
            });

          if (linkError) {
            failedRows.push({ row: rowLabel, title: work.title, error: `Catalog link failed: ${linkError.message}`, details: { code: linkError.code } });
            throw linkError;
          }

          successCount++;
        } catch (error: any) {
          console.error(`Error processing work "${work.title}" (rows ${rowLabel}):`, error);
          failedCount++;
        }

        setProgress(20 + ((i + 1) / groupedWorks.length) * 75);
      }

      // Log failures
      if (failedRows.length > 0) {
        await logPlatformError({
          error_source: 'bulk_works_upload', error_type: 'row_processing_failures',
          error_message: `${failedRows.length} of ${groupedWorks.length} works failed during bulk upload for ${companyName}`,
          error_details: { file_name: file.name, total_works: groupedWorks.length, success_count: successCount, failed_count: failedCount, failed_rows: failedRows, uploaded_by: user.email },
          module: 'sub_account_works', action: 'bulk_upload_process',
          severity: failedRows.length === groupedWorks.length ? 'critical' : 'error',
          company_id: companyId, company_name: companyName,
        });
      }

      // Log success for audit trail
      if (successCount > 0) {
        await logPlatformError({
          error_source: 'bulk_works_upload', error_type: 'upload_completed',
          error_message: `Bulk upload completed: ${successCount}/${groupedWorks.length} works succeeded for ${companyName}`,
          error_details: { file_name: file.name, total_works: groupedWorks.length, total_raw_rows: jsonData.length, success_count: successCount, failed_count: failedCount, uploaded_by: user.email },
          module: 'sub_account_works', action: 'bulk_upload_complete',
          severity: failedCount > 0 ? 'warning' : 'info',
          company_id: companyId, company_name: companyName,
        });
      }

      setResults({ success: successCount, failed: failedCount, total: groupedWorks.length });
      toast({ title: 'Upload Complete', description: `Successfully uploaded ${successCount} of ${groupedWorks.length} works` });

    } catch (error: any) {
      console.error('Error uploading works:', error);
      const errorDetails = { stack: error.stack, file_name: file?.name, company_id: companyId };
      await logPlatformError({
        error_source: 'bulk_works_upload', error_type: 'upload_fatal_error',
        error_message: error.message || 'Fatal error during bulk upload',
        error_details: errorDetails, module: 'sub_account_works', action: 'bulk_upload',
        severity: 'critical', company_id: companyId, company_name: companyName,
      });
      showUploadFailure({
        title: 'Bulk Works Upload Failed', source: 'Bulk Works Upload',
        errorMessage: error.message || 'Fatal error during bulk upload', details: errorDetails,
      });
      toast({ title: 'Error', description: error.message || 'Failed to upload works', variant: 'destructive' });
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Bulk Works Upload</CardTitle>
            <CardDescription>
              Upload multiple works at once for {companyName} using Excel or CSV files
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="shrink-0">
            <Download className="h-4 w-4 mr-2" />
            CSV Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileChange(fakeEvent);
                }
              }}
            >
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
                  <CheckCircle2 className="h-4 w-4 text-success" />
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
                  <div className="text-2xl font-bold text-success">{results.success}</div>
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
              <li><strong>Work Title</strong> (required — first row of each work)</li>
              <li><strong>Main Artist</strong>, <strong>Featured Artist</strong>, <strong>ISRC</strong>, <strong>ISWC</strong>, <strong>Album Title</strong> (optional)</li>
              <li><strong>Administrator</strong> — assigns the work to a publishing entity (must match an existing entity name)</li>
              <li><strong>Name of Writer(s)</strong>, <strong>First Name</strong>, <strong>Last Name</strong>, <strong>Share</strong>, <strong>PRO</strong>, <strong>IPI</strong>, <strong>Controlled (Y/N)</strong></li>
            </ul>
            <p className="text-muted-foreground mt-2">
              <strong>Multi-writer works:</strong> Place additional writers on subsequent rows with a blank Work Title. 
              Empty rows between works are ignored.
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
