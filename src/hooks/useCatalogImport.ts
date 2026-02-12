import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  StagingRow,
  SheetDetectionResult,
  detectSheetType,
  parseSheetRow,
  normalizeTitle,
  validateStagingRow,
  detectConflicts,
} from '@/lib/catalog-validation';
import { toast } from '@/hooks/use-toast';

export type ImportStep = 'upload' | 'map' | 'review' | 'commit';

export interface ImportBatch {
  id: string;
  file_name: string;
  total_rows: number;
  valid_rows: number;
  duplicate_rows: number;
  error_rows: number;
  status: string;
}

export interface ImportProgress {
  current: number;
  total: number;
  phase: string;
}

export function useCatalogImport() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [sheets, setSheets] = useState<SheetDetectionResult[]>([]);
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Step 1: Parse XLSX ─────────────────────────────────────
  const parseFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      const detected: SheetDetectionResult[] = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        const headers = jsonRows.length > 0 ? Object.keys(jsonRows[0]) : [];
        const sheetType = detectSheetType(name, headers);

        return {
          sheetName: name,
          sheetType,
          headers,
          rowCount: jsonRows.length,
          rows: jsonRows,
        };
      });

      setSheets(detected);
      setStep('map');
      toast({
        title: 'File parsed',
        description: `Found ${detected.length} sheet(s) with ${detected.reduce((s, d) => s + d.rowCount, 0)} total rows`,
      });
    } catch (err) {
      toast({ title: 'Parse error', description: String(err), variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ── Step 2: Normalize & Validate ───────────────────────────
  const normalizeAll = useCallback(() => {
    setIsProcessing(true);
    try {
      let allRows: StagingRow[] = [];

      for (const sheet of sheets) {
        for (const row of sheet.rows) {
          const parsed = parseSheetRow(sheet.sheetType, row, sheet.headers);
          const title = parsed.work_title || '';
          const normalized = normalizeTitle(title);

          if (!title) continue; // skip truly empty rows

          const validation = validateStagingRow(parsed);

          const stagingRow: StagingRow = {
            source_sheet: parsed.source_sheet || sheet.sheetType,
            work_title: title,
            artist_name: parsed.artist_name || '',
            isrc: parsed.isrc || null,
            iswc: parsed.iswc || null,
            normalized_title: normalized,
            writers: parsed.writers || [],
            publishers: parsed.publishers || [],
            canonical_row: (parsed.canonical_row || {}) as Record<string, unknown>,
            identifier_conflicts: [],
            validation_status: validation.status,
            validation_errors: validation.errors,
            raw_row_data: (parsed.raw_row_data || row) as Record<string, unknown>,
          };

          allRows.push(stagingRow);
        }
      }

      // Run conflict detection
      allRows = detectConflicts(allRows);

      setStagingRows(allRows);
      setStep('review');
      toast({
        title: 'Normalization complete',
        description: `${allRows.filter(r => r.validation_status === 'valid').length} valid, ${allRows.filter(r => r.validation_status === 'error').length} errors`,
      });
    } catch (err) {
      toast({ title: 'Normalization error', description: String(err), variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [sheets]);

  // ── Step 3: Insert into staging ────────────────────────────
  const insertStaging = useCallback(async (fileName: string) => {
    setIsProcessing(true);
    try {
      // Refresh auth token
      await supabase.auth.refreshSession();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create batch
      const { data: batchData, error: batchErr } = await supabase
        .from('catalog_import_batches')
        .insert({
          user_id: user.id,
          file_name: fileName,
          total_rows: stagingRows.length,
          valid_rows: stagingRows.filter(r => r.validation_status === 'valid').length,
          duplicate_rows: stagingRows.filter(r => r.validation_status === 'duplicate').length,
          error_rows: stagingRows.filter(r => r.validation_status === 'error').length,
          status: 'validated',
        })
        .select()
        .single();

      if (batchErr) throw batchErr;

      const batchId = batchData.id;

      // Batch insert staging rows (3 at a time with backoff)
      const BATCH_SIZE = 3;
      let inserted = 0;

      for (let i = 0; i < stagingRows.length; i += BATCH_SIZE) {
        const chunk = stagingRows.slice(i, i + BATCH_SIZE).map(row => ({
          import_batch_id: batchId,
          user_id: user.id,
          source_sheet: row.source_sheet,
          work_title: row.work_title,
          artist_name: row.artist_name,
          isrc: row.isrc,
          iswc: row.iswc,
          normalized_title: row.normalized_title,
          writers: row.writers as unknown as Json,
          publishers: row.publishers as unknown as Json,
          canonical_row: row.canonical_row as unknown as Json,
          identifier_conflicts: row.identifier_conflicts as unknown as Json,
          validation_status: row.validation_status,
          validation_errors: row.validation_errors as unknown as Json,
          raw_row_data: row.raw_row_data as unknown as Json,
        }));

        const { error: insertErr } = await supabase
          .from('catalog_import_staging')
          .insert(chunk);

        if (insertErr) {
          // Exponential backoff retry
          await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, Math.floor(i / BATCH_SIZE)), 8000)));
          const { error: retryErr } = await supabase
            .from('catalog_import_staging')
            .insert(chunk);
          if (retryErr) throw retryErr;
        }

        inserted += chunk.length;
        setProgress({ current: inserted, total: stagingRows.length, phase: 'Inserting staging rows' });
      }

      setBatch({
        id: batchId,
        file_name: fileName,
        total_rows: stagingRows.length,
        valid_rows: stagingRows.filter(r => r.validation_status === 'valid').length,
        duplicate_rows: stagingRows.filter(r => r.validation_status === 'duplicate').length,
        error_rows: stagingRows.filter(r => r.validation_status === 'error').length,
        status: 'validated',
      });

      setStep('commit');
      toast({ title: 'Staging complete', description: `${inserted} rows staged for review` });
    } catch (err) {
      toast({ title: 'Staging error', description: String(err), variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [stagingRows]);

  // ── Step 4: Promote to catalog ─────────────────────────────
  const promoteBatch = useCallback(async () => {
    if (!batch) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: batch.valid_rows, phase: 'Promoting to catalog' });

    try {
      const { data, error } = await supabase.rpc('promote_staging_batch', {
        p_batch_id: batch.id,
      });

      if (error) throw error;

      const promotedCount = typeof data === 'number' ? data : 0;

      setBatch(prev => prev ? { ...prev, status: 'committed', valid_rows: promotedCount } : null);
      setProgress({ current: promotedCount, total: promotedCount, phase: 'Complete' });

      toast({
        title: 'Catalog updated',
        description: `${promotedCount} works promoted to the centralized catalog`,
      });
    } catch (err) {
      toast({ title: 'Promotion error', description: String(err), variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [batch]);

  // ── Reset ──────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep('upload');
    setSheets([]);
    setStagingRows([]);
    setBatch(null);
    setProgress(null);
    setIsProcessing(false);
  }, []);

  // ── Row editing ────────────────────────────────────────────
  const updateStagingRow = useCallback((index: number, updates: Partial<StagingRow>) => {
    setStagingRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      // Re-validate
      const validation = validateStagingRow(next[index]);
      next[index].validation_status = validation.status;
      next[index].validation_errors = validation.errors;
      return next;
    });
  }, []);

  return {
    step,
    sheets,
    stagingRows,
    batch,
    progress,
    isProcessing,
    parseFile,
    normalizeAll,
    insertStaging,
    promoteBatch,
    reset,
    updateStagingRow,
    setStep,
  };
}
