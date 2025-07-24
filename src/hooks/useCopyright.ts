import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useActivityLog } from '@/hooks/useActivityLog';

export type Copyright = Tables<'copyrights'>;
export type CopyrightWriter = Tables<'copyright_writers'>;
export type CopyrightPublisher = Tables<'copyright_publishers'>;
export type CopyrightRecording = Tables<'copyright_recordings'>;
export type CopyrightInsert = TablesInsert<'copyrights'>;

export const useCopyright = () => {
  const [copyrights, setCopyrights] = useState<Copyright[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  const fetchCopyrights = async () => {
    try {
      const { data, error } = await supabase
        .from('copyrights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCopyrights(data || []);
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
  };

  const createCopyright = async (copyrightData: CopyrightInsert) => {
    try {
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
      
      setCopyrights(prev => [data, ...prev]);
      
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
      toast({
        title: "Error",
        description: "Failed to create copyright work",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCopyright = async (id: string, updates: Partial<CopyrightInsert>) => {
    try {
      const { data, error } = await supabase
        .from('copyrights')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const oldCopyright = copyrights.find(c => c.id === id);
      
      // Update the local state immediately
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

  useEffect(() => {
    fetchCopyrights();
  }, []);

  return {
    copyrights,
    loading,
    createCopyright,
    updateCopyright,
    deleteCopyright,
    getWritersForCopyright,
    getPublishersForCopyright,
    getRecordingsForCopyright,
    refetch: fetchCopyrights
  };
};