import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WriterContract {
  id: string;
  title: string;
  contract_type: string;
  contract_status: string;
  recipient_name: string;
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
        // Search for contracts that have royalty connections matching the writer name
        const { data: royaltyConnections, error: royaltyError } = await supabase
          .from('contract_royalty_connections')
          .select(`
            contract_id,
            recipient_name,
            contracts (
              id,
              title,
              contract_type,
              contract_status
            )
          `)
          .ilike('recipient_name', `%${writerName}%`);

        if (royaltyError) {
          console.error('Error fetching writer contracts:', royaltyError);
          return;
        }

        // Transform the data to match our interface
        const writerContracts: WriterContract[] = royaltyConnections
          ?.filter(connection => connection.contracts)
          .map(connection => ({
            id: connection.contracts.id,
            title: connection.contracts.title,
            contract_type: connection.contracts.contract_type,
            contract_status: connection.contracts.contract_status,
            recipient_name: connection.recipient_name
          })) || [];

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

  return { contracts, loading };
};