import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContractLinkData {
  contractId: string;
  copyrightId: string;
  workTitle: string;
  inheritWriters: boolean;
}

export const useContractLinking = () => {
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  const linkContractToCopyright = async (data: ContractLinkData) => {
    setIsLinking(true);
    try {
      // First, add the work to the contract's schedule of works
      const { error: scheduleError } = await supabase
        .from('contract_schedule_works')
        .insert({
          contract_id: data.contractId,
          copyright_id: data.copyrightId,
          song_title: data.workTitle,
          inherits_controlled_status: data.inheritWriters,
          inherits_recoupment_status: data.inheritWriters,
          inherits_royalty_splits: data.inheritWriters
        });

      if (scheduleError) throw scheduleError;

      // If inheriting writers, add controlled writers as interested parties
      if (data.inheritWriters) {
        await inheritWritersFromCopyright(data.contractId, data.copyrightId);
      }

      toast({
        title: "Contract Linked Successfully",
        description: `Copyright work has been added to the contract's schedule of works.`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error linking contract:', error);
      toast({
        title: "Error Linking Contract",
        description: "Failed to link the contract. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLinking(false);
    }
  };

  const inheritWritersFromCopyright = async (contractId: string, copyrightId: string) => {
    try {
      // Get controlled writers from the copyright
      const { data: controlledWriters, error: writersError } = await supabase
        .from('copyright_writers')
        .select('*')
        .eq('copyright_id', copyrightId)
        .eq('controlled_status', 'C');

      if (writersError) throw writersError;

      if (controlledWriters && controlledWriters.length > 0) {
        // Add each controlled writer as an interested party to the contract
        const interestedParties = controlledWriters.map(writer => ({
          contract_id: contractId,
          name: writer.writer_name,
          party_type: 'writer',
          controlled_status: 'C',
          performance_percentage: writer.performance_share || 0,
          mechanical_percentage: writer.mechanical_share || 0,
          synch_percentage: writer.synchronization_share || 0,
          ipi_number: writer.ipi_number,
          cae_number: writer.cae_number,
          affiliation: writer.pro_affiliation
        }));

        const { error: partiesError } = await supabase
          .from('contract_interested_parties')
          .insert(interestedParties);

        if (partiesError) throw partiesError;
      }
    } catch (error) {
      console.error('Error inheriting writers:', error);
      throw error;
    }
  };

  const unlinkContractFromCopyright = async (contractId: string, copyrightId: string) => {
    setIsLinking(true);
    try {
      // Remove the work from the contract's schedule of works
      const { error } = await supabase
        .from('contract_schedule_works')
        .delete()
        .eq('contract_id', contractId)
        .eq('copyright_id', copyrightId);

      if (error) throw error;

      toast({
        title: "Contract Unlinked",
        description: "The copyright work has been removed from the contract.",
      });

      return { success: true };
    } catch (error) {
      console.error('Error unlinking contract:', error);
      toast({
        title: "Error Unlinking Contract",
        description: "Failed to unlink the contract. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLinking(false);
    }
  };

  const getLinkedContracts = async (copyrightId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_schedule_works')
        .select(`
          contract_id,
          contracts (
            id,
            title,
            contract_type,
            contract_status,
            start_date,
            end_date,
            controlled_percentage,
            territories
          )
        `)
        .eq('copyright_id', copyrightId);

      if (error) throw error;

      return data?.map(item => ({
        id: item.contracts.id,
        title: item.contracts.title,
        contract_type: item.contracts.contract_type,
        contract_status: item.contracts.contract_status,
        start_date: item.contracts.start_date,
        end_date: item.contracts.end_date,
        controlled_percentage: item.contracts.controlled_percentage,
        territories: item.contracts.territories || []
      })) || [];
    } catch (error) {
      console.error('Error getting linked contracts:', error);
      return [];
    }
  };

  return {
    linkContractToCopyright,
    unlinkContractFromCopyright,
    getLinkedContracts,
    isLinking
  };
};