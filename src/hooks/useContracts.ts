import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Contract = Tables<'contracts'>;
export type ContractInsert = TablesInsert<'contracts'>;
export type ContractInterestedParty = Tables<'contract_interested_parties'>;
export type ContractScheduleWork = Tables<'contract_schedule_works'>;

export interface ContractWithRelations extends Contract {
  contract_interested_parties?: ContractInterestedParty[];
  contract_schedule_works?: ContractScheduleWork[];
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

  const duplicateContract = async (originalId: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No authenticated user');

      // Fetch the original contract with all related data
      const { data: originalContract, error: fetchError } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_interested_parties(*),
          contract_schedule_works(*)
        `)
        .eq('id', originalId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalContract) throw new Error('Contract not found');

      // Create duplicate contract data, excluding fields that should be unique/auto-generated
      const {
        id,
        created_at,
        updated_at,
        user_id,
        version,
        agreement_id,
        contract_interested_parties,
        contract_schedule_works,
        ...contractData
      } = originalContract;

      const duplicateData = {
        ...contractData,
        title: `${contractData.title} (Copy)`,
        version: 1, // Reset version for the duplicate
        contract_status: 'draft' as const, // Set as draft for the duplicate
        user_id: user.data.user.id
      };

      // Create the new contract
      const { data: newContract, error: createError } = await supabase
        .from('contracts')
        .insert(duplicateData)
        .select()
        .single();

      if (createError) throw createError;

      // Duplicate interested parties if they exist
      if (contract_interested_parties && contract_interested_parties.length > 0) {
        const interestedPartiesData = contract_interested_parties.map(party => {
          const { id, contract_id, created_at, updated_at, ...partyData } = party;
          return {
            ...partyData,
            contract_id: newContract.id
          };
        });

        const { error: partiesError } = await supabase
          .from('contract_interested_parties')
          .insert(interestedPartiesData);

        if (partiesError) {
          console.error('Error duplicating interested parties:', partiesError);
          // Don't throw, just log the error
        }
      }

      // Duplicate schedule works if they exist
      if (contract_schedule_works && contract_schedule_works.length > 0) {
        const scheduleWorksData = contract_schedule_works.map(work => {
          const { id, contract_id, created_at, updated_at, ...workData } = work;
          return {
            ...workData,
            contract_id: newContract.id
          };
        });

        const { error: worksError } = await supabase
          .from('contract_schedule_works')
          .insert(scheduleWorksData);

        if (worksError) {
          console.error('Error duplicating schedule works:', worksError);
          // Don't throw, just log the error
        }
      }

      await fetchContracts(); // Refresh the list
      
      toast({
        title: "Success",
        description: "Contract duplicated successfully",
      });
      
      return newContract;
    } catch (error) {
      console.error('Error duplicating contract:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate contract",
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
      
      // If the work inherits royalty splits and has a copyright_id, inherit the writers
      if (workData.inherits_royalty_splits && workData.copyright_id) {
        await inheritWritersFromCopyright(contractId, workData.copyright_id);
      }
      
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

  // Helper function to inherit writers from copyright to contract interested parties
  const inheritWritersFromCopyright = async (contractId: string, copyrightId: string) => {
    try {
      console.log('Starting writer inheritance process...', { contractId, copyrightId });
      
      // Get writers from the copyright
      const { data: copyrightWriters, error: writersError } = await supabase
        .from('copyright_writers')
        .select('*')
        .eq('copyright_id', copyrightId);

      if (writersError) {
        console.error('Error fetching copyright writers:', writersError);
        throw writersError;
      }
      
      console.log('Found copyright writers:', copyrightWriters?.length || 0, copyrightWriters);
      
      if (!copyrightWriters || copyrightWriters.length === 0) {
        console.log('No writers found for copyright:', copyrightId);
        return;
      }

      // Check existing interested parties to avoid duplicates
      const { data: existingParties, error: existingError } = await supabase
        .from('contract_interested_parties')
        .select('name, ipi_number')
        .eq('contract_id', contractId);

      if (existingError) {
        console.error('Error fetching existing parties:', existingError);
        throw existingError;
      }

      console.log('Existing parties in contract:', existingParties?.length || 0, existingParties);

      // Create interested party records for each writer
      const newParties = [];
      for (const writer of copyrightWriters) {
        // Check if this writer already exists in the contract
        const exists = existingParties?.some(party => 
          party.name === writer.writer_name || 
          (party.ipi_number && writer.ipi_number && party.ipi_number === writer.ipi_number)
        );
        
        console.log(`Checking writer "${writer.writer_name}":`, { exists, ipi: writer.ipi_number });
        
        if (!exists) {
          const newParty = {
            contract_id: contractId,
            name: writer.writer_name,
            party_type: 'writer',
            ipi_number: writer.ipi_number,
            controlled_status: writer.controlled_status || 'NC',
            performance_percentage: writer.performance_share || writer.ownership_percentage || 0,
            mechanical_percentage: writer.mechanical_share || writer.ownership_percentage || 0,
            synch_percentage: writer.synchronization_share || writer.ownership_percentage || 0,
            print_percentage: 0,
            grand_rights_percentage: 0,
            karaoke_percentage: 0,
            affiliation: writer.pro_affiliation
          };
          
          console.log('Adding new party:', newParty);
          newParties.push(newParty);
        }
      }

      if (newParties.length > 0) {
        console.log(`Inserting ${newParties.length} new parties...`);
        const { data: insertedParties, error: insertError } = await supabase
          .from('contract_interested_parties')
          .insert(newParties)
          .select();

        if (insertError) {
          console.error('Error inserting new parties:', insertError);
          throw insertError;
        }
        
        console.log(`Successfully inherited ${newParties.length} writers from copyright to contract`, insertedParties);
      } else {
        console.log('No new writers to add - all already exist in contract');
      }
    } catch (error) {
      console.error('Error inheriting writers from copyright:', error);
      // Don't throw here as we don't want to break the main flow
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
    duplicateContract,
    addInterestedParty,
    updateInterestedParty,
    removeInterestedParty,
    addScheduleWork,
    removeScheduleWork,
    validateRoyaltySplits,
    refetch: fetchContracts
  };
};