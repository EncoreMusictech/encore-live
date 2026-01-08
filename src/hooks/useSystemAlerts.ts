import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemAlert {
  id: string;
  alert_name: string;
  alert_type: string;
  alert_message: string;
  severity: string;
  status: string;
  trigger_data?: any;
  assigned_to?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching system alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('system_alerts')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (updateError) throw updateError;

      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'acknowledged',
              acknowledged_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : alert
      ));
      
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged successfully",
      });
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive"
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('system_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (updateError) throw updateError;

      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : alert
      ));
      
      toast({
        title: "Alert Resolved",
        description: "The alert has been resolved successfully",
      });
    } catch (err) {
      console.error('Error resolving alert:', err);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      });
    }
  };

  const createAlert = async (alert: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('system_alerts')
        .insert({
          alert_name: alert.alert_name,
          alert_type: alert.alert_type,
          alert_message: alert.alert_message,
          severity: alert.severity,
          status: alert.status || 'active',
          trigger_data: alert.trigger_data,
          assigned_to: alert.assigned_to,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAlerts(prev => [data, ...prev]);
      
      toast({
        title: "Alert Created",
        description: "New system alert has been created",
      });

      return data;
    } catch (err) {
      console.error('Error creating alert:', err);
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Set up real-time subscription
    const channel = supabase
      .channel('system_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_alerts'
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
    createAlert
  };
}
