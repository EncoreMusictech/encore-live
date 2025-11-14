import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  admin_email: string;
  session_id: string;
  action_type: string;
  company_id?: string;
  company_name?: string;
  resource_type?: string;
  resource_id?: string;
  action_details: any;
  ip_address?: string;
  user_agent?: string;
  request_path?: string;
  created_at: string;
  session_duration_seconds?: number;
  risk_level: string;
}

export interface AuditSummary {
  admin_user_id: string;
  admin_email: string;
  total_sessions: number;
  total_actions: number;
  companies_accessed: number;
  high_risk_actions: number;
  avg_session_duration_minutes: number;
  last_access: string;
}

export function useAdminAuditLogs(startDate?: Date, endDate?: Date) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('admin_view_mode_audit' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const end = endDate || new Date();

      const { data, error } = await supabase.rpc('get_admin_audit_summary' as any, {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
        p_admin_user_id: null
      });

      if (error) throw error;
      setSummary((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching audit summary:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, [startDate, endDate]);

  const getLogsBySession = (sessionId: string) => {
    return logs.filter(log => log.session_id === sessionId);
  };

  const getLogsByCompany = (companyId: string) => {
    return logs.filter(log => log.company_id === companyId);
  };

  const getHighRiskLogs = () => {
    return logs.filter(log => log.risk_level === 'high' || log.risk_level === 'critical');
  };

  return {
    logs,
    summary,
    loading,
    refetch: fetchLogs,
    getLogsBySession,
    getLogsByCompany,
    getHighRiskLogs,
  };
}
