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
      
      // Generate mock system alerts for demo
      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          alert_name: 'High Memory Usage',
          alert_type: 'system_performance',
          alert_message: 'System memory usage has exceeded 85% threshold',
          severity: 'high',
          status: 'active',
          trigger_data: { memory_usage: 87, threshold: 85 },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          alert_name: 'Multiple Failed Login Attempts',
          alert_type: 'security',
          alert_message: 'Detected 5+ failed login attempts from IP: 192.168.1.100',
          severity: 'critical',
          status: 'active',
          trigger_data: { ip_address: '192.168.1.100', attempts: 7 },
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          alert_name: 'Database Connection Timeout',
          alert_type: 'database',
          alert_message: 'Database connection pool timeout detected',
          severity: 'medium',
          status: 'acknowledged',
          trigger_data: { pool_size: 20, active_connections: 18 },
          acknowledged_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          alert_name: 'API Rate Limit Reached',
          alert_type: 'api',
          alert_message: 'Spotify API rate limit reached - requests being throttled',
          severity: 'medium',
          status: 'resolved',
          trigger_data: { api_name: 'spotify', rate_limit: 1000 },
          acknowledged_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          alert_name: 'Disk Space Low',
          alert_type: 'system_storage',
          alert_message: 'Available disk space is below 10GB on primary storage',
          severity: 'low',
          status: 'active',
          trigger_data: { available_space_gb: 8.5, threshold_gb: 10 },
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setAlerts(mockAlerts);
      setError(null);
    } catch (err) {
      console.error('Error fetching system alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // In a real implementation, this would update the database
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
      // In a real implementation, this would update the database
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

  useEffect(() => {
    fetchAlerts();
  }, []);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    acknowledgeAlert,
    resolveAlert
  };
}