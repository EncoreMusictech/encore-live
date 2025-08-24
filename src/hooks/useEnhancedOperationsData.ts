import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EnhancedFinancialMetrics {
  mrr: number;
  arr: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  growthRate: number;
  targetRevenue: number;
  targetProfitMargin: number;
  customerAcquisitionCost: number;
  lifetimeValue: number;
  churnRate: number;
  revenuePerCustomer: number;
}

interface QuarterlyData {
  id: string;
  year: number;
  quarter: number;
  opening_balance: number;
  royalties_amount: number;
  expenses_amount: number;
  payments_amount: number;
  closing_balance: number;
}

interface PayoutData {
  id: string;
  gross_royalties: number;
  amount_due: number;
  status: string;
  created_at: string;
}

export const useEnhancedOperationsData = () => {
  const { user } = useAuth();
  const [financialMetrics, setFinancialMetrics] = useState<EnhancedFinancialMetrics>({
    mrr: 0,
    arr: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    growthRate: 0,
    targetRevenue: 324000, // $324K Year 1 target
    targetProfitMargin: 68, // 68% profit margin target
    customerAcquisitionCost: 0,
    lifetimeValue: 0,
    churnRate: 0,
    revenuePerCustomer: 0
  });
  
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([]);
  const [payoutData, setPayoutData] = useState<PayoutData[]>([]);
  const [revenueEvents, setRevenueEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuarterlyReports = async () => {
    try {
      const { data, error } = await supabase
        .from('quarterly_balance_reports')
        .select('*')
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(8); // Last 2 years

      if (error) throw error;
      setQuarterlyData(data || []);
    } catch (err: any) {
      console.error('Error fetching quarterly reports:', err);
    }
  };

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPayoutData(data || []);
    } catch (err: any) {
      console.error('Error fetching payouts:', err);
    }
  };

  const fetchRevenueEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setRevenueEvents(data || []);
    } catch (err: any) {
      console.error('Error fetching revenue events:', err);
    }
  };

  const calculateEnhancedMetrics = () => {
    if (!revenueEvents.length && !payoutData.length) return;

    // Calculate MRR from recent revenue events
    const currentMonth = new Date();
    const monthlyRevenue = revenueEvents
      .filter(event => {
        const eventDate = new Date(event.created_at);
        return eventDate.getMonth() === currentMonth.getMonth() && 
               eventDate.getFullYear() === currentMonth.getFullYear() &&
               ['signup', 'upgrade', 'payment_success'].includes(event.event_type);
      })
      .reduce((sum, event) => sum + (event.revenue_amount || 0), 0);

    // Calculate year-over-year growth
    const previousYearRevenue = revenueEvents
      .filter(event => {
        const eventDate = new Date(event.created_at);
        return eventDate.getFullYear() === currentMonth.getFullYear() - 1 &&
               ['signup', 'upgrade', 'payment_success'].includes(event.event_type);
      })
      .reduce((sum, event) => sum + (event.revenue_amount || 0), 0);

    const currentYearRevenue = revenueEvents
      .filter(event => {
        const eventDate = new Date(event.created_at);
        return eventDate.getFullYear() === currentMonth.getFullYear() &&
               ['signup', 'upgrade', 'payment_success'].includes(event.event_type);
      })
      .reduce((sum, event) => sum + (event.revenue_amount || 0), 0);

    const growthRate = previousYearRevenue > 0 
      ? ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100 
      : 0;

    // Calculate expenses from quarterly reports
    const recentQuarterlyExpenses = quarterlyData
      .filter(q => q.year === currentMonth.getFullYear())
      .reduce((sum, q) => sum + (q.expenses_amount || 0), 0);

    // Calculate expenses from payouts (operational costs)
    const payoutExpenses = payoutData
      .filter(p => {
        const payoutDate = new Date(p.created_at);
        return payoutDate.getFullYear() === currentMonth.getFullYear();
      })
      .reduce((sum, p) => sum + (p.amount_due || 0), 0);

    const totalExpenses = recentQuarterlyExpenses + payoutExpenses;
    const totalRevenue = currentYearRevenue || monthlyRevenue * 12;
    const arr = monthlyRevenue * 12;
    
    // Calculate profit metrics
    const grossProfit = totalRevenue - (totalRevenue * 0.32); // Assuming 32% direct costs for 68% margin
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate customer metrics
    const totalCustomers = new Set(revenueEvents.map(e => e.customer_user_id)).size;
    const churnEvents = revenueEvents.filter(e => e.event_type === 'churn');
    const churnRate = totalCustomers > 0 ? (churnEvents.length / totalCustomers) * 100 : 0;
    
    // Estimate CAC and LTV (simplified)
    const marketingCosts = totalExpenses * 0.3; // Assume 30% of expenses on marketing
    const newCustomers = revenueEvents.filter(e => e.event_type === 'signup').length;
    const customerAcquisitionCost = newCustomers > 0 ? marketingCosts / newCustomers : 0;
    
    const revenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const lifetimeValue = revenuePerCustomer / (churnRate / 100 || 0.05); // Prevent division by zero

    setFinancialMetrics({
      mrr: Math.round(monthlyRevenue),
      arr: Math.round(arr),
      grossProfit: Math.round(grossProfit),
      netProfit: Math.round(netProfit),
      profitMargin: Math.round(profitMargin * 100) / 100,
      growthRate: Math.round(growthRate * 100) / 100,
      targetRevenue: 324000,
      targetProfitMargin: 68,
      customerAcquisitionCost: Math.round(customerAcquisitionCost),
      lifetimeValue: Math.round(lifetimeValue),
      churnRate: Math.round(churnRate * 100) / 100,
      revenuePerCustomer: Math.round(revenuePerCustomer)
    });
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchQuarterlyReports(),
        fetchPayouts(),
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
    calculateEnhancedMetrics();
  }, [quarterlyData, payoutData, revenueEvents]);

  return {
    financialMetrics,
    quarterlyData,
    payoutData,
    revenueEvents,
    loading,
    error,
    refreshData
  };
};