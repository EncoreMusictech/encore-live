
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useOptimisticUpdates } from '@/hooks/useOptimisticUpdates';

export type Copyright = Tables<'copyrights'>;
export type CopyrightWriter = Tables<'copyright_writers'>;
export type CopyrightPublisher = Tables<'copyright_publishers'>;
export type CopyrightRecording = Tables<'copyright_recordings'>;
export type CopyrightInsert = TablesInsert<'copyrights'>;

// Extended type for copyright with joined writers
export type CopyrightWithWriters = Copyright & {
  copyright_writers?: CopyrightWriter[];
};

export const useCopyright = () => {
  const [copyrights, setCopyrights] = useState<CopyrightWithWriters[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { 
    data: optimisticCopyrights, 
    setData: setOptimisticData,
    addOptimisticUpdate, 
    confirmUpdate, 
    revertUpdate,
    clearAllPending 
  } = useOptimisticUpdates<CopyrightWithWriters>([]);

  // Sync optimistic data with server data whenever copyrights change
  useEffect(() => {
    setOptimisticData(copyrights);
  }, [copyrights, setOptimisticData]);

  const fetchCopyrights = useCallback(async () => {
    try {
      console.log('Fetching copyrights...');
      const { data, error } = await supabase
        .from('copyrights')
        .select(`
          *,
          copyright_writers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Copyrights fetched successfully:', data?.length || 0, 'records');
      setCopyrights(data || []);
      clearAllPending(); // Clear any pending optimistic updates since we have fresh data
    } catch (error) {
      console.error('Error fetching copyrights:', error);
      toast({
        title: "Error",
        description: "Failed to fetch copyrights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, clearAllPending]);

  const createCopyright = async (copyrightData: CopyrightInsert) => {
    const tempCopyright: CopyrightWithWriters = {
      id: `temp-${Date.now()}`,
      user_id: 'temp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...copyrightData
    } as CopyrightWithWriters;

    // Add optimistic update
    const updateId = addOptimisticUpdate('create', tempCopyright);

    try {
      console.log('Creating copyright with data:', copyrightData);
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('copyrights')
        .insert({
          user_id: user.data.user.id,
          ...copyrightData
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('Copyright created successfully:', data);
      
      // Confirm optimistic update
      confirmUpdate(updateId);
      setCopyrights(prev => [data, ...prev.filter(c => c.id !== tempCopyright.id)]);
      
      // Log the create activity
      await logActivity({
        copyright_id: data.id,
        action_type: 'create',
        operation_details: {
          work_title: data.work_title,
          work_type: data.work_type,
          language: data.language_code
        },
        new_values: data
      });
      
      toast({
        title: "Success",
        description: "Copyright work created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating copyright:', error);
      // Revert optimistic update
      revertUpdate(updateId);
      toast({
        title: "Error",
        description: "Failed to create copyright work",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCopyright = async (id: string, updates: Partial<CopyrightInsert>) => {
    const oldCopyright = copyrights.find(c => c.id === id);
    if (!oldCopyright) {
      throw new Error('Copyright not found for update');
    }

    // Create optimistic update
    const optimisticCopyright = { ...oldCopyright, ...updates, updated_at: new Date().toISOString() };
    const updateId = addOptimisticUpdate('update', optimisticCopyright, oldCopyright);

    try {
      console.log('Updating copyright:', id, 'with updates:', updates);
      
      const { data, error } = await supabase
        .from('copyrights')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('Copyright updated successfully:', data);
      console.log('PRO Status fields in updated data:', {
        ascap_status: data.ascap_status,
        bmi_status: data.bmi_status,
        socan_status: data.socan_status,
        sesac_status: data.sesac_status,
        mlc_status: data.mlc_status
      });
      
      // Confirm optimistic update and update local state with server data
      confirmUpdate(updateId);
      setCopyrights(prev => prev.map(c => c.id === id ? data : c));
      
      // Log the update activity
      await logActivity({
        copyright_id: id,
        action_type: 'update',
        operation_details: {
          work_title: data.work_title,
          updated_fields: Object.keys(updates)
        },
        affected_fields: Object.keys(updates),
        old_values: oldCopyright,
        new_values: data
      });
      
      toast({
        title: "Success",
        description: "Copyright work updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating copyright:', error);
      // Revert optimistic update
      revertUpdate(updateId);
      toast({
        title: "Error",
        description: "Failed to update copyright work",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCopyright = async (id: string) => {
    try {
      const copyrightToDelete = copyrights.find(c => c.id === id);
      
      const { error } = await supabase
        .from('copyrights')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Log the delete activity
      await logActivity({
        copyright_id: id,
        action_type: 'delete',
        operation_details: {
          work_title: copyrightToDelete?.work_title,
          deleted_at: new Date().toISOString()
        },
        old_values: copyrightToDelete
      });
      
      setCopyrights(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Copyright work deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting copyright:', error);
      toast({
        title: "Error",
        description: "Failed to delete copyright work",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getWritersForCopyright = async (copyrightId: string): Promise<CopyrightWriter[]> => {
    try {
      const { data, error } = await supabase
        .from('copyright_writers')
        .select('*')
        .eq('copyright_id', copyrightId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching writers:', error);
      return [];
    }
  };

  const getPublishersForCopyright = async (copyrightId: string): Promise<CopyrightPublisher[]> => {
    try {
      const { data, error } = await supabase
        .from('copyright_publishers')
        .select('*')
        .eq('copyright_id', copyrightId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching publishers:', error);
      return [];
    }
  };

  const getRecordingsForCopyright = async (copyrightId: string): Promise<CopyrightRecording[]> => {
    try {
      const { data, error } = await supabase
        .from('copyright_recordings')
        .select('*')
        .eq('copyright_id', copyrightId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }
  };

  // Set up real-time subscriptions - run only once on mount
  useEffect(() => {
    fetchCopyrights();

    console.log('Setting up real-time copyright subscriptions...');
    
    // Subscribe to copyright changes
    const copyrightChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'copyrights'
        },
        (payload) => {
          console.log('Real-time copyright change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setCopyrights(prev => {
                // Avoid duplicates
                const exists = prev.some(c => c.id === payload.new.id);
                if (!exists) {
                  console.log('Adding new copyright from real-time:', payload.new);
                  return [payload.new as CopyrightWithWriters, ...prev];
                }
                return prev;
              });
              break;
              
            case 'UPDATE':
              setCopyrights(prev => {
                const updated = prev.map(c => 
                  c.id === payload.new.id ? payload.new as CopyrightWithWriters : c
                );
                console.log('Updated copyright from real-time:', payload.new);
                console.log('PRO Status in real-time update:', {
                  ascap_status: payload.new.ascap_status,
                  bmi_status: payload.new.bmi_status,
                  socan_status: payload.new.socan_status,
                  sesac_status: payload.new.sesac_status,
                  mlc_status: payload.new.mlc_status
                });
                return updated;
              });
              break;
              
            case 'DELETE':
              setCopyrights(prev => prev.filter(c => c.id !== payload.old.id));
              console.log('Deleted copyright from real-time:', payload.old.id);
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time copyright subscription active');
          setRealtimeError(null);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
          setRealtimeError('Real-time updates unavailable');
        }
      });

    return () => {
      console.log('Cleaning up real-time copyright subscriptions...');
      supabase.removeChannel(copyrightChannel);
    };
  }, []); // Remove fetchCopyrights dependency to prevent recreation of subscriptions

  return {
    copyrights: optimisticCopyrights, // Return optimistic data instead of raw data
    loading,
    realtimeError,
    createCopyright,
    updateCopyright,
    deleteCopyright,
    getWritersForCopyright,
    getPublishersForCopyright,
    getRecordingsForCopyright,
    refetch: fetchCopyrights,
    clearPendingUpdates: clearAllPending
  };
};
