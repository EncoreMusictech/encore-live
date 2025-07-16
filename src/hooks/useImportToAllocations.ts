import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { RoyaltiesImportStaging } from './useRoyaltiesImport';
import { RoyaltyAllocationInsert } from './useRoyaltyAllocations';

export interface ImportToAllocationParams {
  stagingRecordId: string;
  selectedRows?: number[];
}

export function useImportToAllocations() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const importToAllocations = async ({ stagingRecordId, selectedRows }: ImportToAllocationParams) => {
    if (!user) return null;

    setLoading(true);
    try {
      // Fetch the staging record
      const { data: stagingRecord, error: stagingError } = await supabase
        .from('royalties_import_staging')
        .select('*')
        .eq('id', stagingRecordId)
        .single();

      if (stagingError) throw stagingError;

      const mappedData = Array.isArray(stagingRecord.mapped_data) ? stagingRecord.mapped_data : [];
      const rowsToImport = selectedRows ? 
        mappedData.filter((_, index) => selectedRows.includes(index)) : 
        mappedData;

      if (rowsToImport.length === 0) {
        toast({
          title: "Warning",
          description: "No rows selected for import",
          variant: "destructive",
        });
        return null;
      }

      // Transform mapped data to royalty allocations
      const allocations: RoyaltyAllocationInsert[] = rowsToImport.map((row: any) => ({
        user_id: user.id,
        batch_id: stagingRecord.batch_id,
        song_title: row.song_title || row.work_title || 'Unknown Title',
        artist: row.artist || row.performer || null,
        isrc: row.isrc || null,
        gross_royalty_amount: parseFloat(row.gross_amount || row.amount || 0),
        controlled_status: row.controlled_status || 'Non-Controlled',
        recoupable_expenses: Boolean(row.recoupable || false),
        ownership_splits: row.ownership_splits || {},
        comments: `Imported from ${stagingRecord.detected_source} statement: ${stagingRecord.original_filename}`
      } as RoyaltyAllocationInsert));

      // Insert allocations (cast to any to bypass TypeScript issue with auto-generated fields)
      const { data: insertedAllocations, error: insertError } = await supabase
        .from('royalty_allocations')
        .insert(allocations as any)
        .select();

      if (insertError) throw insertError;

      // Update staging record to mark as processed
      await supabase
        .from('royalties_import_staging')
        .update({ 
          processing_status: 'processed',
          updated_at: new Date().toISOString()
        })
        .eq('id', stagingRecordId);

      toast({
        title: "Success",
        description: `Successfully imported ${insertedAllocations.length} royalty allocations`,
      });

      return insertedAllocations;
    } catch (error: any) {
      console.error('Error importing to allocations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import royalty allocations",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    importToAllocations,
    loading
  };
}