import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WriterContract {
  id: string;
  title: string;
  contract_type: string;
  contract_status: string;
  recipient_name: string;
  start_date?: string;
  end_date?: string;
  controlled_percentage?: number;
}

export const useWriterContracts = (writerName: string) => {
  const [contracts, setContracts] = useState<WriterContract[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWriterContracts = async () => {
      if (!writerName || writerName.trim().length === 0) {
        setContracts([]);
        return;
      }

      setLoading(true);
      try {
        // Search for contracts that have interested parties matching the writer name
        const { data: interestedParties, error: partiesError } = await supabase
          .from('contract_interested_parties')
          .select(`
            contract_id,
            name,
            contracts (
              id,
              title,
              contract_type,
              contract_status,
              start_date,
              end_date,
              controlled_percentage
            )
          `)
          .ilike('name', `%${writerName}%`)
          .eq('party_type', 'writer');

        if (partiesError) {
          console.error('Error fetching writer contracts:', partiesError);
        }

        // Also search for contracts with royalty connections (for backward compatibility)
        const { data: royaltyConnections, error: royaltyError } = await supabase
          .from('contract_royalty_connections')
          .select(`
            contract_id,
            recipient_name,
            contracts (
              id,
              title,
              contract_type,
              contract_status,
              start_date,
              end_date,
              controlled_percentage
            )
          `)
          .ilike('recipient_name', `%${writerName}%`);

        if (royaltyError) {
          console.error('Error fetching writer royalty connections:', royaltyError);
        }

        // Combine and deduplicate results
        const allConnections = [
          ...(interestedParties || []).map(item => ({
            contract_id: item.contract_id,
            recipient_name: item.name,
            contracts: item.contracts
          })),
          ...(royaltyConnections || [])
        ];

        // Remove duplicates based on contract ID
        const uniqueConnections = allConnections.filter((connection, index, self) =>
          index === self.findIndex(c => c.contract_id === connection.contract_id)
        );

        // Transform the data to match our interface
        const writerContracts: WriterContract[] = uniqueConnections
          .filter(connection => connection.contracts)
          .map(connection => ({
            id: connection.contracts.id,
            title: connection.contracts.title,
            contract_type: connection.contracts.contract_type,
            contract_status: connection.contracts.contract_status,
            recipient_name: connection.recipient_name,
            start_date: connection.contracts.start_date,
            end_date: connection.contracts.end_date,
            controlled_percentage: connection.contracts.controlled_percentage
          }));

        setContracts(writerContracts);
      } catch (error) {
        console.error('Error fetching writer contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchWriterContracts, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [writerName]);

  const getActiveContracts = () => {
    return contracts.filter(contract => 
      contract.contract_status === 'active' || contract.contract_status === 'signed'
    );
  };

  const getContractsByStatus = (status: string) => {
    return contracts.filter(contract => contract.contract_status === status);
  };

  return { 
    contracts, 
    loading,
    activeContracts: getActiveContracts(),
    getContractsByStatus
  };
};