import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ControlledWriter {
  id: string;
  name: string;
  contact_id: string;
}

export function useControlledWriters() {
  const [writers, setWriters] = useState<ControlledWriter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchControlledWriters = async () => {
    if (!user) return;
    
    try {
      // Get controlled writers from copyright_writers who are linked to royalty allocations
      const { data, error } = await supabase
        .from('royalty_writers')
        .select(`
          id,
          contact_id,
          contacts!inner(name),
          royalty_allocations!inner(
            controlled_status,
            user_id
          )
        `)
        .eq('royalty_allocations.user_id', user.id)
        .eq('royalty_allocations.controlled_status', 'Controlled');

      if (error) throw error;

      // Transform the data to get unique writers
      const uniqueWriters = new Map();
      data?.forEach((item: any) => {
        if (item.contacts?.name) {
          uniqueWriters.set(item.contact_id, {
            id: item.id,
            name: item.contacts.name,
            contact_id: item.contact_id
          });
        }
      });

      setWriters(Array.from(uniqueWriters.values()));
    } catch (error: any) {
      console.error('Error fetching controlled writers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControlledWriters();
  }, [user]);

  return {
    writers,
    loading,
    refreshWriters: fetchControlledWriters,
  };
}