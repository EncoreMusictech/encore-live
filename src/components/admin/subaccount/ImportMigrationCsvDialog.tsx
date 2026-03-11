import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImportMigrationCsvDialogProps {
  companyId: string;
  onAdded: () => void;
}

const HEADER_MAP: Record<string, string> = {
  'entity': 'entity_name',
  'administrator': 'administrator',
  'original publisher': 'original_publisher',
  'writer': 'writer_name',
  'contract entered': 'contract_entered',
  'copyrights entered': 'copyrights_entered',
  'schedules attached to contract': 'schedules_attached',
  'schedules attached': 'schedules_attached',
  'payees created': 'payees_created',
  'contract terms confirmed': 'contract_terms_confirmed',
  'payee splits confirmed': 'payee_splits_confirmed',
  'beginning balance entered': 'beginning_balance_entered',
  'client portal created': 'client_portal_created',
  'client assets granted': 'client_assets_granted',
};

const BOOLEAN_FIELDS = new Set([
  'contract_entered', 'copyrights_entered', 'schedules_attached',
  'payees_created', 'contract_terms_confirmed', 'payee_splits_confirmed',
  'beginning_balance_entered', 'client_portal_created', 'client_assets_granted',
]);

function parseBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  const s = String(val ?? '').trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1';
}

type ParsedRow = Record<string, string | boolean | null>;

export function ImportMigrationCsvDialog({ companyId, onAdded }: ImportMigrationCsvDialogProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const { toast } = useToast();

  const reset = () => {
    setRows([]);
    setFileName('');
    setSkippedCount(0);
  };

  const handleFile = useCallback(async (file: File) => {
    reset();
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const mapped: ParsedRow[] = results.data.map((raw: any) => {
          const row: ParsedRow = {};
          for (const [csvHeader, value] of Object.entries(raw)) {
            const key = HEADER_MAP[csvHeader.trim().toLowerCase()];
            if (key) {
              row[key] = BOOLEAN_FIELDS.has(key) ? parseBool(value) : (String(value ?? '').trim() || null);
            }
          }
          return row;
        });

        // Filter out rows without a writer_name
        const valid = mapped.filter(r => r.writer_name);

        // Fetch existing to deduplicate
        const { data: existing } = await supabase
          .from('migration_tracking_items')
          .select('writer_name, entity_name')
          .eq('company_id', companyId);

        const existingSet = new Set(
          (existing || []).map(e => `${(e.writer_name || '').toLowerCase()}|${(e.entity_name || '').toLowerCase()}`)
        );

        const deduped = valid.filter(r => {
          const key = `${String(r.writer_name || '').toLowerCase()}|${String(r.entity_name || '').toLowerCase()}`;
          return !existingSet.has(key);
        });

        setSkippedCount(valid.length - deduped.length);
        setRows(deduped);
      },
      error: (err) => {
        toast({ title: 'Parse Error', description: err.message, variant: 'destructive' });
      },
    });
  }, [companyId, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) handleFile(acceptedFiles[0]);
  }, [handleFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);

    const inserts = rows.map(r => ({
      company_id: companyId,
      writer_name: r.writer_name as string,
      entity_name: (r.entity_name as string) || null,
      administrator: (r.administrator as string) || null,
      original_publisher: (r.original_publisher as string) || null,
      contract_entered: r.contract_entered as boolean ?? false,
      copyrights_entered: r.copyrights_entered as boolean ?? false,
      schedules_attached: r.schedules_attached as boolean ?? false,
      payees_created: r.payees_created as boolean ?? false,
      contract_terms_confirmed: r.contract_terms_confirmed as boolean ?? false,
      payee_splits_confirmed: r.payee_splits_confirmed as boolean ?? false,
      beginning_balance_entered: r.beginning_balance_entered as boolean ?? false,
      client_portal_created: r.client_portal_created as boolean ?? false,
      client_assets_granted: r.client_assets_granted as boolean ?? false,
    }));

    const { error } = await supabase.from('migration_tracking_items').insert(inserts);

    if (error) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Import Complete', description: `${inserts.length} writer(s) imported successfully.` });
      onAdded();
      setOpen(false);
      reset();
    }
    setImporting(false);
  };

  const entityBreakdown = rows.reduce<Record<string, number>>((acc, r) => {
    const entity = (r.entity_name as string) || 'Unassigned';
    acc[entity] = (acc[entity] || 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Migration Tracker CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: Entity, Administrator, Original Publisher, Writer, and the 9 checkpoint columns.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div
            {...getRootProps()}
            data-dropzone
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop CSV here...' : 'Drag & drop a CSV file, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">.csv files only</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{fileName}</span>
              <Button variant="ghost" size="sm" onClick={reset}>Change file</Button>
            </div>

            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{rows.length} new writer(s)</Badge>
                {skippedCount > 0 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-400">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {skippedCount} duplicate(s) skipped
                  </Badge>
                )}
              </div>

              {Object.keys(entityBreakdown).length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Entities: </span>
                  {Object.entries(entityBreakdown).map(([name, count]) => (
                    <span key={name} className="mr-2">{name} ({count})</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
          <Button onClick={handleImport} disabled={rows.length === 0 || importing}>
            {importing ? 'Importing...' : `Import ${rows.length} Writer(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
