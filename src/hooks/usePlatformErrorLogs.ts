import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformErrorLog {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  company_id: string | null;
  company_name: string | null;
  error_source: string;
  error_type: string;
  error_message: string;
  error_details: Record<string, any> | null;
  module: string | null;
  action: string | null;
  severity: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

export function usePlatformErrorLogs() {
  const [logs, setLogs] = useState<PlatformErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: 'all',
    resolved: 'all',
    source: 'all',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('platform_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }
      if (filters.resolved === 'resolved') {
        query = query.eq('resolved', true);
      } else if (filters.resolved === 'unresolved') {
        query = query.eq('resolved', false);
      }
      if (filters.source !== 'all') {
        query = query.eq('error_source', filters.source);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as PlatformErrorLog[]) ?? []);
    } catch (err) {
      console.error('Failed to fetch error logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const markResolved = async (logId: string, notes: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('platform_error_logs')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id ?? null,
        resolution_notes: notes,
      })
      .eq('id', logId);
    fetchLogs();
  };

  return { logs, loading, filters, setFilters, fetchLogs, markResolved };
}
