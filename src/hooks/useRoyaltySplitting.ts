import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ControlledWriter {
  id: string;
  writer_name: string;
  ownership_percentage: number;
  controlled_status: 'C' | 'NC' | 'Admin';
}

export interface SplitRoyaltyAllocation {
  originalAllocationId: string;
  writerId: string;
  writerName: string;
  ownershipPercentage: number;
  proratedGrossAmount: number;
}

/**
 * Splits a royalty allocation by controlled writers when linked to a copyright
 */
export const useRoyaltySplitting = () => {
  
  const splitRoyaltyByControlledWriters = async (
    allocationId: string,
    copyrightId: string
  ): Promise<SplitRoyaltyAllocation[]> => {
    try {
      // 1. Get the original allocation
      const { data: allocation, error: allocationError } = await supabase
        .from('royalty_allocations')
        .select('*')
        .eq('id', allocationId)
        .single();

      if (allocationError || !allocation) {
        throw new Error('Failed to fetch original allocation');
      }

      // 2. Get controlled writers for this copyright
      const { data: copyrightWriters, error: writersError } = await supabase
        .from('copyright_writers')
        .select('*')
        .eq('copyright_id', copyrightId)
        .eq('controlled_status', 'C'); // Only controlled writers

      if (writersError) {
        throw new Error('Failed to fetch copyright writers');
      }

      if (!copyrightWriters || copyrightWriters.length === 0) {
        toast({
          title: "No Controlled Writers",
          description: "No controlled writers found for this copyright.",
          variant: "destructive"
        });
        return [];
      }

      // 3. Calculate total controlled percentage
      const totalControlledPercentage = copyrightWriters.reduce(
        (sum, writer) => sum + (writer.ownership_percentage || 0), 
        0
      );

      if (totalControlledPercentage === 0) {
        toast({
          title: "No Controlled Share",
          description: "Controlled writers have 0% total share.",
          variant: "destructive"
        });
        return [];
      }

      // 4. Create split allocations for each controlled writer
      const grossAmount = allocation.gross_royalty_amount || allocation.gross_amount || 0;
      const splitAllocations: SplitRoyaltyAllocation[] = [];

      for (const writer of copyrightWriters) {
        const writerShare = (writer.ownership_percentage || 0) / 100;
        const proratedAmount = grossAmount * writerShare;

        // Create new allocation record for this writer
        const newAllocationData = {
          ...allocation,
          id: undefined, // Let database generate new ID
          gross_royalty_amount: proratedAmount,
          gross_amount: proratedAmount,
          work_writers: writer.writer_name,
          ownership_splits: {
            [`copyright_writer_${writer.id}`]: {
              writer_name: writer.writer_name,
              writer_share: writer.ownership_percentage,
              mechanical_share: 0,
              performance_share: 0,
              synchronization_share: 0
            }
          },
          comments: `Split from allocation ${allocationId} - ${writer.writer_name} (${writer.ownership_percentage}%)`,
          created_at: undefined,
          updated_at: undefined
        };

        // Insert the new allocation
        const { data: newAllocation, error: insertError } = await supabase
          .from('royalty_allocations')
          .insert(newAllocationData)
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create split allocation:', insertError);
          continue;
        }

        splitAllocations.push({
          originalAllocationId: allocationId,
          writerId: writer.id,
          writerName: writer.writer_name,
          ownershipPercentage: writer.ownership_percentage || 0,
          proratedGrossAmount: proratedAmount
        });
      }

      // 5. Delete or mark the original allocation as split
      await supabase
        .from('royalty_allocations')
        .update({ 
          comments: `${allocation.comments || ''} [SPLIT INTO ${splitAllocations.length} WRITER ALLOCATIONS]`.trim()
        })
        .eq('id', allocationId);

      // 6. Optionally delete the original allocation
      // await supabase.from('royalty_allocations').delete().eq('id', allocationId);

      return splitAllocations;

    } catch (error) {
      console.error('Error splitting royalty allocation:', error);
      toast({
        title: "Error",
        description: "Failed to split royalty allocation by writers",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * Check if an allocation should be split and automatically do it
   */
  const autoSplitIfNeeded = async (allocationId: string) => {
    try {
      // Get allocation with copyright info
      const { data: allocation, error } = await supabase
        .from('royalty_allocations')
        .select(`
          *,
          copyrights!inner (
            id,
            work_title,
            copyright_writers!inner (
              id,
              writer_name,
              ownership_percentage,
              controlled_status
            )
          )
        `)
        .eq('id', allocationId)
        .single();

      if (error || !allocation) {
        return false;
      }

      // Check if copyright has controlled writers
      const controlledWriters = allocation.copyrights?.copyright_writers?.filter(
        (writer: any) => writer.controlled_status === 'C'
      ) || [];

      // Only split if there are multiple controlled writers or single writer needs prorating
      if (controlledWriters.length > 0 && allocation.copyright_id) {
        // Check if this allocation is already split (has copyright_writer_ in ownership_splits)
        const ownershipSplits = allocation.ownership_splits || {};
        const hasCopyrightWriterSplits = Object.keys(ownershipSplits).some(key => 
          key.startsWith('copyright_writer_')
        );

        if (!hasCopyrightWriterSplits) {
          await splitRoyaltyByControlledWriters(allocationId, allocation.copyright_id);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error in auto-split check:', error);
      return false;
    }
  };

  return {
    splitRoyaltyByControlledWriters,
    autoSplitIfNeeded
  };
};