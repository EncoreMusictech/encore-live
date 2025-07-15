import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface RoyaltyAllocation {
  id: string;
  user_id: string;
  work_id: string;
  batch_id?: string;
  copyright_id?: string;
  song_title: string;
  isrc?: string;
  artist?: string;
  gross_royalty_amount: number;
  controlled_status: 'Controlled' | 'Non-Controlled';
  recoupable_expenses: boolean;
  contract_terms: any;
  ownership_splits: any;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface RoyaltyWriter {
  id: string;
  royalty_id: string;
  contact_id: string;
  writer_share_percentage: number;
  performance_share: number;
  mechanical_share: number;
  synchronization_share: number;
  created_at: string;
}

export function useRoyaltyAllocations() {
  const [allocations, setAllocations] = useState<RoyaltyAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAllocations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('royalty_allocations')
        .select(`
          *,
          reconciliation_batches(batch_id, source),
          copyrights(work_title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllocations(data || []);
    } catch (error: any) {
      console.error('Error fetching allocations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch royalty allocations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAllocation = async (allocationData: Omit<RoyaltyAllocation, 'id' | 'user_id' | 'work_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('royalty_allocations')
        .insert({
          ...allocationData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Royalty allocation ${data.work_id} created successfully`,
      });

      await fetchAllocations();
      return data;
    } catch (error: any) {
      console.error('Error creating allocation:', error);
      toast({
        title: "Error",
        description: "Failed to create royalty allocation",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAllocation = async (id: string, allocationData: Partial<RoyaltyAllocation>) => {
    try {
      const { data, error } = await supabase
        .from('royalty_allocations')
        .update(allocationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Royalty allocation updated successfully",
      });

      await fetchAllocations();
      return data;
    } catch (error: any) {
      console.error('Error updating allocation:', error);
      toast({
        title: "Error",
        description: "Failed to update royalty allocation",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteAllocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('royalty_allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Royalty allocation deleted successfully",
      });

      await fetchAllocations();
    } catch (error: any) {
      console.error('Error deleting allocation:', error);
      toast({
        title: "Error",
        description: "Failed to delete royalty allocation",
        variant: "destructive",
      });
    }
  };

  const addWriterToAllocation = async (royaltyId: string, writerData: Omit<RoyaltyWriter, 'id' | 'royalty_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('royalty_writers')
        .insert({
          ...writerData,
          royalty_id: royaltyId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Writer added to royalty allocation",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding writer:', error);
      toast({
        title: "Error",
        description: "Failed to add writer to royalty allocation",
        variant: "destructive",
      });
      return null;
    }
  };

  const removeWriterFromAllocation = async (writerId: string) => {
    try {
      const { error } = await supabase
        .from('royalty_writers')
        .delete()
        .eq('id', writerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Writer removed from royalty allocation",
      });
    } catch (error: any) {
      console.error('Error removing writer:', error);
      toast({
        title: "Error",
        description: "Failed to remove writer from royalty allocation",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [user]);

  return {
    allocations,
    loading,
    createAllocation,
    updateAllocation,
    deleteAllocation,
    addWriterToAllocation,
    removeWriterFromAllocation,
    refreshAllocations: fetchAllocations,
  };
}