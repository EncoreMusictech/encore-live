import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CustomerHealthMetrics {
  id: string;
  customer_user_id: string;
  health_score: number;
  feature_adoption_rate: number;
  login_frequency: number;
  last_activity_date: string;
  modules_used: string[];
  contracts_created: number;
  royalties_processed: number;
  support_tickets_count: number;
  subscription_status: string;
  days_since_signup: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

interface SupportTicket {
  id: string;
  customer_user_id: string;
  ticket_subject: string;
  ticket_category: string;
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_time_hours: number | null;
  first_response_time_hours: number | null;
  customer_satisfaction_score: number | null;
  created_at: string;
  resolved_at: string | null;
}

interface RevenueEvent {
  id: string;
  customer_user_id: string;
  event_type: 'signup' | 'upgrade' | 'downgrade' | 'churn' | 'reactivation' | 'payment_success' | 'payment_failed';
  revenue_amount: number;
  previous_plan: string | null;
  new_plan: string | null;
  billing_cycle: string | null;
  mrr_change: number;
  created_at: string;
}

interface OperationsMetrics {
  totalCustomers: number;
  activeCustomers: number;
  avgHealthScore: number;
  criticalRiskCustomers: number;
  openTickets: number;
  avgResolutionTime: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  customerSatisfaction: number;
}

export const useOperationsData = () => {
  const { user } = useAuth();
  const [customerHealth, setCustomerHealth] = useState<CustomerHealthMetrics[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [revenueEvents, setRevenueEvents] = useState<RevenueEvent[]>([]);
  const [metrics, setMetrics] = useState<OperationsMetrics>({
    totalCustomers: 0,
    activeCustomers: 0,
    avgHealthScore: 0,
    criticalRiskCustomers: 0,
    openTickets: 0,
    avgResolutionTime: 0,
    monthlyRecurringRevenue: 0,
    churnRate: 0,
    customerSatisfaction: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerHealth = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_health_metrics')
        .select('*')
        .order('health_score', { ascending: false });

      if (error) throw error;
      setCustomerHealth((data || []) as CustomerHealthMetrics[]);
    } catch (err: any) {
      console.error('Error fetching customer health:', err);
      setError(err.message);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupportTickets((data || []) as SupportTicket[]);
    } catch (err: any) {
      console.error('Error fetching support tickets:', err);
      setError(err.message);
    }
  };

  const fetchRevenueEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRevenueEvents((data || []) as RevenueEvent[]);
    } catch (err: any) {
      console.error('Error fetching revenue events:', err);
      setError(err.message);
    }
  };

  const calculateMetrics = () => {
    if (!customerHealth.length) return;

    const totalCustomers = customerHealth.length;
    const activeCustomers = customerHealth.filter(c => 
      c.last_activity_date && 
      new Date(c.last_activity_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    const avgHealthScore = customerHealth.reduce((sum, c) => sum + c.health_score, 0) / totalCustomers;
    const criticalRiskCustomers = customerHealth.filter(c => c.risk_level === 'critical' || c.risk_level === 'high').length;
    
    const openTickets = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    
    const resolvedTickets = supportTickets.filter(t => t.resolution_time_hours !== null);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, t) => sum + (t.resolution_time_hours || 0), 0) / resolvedTickets.length 
      : 0;

    const thisMonthRevenue = revenueEvents
      .filter(e => {
        const eventDate = new Date(e.created_at);
        const now = new Date();
        return eventDate.getMonth() === now.getMonth() && 
               eventDate.getFullYear() === now.getFullYear() &&
               (e.event_type === 'signup' || e.event_type === 'upgrade' || e.event_type === 'payment_success');
      })
      .reduce((sum, e) => sum + e.revenue_amount, 0);

    const churnEvents = revenueEvents.filter(e => e.event_type === 'churn');
    const churnRate = totalCustomers > 0 ? (churnEvents.length / totalCustomers) * 100 : 0;

    const satisfactionScores = supportTickets
      .filter(t => t.customer_satisfaction_score !== null)
      .map(t => t.customer_satisfaction_score!);
    
    const customerSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    setMetrics({
      totalCustomers,
      activeCustomers,
      avgHealthScore: Math.round(avgHealthScore * 100) / 100,
      criticalRiskCustomers,
      openTickets,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      monthlyRecurringRevenue: Math.round(thisMonthRevenue),
      churnRate: Math.round(churnRate * 100) / 100,
      customerSatisfaction: Math.round(customerSatisfaction * 100) / 100
    });
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchCustomerHealth(),
        fetchSupportTickets(), 
        fetchRevenueEvents()
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  useEffect(() => {
    calculateMetrics();
  }, [customerHealth, supportTickets, revenueEvents]);

  const createSupportTicket = async (ticketData: any) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_analytics')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;
      await fetchSupportTickets();
      return data;
    } catch (err: any) {
      console.error('Error creating support ticket:', err);
      throw err;
    }
  };

  const updateCustomerHealth = async (customerId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('customer_health_metrics')
        .update(updates)
        .eq('id', customerId);

      if (error) throw error;
      await fetchCustomerHealth();
    } catch (err: any) {
      console.error('Error updating customer health:', err);
      throw err;
    }
  };

  return {
    customerHealth,
    supportTickets,
    revenueEvents,
    metrics,
    loading,
    error,
    refreshData,
    createSupportTicket,
    updateCustomerHealth
  };
};