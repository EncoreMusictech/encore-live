import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataFiltering } from './useDataFiltering';

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  copyright_id?: string | null;
  action_type: string;
  operation_details?: Record<string, any>;
  affected_fields?: string[];
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  batch_id?: string | null;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface LogActivityParams {
  copyright_id?: string;
  action_type: 'create' | 'update' | 'delete' | 'bulk_upload';
  operation_details?: Record<string, any>;
  affected_fields?: string[];
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  batch_id?: string;
}

export const useActivityLog = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { applyUserIdFilter } = useDataFiltering();

  const logActivity = async (params: LogActivityParams): Promise<string | null> => {
    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('No authenticated user');
      }

      // Get client info
      const userAgent = navigator.userAgent;
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      const { data, error } = await supabase.rpc('log_copyright_activity', {
        p_user_id: user.data.user.id,
        p_copyright_id: params.copyright_id || null,
        p_action_type: params.action_type,
        p_operation_details: params.operation_details || {},
        p_affected_fields: params.affected_fields || [],
        p_old_values: params.old_values || null,
        p_new_values: params.new_values || null,
        p_batch_id: params.batch_id || null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        console.error('Error logging activity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getActivityLogs = async (copyrightId?: string): Promise<ActivityLogEntry[]> => {
    try {
      setLoading(true);

      let query = supabase
        .from('copyright_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (copyrightId) {
        query = query.eq('copyright_id', copyrightId);
      }
      
      query = applyUserIdFilter(query);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      return (data || []) as ActivityLogEntry[];
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getBatchLogs = async (batchId: string): Promise<ActivityLogEntry[]> => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('copyright_activity_logs')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching batch logs:', error);
        throw error;
      }

      return (data || []) as ActivityLogEntry[];
    } catch (error) {
      console.error('Error fetching batch logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch batch logs",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getUserActivityStats = async (): Promise<{
    total_activities: number;
    creates: number;
    updates: number;
    deletes: number;
    bulk_uploads: number;
    last_activity?: string;
  }> => {
    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('copyright_activity_logs')
        .select('action_type, created_at')
        .eq('user_id', user.data.user.id);

      if (error) {
        console.error('Error fetching activity stats:', error);
        throw error;
      }

      const logs = data || [];
      const stats = {
        total_activities: logs.length,
        creates: logs.filter(log => log.action_type === 'create').length,
        updates: logs.filter(log => log.action_type === 'update').length,
        deletes: logs.filter(log => log.action_type === 'delete').length,
        bulk_uploads: logs.filter(log => log.action_type === 'bulk_upload').length,
        last_activity: logs.length > 0 ? logs[0].created_at : undefined
      };

      return stats;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return {
        total_activities: 0,
        creates: 0,
        updates: 0,
        deletes: 0,
        bulk_uploads: 0
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    logActivity,
    getActivityLogs,
    getBatchLogs,
    getUserActivityStats,
    loading
  };
};