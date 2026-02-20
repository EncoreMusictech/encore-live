import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useContracts } from '@/hooks/useContracts';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileSpreadsheet, Upload, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkContractImportProps {
  companyId: string;
  companyName: string;
}

interface ParsedRow {
  title: string;
  counterparty_name: string;
  contract_type: string;
  start_date?: string;
  end_date?: string;
  post_term_collection_end_date?: string;
  post_term_collection_months?: number;
  advance_amount?: number;
  commission_percentage?: number;
  territories?: string;
  party_name?: string;
  party_type?: string;
  performance_pct?: number;
  mechanical_pct?: number;
  synch_pct?: number;
  work_title?: string;
  work_isrc?: string;
  publishing_entity?: string;
  publishing_entity_id?: string;
  errors: string[];
  warnings: string[];
}

const VALID_CONTRACT_TYPES = ['publishing', 'artist', 'producer', 'sync', 'distribution'];

export function BulkContractImport({ companyId, companyName }: BulkContractImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; skipped: number; total: number; royaltyReady: number } | null>(null);
  const { toast } = useToast();
  const { createContract } = useContracts();

  // Fetch publishing entities for this company
  const [entityMap, setEntityMap] = useState<Map<string, string>>(new Map());
  const [entityNames, setEntityNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchEntities = async () => {
      const { data } = await supabase
        .from('publishing_entities')
        .select('id, name, display_name')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (data && data.length > 0) {
        const map = new Map<string, string>();
        const names: string[] = [];
        for (const e of data) {
          const name = e.name?.trim();
          const displayName = e.display_name?.trim();
          if (name) {
            map.set(name.toLowerCase(), e.id);
            names.push(name);
          }
          if (displayName && displayName.toLowerCase() !== name?.toLowerCase()) {
            map.set(displayName.toLowerCase(), e.id);
          }
        }
        setEntityMap(map);
        setEntityNames(names);
      }
    };
    fetchEntities();
  }, [companyId]);

  const hasEntities = entityNames.length > 0;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        title: 'Example Publishing Agreement',
        counterparty_name: 'John Smith',
        contract_type: 'publishing',
        start_date: '2025-01-01',
        end_date: '2027-12-31',
        post_term_collection_end_date: '2029-12-31',
        post_term_collection_months: 24,
        advance_amount: 50000,
        commission_percentage: 15,
        territories: 'US, UK, CA',
        party_name: 'John Smith',
        party_type: 'writer',
        performance_pct: 50,
        mechanical_pct: 50,
        synch_pct: 50,
        work_title: 'Example Song',
        work_isrc: 'USRC12345678',
        publishing_entity: hasEntities ? entityNames[0] : '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contracts Template');
    ws['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 25 }, { wch: 22 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
      { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 20 }, { wch: 16 }, { wch: 22 },
    ];
    XLSX.writeFile(wb, 'bulk-contract-import-template.xlsx');
    toast({ title: 'Template Downloaded', description: 'Fill in your contract data and upload.' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setShowValidation(false);
      setParsedRows([]);
    }
  };

  const validateAndPreview = async () => {
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    const rows: ParsedRow[] = jsonData.map((row) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const title = row.title?.toString()?.trim() || '';
      const counterparty = row.counterparty_name?.toString()?.trim() || '';
      const cType = row.contract_type?.toString()?.toLowerCase()?.trim() || '';

      if (!title) errors.push('Title is required');
      if (!counterparty) errors.push('Counterparty name is required');
      if (cType && !VALID_CONTRACT_TYPES.includes(cType)) errors.push(`Invalid contract type: ${cType}`);

      const postTermMonths = row.post_term_collection_months ? parseInt(row.post_term_collection_months) : undefined;
      if (postTermMonths !== undefined && (isNaN(postTermMonths) || postTermMonths <= 0)) {
        errors.push('Post-term months must be a positive integer');
      }

      // Validate splits warning
      const perf = parseFloat(row.performance_pct) || 0;
      const mech = parseFloat(row.mechanical_pct) || 0;
      const sync = parseFloat(row.synch_pct) || 0;
      if (row.party_name && (perf + mech + sync > 0) && (perf + mech + sync) !== 100 * 3) {
        warnings.push(`Splits may not total 100% per right type (P:${perf}%, M:${mech}%, S:${sync}%)`);
      }

      // Publishing entity resolution
      const entityValue = row.publishing_entity?.toString()?.trim() || '';
      let resolvedEntityId: string | undefined;
      if (entityValue) {
        const id = entityMap.get(entityValue.toLowerCase());
        if (id) {
          resolvedEntityId = id;
        } else {
          errors.push(`Unknown publishing entity: "${entityValue}". Valid options: ${entityNames.join(', ')}`);
        }
      } else if (hasEntities) {
        warnings.push('No publishing entity specified — contract will be unscoped');
      }

      return {
        title,
        counterparty_name: counterparty,
        contract_type: cType || 'publishing',
        start_date: row.start_date?.toString(),
        end_date: row.end_date?.toString(),
        post_term_collection_end_date: row.post_term_collection_end_date?.toString(),
        post_term_collection_months: postTermMonths,
        advance_amount: row.advance_amount ? parseFloat(row.advance_amount) : undefined,
        commission_percentage: row.commission_percentage ? parseFloat(row.commission_percentage) : undefined,
        territories: row.territories?.toString(),
        party_name: row.party_name?.toString()?.trim(),
        party_type: row.party_type?.toString()?.toLowerCase()?.trim() || 'writer',
        performance_pct: perf || undefined,
        mechanical_pct: mech || undefined,
        synch_pct: sync || undefined,
        work_title: row.work_title?.toString()?.trim(),
        work_isrc: row.work_isrc?.toString()?.trim(),
        publishing_entity: entityValue || undefined,
        publishing_entity_id: resolvedEntityId,
        errors,
        warnings,
      };
    });

    setParsedRows(rows);
    setShowValidation(true);
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      toast({ title: 'No valid rows', description: 'Fix validation errors before importing.', variant: 'destructive' });
      return;
    }

    setImporting(true);
    setProgress(0);

    let success = 0;
    let failed = 0;
    let skipped = 0;
    let royaltyReady = 0;
    const BATCH_SIZE = 10;

    // Pre-flight auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      setImporting(false);
      return;
    }

    // Fetch existing contracts for duplicate detection
    const { data: existingContracts } = await supabase
      .from('contracts')
      .select('title, counterparty_name, contract_type')
      .eq('client_company_id', companyId);

    const existingKeys = new Set(
      (existingContracts || []).map(c => `${c.title}|${c.counterparty_name}|${c.contract_type}`.toLowerCase())
    );

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        const key = `${row.title}|${row.counterparty_name}|${row.contract_type}`.toLowerCase();
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }

        let retries = 0;
        const maxRetries = 3;
        let succeeded = false;

        while (retries <= maxRetries && !succeeded) {
          try {
            // Calculate post-term end date
            let postTermEnd = row.post_term_collection_end_date || null;
            if (!postTermEnd && row.post_term_collection_months && row.end_date) {
              const end = new Date(row.end_date);
              end.setMonth(end.getMonth() + row.post_term_collection_months);
              postTermEnd = end.toISOString().split('T')[0];
            }

            const contract = await createContract({
              title: row.title,
              counterparty_name: row.counterparty_name,
              contract_type: row.contract_type as any,
              start_date: row.start_date || null,
              end_date: row.end_date || null,
              advance_amount: row.advance_amount || null,
              commission_percentage: row.commission_percentage || null,
              territories: row.territories ? row.territories.split(',').map(t => t.trim()) : null,
              client_company_id: companyId,
              contract_status: 'draft' as any,
              publishing_entity_id: row.publishing_entity_id || null,
              financial_terms: {
                post_term_collection_months: row.post_term_collection_months || null,
                post_term_collection_end_date: postTermEnd,
              },
            } as any);

            if (contract && row.party_name) {
              await supabase.from('contract_interested_parties').insert({
                contract_id: contract.id,
                name: row.party_name,
                party_type: row.party_type || 'writer',
                performance_percentage: row.performance_pct || 0,
                mechanical_percentage: row.mechanical_pct || 0,
                synch_percentage: row.synch_pct || 0,
                controlled_status: 'C',
              });

              // Check if splits are valid
              if (row.performance_pct === 100 && row.mechanical_pct === 100 && row.synch_pct === 100) {
                royaltyReady++;
              }
            }

            if (contract && row.work_title) {
              await supabase.from('contract_schedule_works').insert({
                contract_id: contract.id,
                song_title: row.work_title,
                isrc: row.work_isrc || null,
              });
            }

            existingKeys.add(key);
            succeeded = true;
            success++;
          } catch (err) {
            retries++;
            if (retries > maxRetries) {
              console.error(`Failed to import row "${row.title}":`, err);
              failed++;
            } else {
              await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            }
          }
        }
      }

      setProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }

    setResults({ success, failed, skipped, total: validRows.length, royaltyReady });
    setImporting(false);
    toast({ title: 'Import Complete', description: `${success} of ${validRows.length} contracts imported.` });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Bulk Contract Import</CardTitle>
            <CardDescription>Import multiple contracts for {companyName} via spreadsheet.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="shrink-0">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showValidation && !results && (
          <>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <Label htmlFor="contract-file-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">Choose a file</span> or drag and drop
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Excel (.xlsx, .xls) or CSV files</p>
                  <Input
                    id="contract-file-upload"
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

            {file && (
              <Button onClick={validateAndPreview} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Validate & Preview
              </Button>
            )}
          </>
        )}

        {showValidation && !importing && !results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Validation Results</h3>
              <div className="flex gap-2">
                <Badge variant="default">{parsedRows.filter(r => r.errors.length === 0).length} valid</Badge>
                <Badge variant="destructive">{parsedRows.filter(r => r.errors.length > 0).length} errors</Badge>
                <Badge variant="secondary">{parsedRows.filter(r => r.warnings.length > 0).length} warnings</Badge>
              </div>
            </div>

            <div className="max-h-[400px] overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Counterparty</th>
                    <th className="p-2 text-left">Type</th>
                    {hasEntities && <th className="p-2 text-left">Publishing Entity</th>}
                    <th className="p-2 text-left">Post-Term</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className={row.errors.length > 0 ? 'bg-destructive/5' : row.warnings.length > 0 ? 'bg-amber-500/5' : ''}>
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{row.title || <span className="text-destructive italic">Missing</span>}</td>
                      <td className="p-2">{row.counterparty_name || <span className="text-destructive italic">Missing</span>}</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">{row.contract_type}</Badge></td>
                      {hasEntities && (
                        <td className="p-2">
                          {row.publishing_entity ? (
                            <Badge variant={row.publishing_entity_id ? 'default' : 'destructive'} className="text-xs">
                              {row.publishing_entity}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Unscoped</span>
                          )}
                        </td>
                      )}
                      <td className="p-2">{row.post_term_collection_months ? `${row.post_term_collection_months}mo` : '—'}</td>
                      <td className="p-2">
                        {row.errors.length > 0 ? (
                          <span className="text-destructive text-xs">{row.errors.join('; ')}</span>
                        ) : row.warnings.length > 0 ? (
                          <span className="text-amber-600 text-xs">{row.warnings.join('; ')}</span>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                className="flex-1"
                disabled={parsedRows.filter(r => r.errors.length === 0).length === 0}
              >
                Import {parsedRows.filter(r => r.errors.length === 0).length} Valid Contracts
              </Button>
              <Button variant="outline" onClick={() => { setShowValidation(false); setFile(null); setParsedRows([]); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {importing && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Importing contracts...</span>
              <span className="ml-auto text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{results.total}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Success</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">{results.success}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-destructive">{results.failed}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Royalty Ready</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-primary">{results.royaltyReady}</div></CardContent>
              </Card>
            </div>
            {results.skipped > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{results.skipped} duplicate contracts were skipped.</AlertDescription>
              </Alert>
            )}
            <Button variant="outline" onClick={() => { setResults(null); setFile(null); setParsedRows([]); setShowValidation(false); }} className="w-full">
              Import Another File
            </Button>
          </div>
        )}

        {!showValidation && !results && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Template Columns
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>title</strong>, <strong>counterparty_name</strong> (required)</li>
                <li><strong>contract_type</strong>: publishing, artist, producer, sync, distribution</li>
                <li><strong>start_date</strong>, <strong>end_date</strong>, <strong>advance_amount</strong>, <strong>commission_percentage</strong></li>
                <li><strong>post_term_collection_months</strong>, <strong>post_term_collection_end_date</strong></li>
                <li><strong>party_name</strong>, <strong>party_type</strong>, splits: <strong>performance_pct</strong>, <strong>mechanical_pct</strong>, <strong>synch_pct</strong></li>
                <li><strong>work_title</strong>, <strong>work_isrc</strong></li>
                {hasEntities && (
                  <li><strong>publishing_entity</strong>: {entityNames.join(', ')}</li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
