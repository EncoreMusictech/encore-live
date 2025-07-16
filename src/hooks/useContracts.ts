import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Contract = Tables<'contracts'>;
export type ContractInsert = TablesInsert<'contracts'>;
export type ContractInterestedParty = Tables<'contract_interested_parties'>;
export type ContractScheduleWork = Tables<'contract_schedule_works'>;

export interface ContractWithRelations extends Contract {
  interested_parties?: ContractInterestedParty[];
  schedule_works?: ContractScheduleWork[];
}

export const useContracts = () => {
  const [contracts, setContracts] = useState<ContractWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_interested_parties(*),
          contract_schedule_works(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contracts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContract = async (contractData: Omit<ContractInsert, 'user_id'>) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('contracts')
        .insert({
          user_id: user.data.user.id,
          ...contractData
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchContracts(); // Refresh the list
      
      toast({
        title: "Success",
        description: "Contract created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: "Failed to create contract",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContract = async (id: string, updates: Partial<ContractInsert>) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchContracts(); // Refresh the list
      
      toast({
        title: "Success",
        description: "Contract updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: "Failed to update contract",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteContract = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchContracts(); // Refresh the list
      
      toast({
        title: "Success",
        description: "Contract deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        title: "Error",
        description: "Failed to delete contract",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Interested Parties Management
  const addInterestedParty = async (contractId: string, partyData: Omit<ContractInterestedParty, 'id' | 'contract_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('contract_interested_parties')
        .insert({
          contract_id: contractId,
          ...partyData
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchContracts(); // Refresh to get updated data
      
      toast({
        title: "Success",
        description: "Interested party added successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding interested party:', error);
      toast({
        title: "Error",
        description: "Failed to add interested party",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateInterestedParty = async (partyId: string, updates: Partial<ContractInterestedParty>) => {
    try {
      const { data, error } = await supabase
        .from('contract_interested_parties')
        .update(updates)
        .eq('id', partyId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchContracts(); // Refresh to get updated data
      
      toast({
        title: "Success",
        description: "Interested party updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating interested party:', error);
      toast({
        title: "Error",
        description: "Failed to update interested party",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeInterestedParty = async (partyId: string) => {
    try {
      const { error } = await supabase
        .from('contract_interested_parties')
        .delete()
        .eq('id', partyId);

      if (error) throw error;
      
      await fetchContracts(); // Refresh to get updated data
      
      toast({
        title: "Success",
        description: "Interested party removed successfully",
      });
    } catch (error) {
      console.error('Error removing interested party:', error);
      toast({
        title: "Error",
        description: "Failed to remove interested party",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Schedule of Works Management
  const addScheduleWork = async (contractId: string, workData: Omit<ContractScheduleWork, 'id' | 'contract_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('contract_schedule_works')
        .insert({
          contract_id: contractId,
          ...workData
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchContracts(); // Refresh to get updated data
      
      toast({
        title: "Success",
        description: "Work added to schedule successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding schedule work:', error);
      toast({
        title: "Error",
        description: "Failed to add work to schedule",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeScheduleWork = async (workId: string) => {
    try {
      const { error } = await supabase
        .from('contract_schedule_works')
        .delete()
        .eq('id', workId);

      if (error) throw error;
      
      await fetchContracts(); // Refresh to get updated data
      
      toast({
        title: "Success",
        description: "Work removed from schedule successfully",
      });
    } catch (error) {
      console.error('Error removing schedule work:', error);
      toast({
        title: "Error",
        description: "Failed to remove work from schedule",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Validation functions
  const validateRoyaltySplits = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('validate_royalty_splits', { contract_id_param: contractId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error validating royalty splits:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return {
    contracts,
    loading,
    createContract,
    updateContract,
    deleteContract,
    addInterestedParty,
    updateInterestedParty,
    removeInterestedParty,
    addScheduleWork,
    removeScheduleWork,
    validateRoyaltySplits,
    refetch: fetchContracts
  };
};