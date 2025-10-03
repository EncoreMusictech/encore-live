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
      // Get controlled writers from copyright_writers table
      const { data, error } = await supabase
        .from('copyright_writers')
        .select(`
          writer_name,
          copyright_id,
          copyrights!inner(user_id)
        `)
        .eq('copyrights.user_id', user.id)
        .eq('controlled_status', 'C');

      if (error) throw error;

      // Transform the data to get unique writers
      const uniqueWriters = new Map();
      data?.forEach((item: any) => {
        if (item.writer_name) {
          uniqueWriters.set(item.writer_name, {
            id: item.copyright_id,
            name: item.writer_name,
            contact_id: item.copyright_id // Using copyright_id as unique identifier
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