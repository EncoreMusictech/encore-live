import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useAsyncOperation } from './useAsyncOperation';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import { useRetryLogic } from './useRetryLogic';

export interface Payout {
  id: string;
  user_id: string;
  client_id: string;
  period: string;
  period_start?: string;
  period_end?: string;
  gross_royalties: number;
  total_expenses: number;
  net_payable: number;
  royalties_to_date: number;
  payments_to_date: number;
  amount_due: number;
  payment_date?: string;
  payment_method?: 'ACH' | 'Wire' | 'PayPal' | 'Check';
  payment_reference?: string;
  notes?: string;
  statement_notes?: string;
  statement_pdf_url?: string;
  status: string;
  approval_status?: string;
  approved_by_user_id?: string;
  approved_at?: string;
  admin_fee_percentage?: number;
  admin_fee_amount?: number;
  processing_fee_amount?: number;
  // New workflow fields
  workflow_stage?: string;
  payment_processor?: string;
  payment_processor_reference?: string;
  payment_initiated_at?: string;
  payment_completed_at?: string;
  payment_failed_at?: string;
  failure_reason?: string;
  auto_payment_enabled?: boolean;
  priority_level?: number;
  quarterly_report_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PayoutExpense {
  id: string;
  user_id: string;
  payout_id?: string;
  expense_type: string;
  description: string;
  amount: number;
  is_percentage: boolean;
  percentage_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ClientAccountBalance {
  id: string;
  user_id: string;
  client_id: string;
  current_balance: number;
  total_earned: number;
  total_paid: number;
  last_statement_date?: string;
  next_statement_due?: string;
  created_at: string;
  updated_at: string;
}

export interface PayoutRoyalty {
  id: string;
  payout_id: string;
  royalty_id: string;
  allocated_amount: number;
  created_at: string;
}

export function usePayouts() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use optimistic updates for better UX
  const {
    data: payouts,
    setData: setPayouts,
    addOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    hasPendingUpdates
  } = useOptimisticUpdates<Payout>([]);

  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Async operation handler for better error management
  const { execute: executeAsync } = useAsyncOperation({
    showToast: false, // We'll handle toasts manually for better UX
  });

  // Retry logic for failed operations
  const { executeWithRetry } = useRetryLogic(
    async () => fetchPayouts(),
    {
      maxRetries: 3,
      shouldRetry: (error) => !error.message.includes('auth'),
    }
  );

  // Optimized fetch with caching and error handling
  const fetchPayouts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Avoid excessive refetching
    const now = Date.now();
    if (now - lastFetchTime < 30000 && payouts.length > 0) { // 30 second cache
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          contacts(name, email),
          payout_royalties(
            id,
            allocated_amount,
            royalty_allocations(work_id, song_title, gross_royalty_amount)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPayouts(data || []);
      setLastFetchTime(now);
      
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      
      // More specific error handling
      if (error.code === 'PGRST301') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view payouts",
          variant: "destructive",
        });
      } else if (error.message?.includes('network')) {
        toast({
          title: "Network Error",
          description: "Check your connection and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payouts",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, lastFetchTime, payouts.length, toast]);

  // Enhanced create with optimistic updates
  const createPayout = useCallback(async (payoutData: any) => {
    if (!user) return null;

    // Create optimistic payout
    const optimisticPayout: Payout = {
      id: `temp_${Date.now()}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...payoutData,
    };

    const updateId = addOptimisticUpdate('create', optimisticPayout);

    try {
      const { expenses, ...payout } = payoutData;
      
      const { data, error } = await supabase
        .from('payouts')
        .insert({
          ...payout,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create expense records if any
      if (expenses && expenses.length > 0) {
        const expenseRecords = expenses.map((expense: any) => ({
          ...expense,
          user_id: user.id,
          payout_id: data.id,
        }));

        const { error: expenseError } = await supabase
          .from('payout_expenses')
          .insert(expenseRecords);

        if (expenseError) {
          console.error('Error creating expenses:', expenseError);
          // Continue anyway, don't fail the payout creation
        }
      }

      // Confirm optimistic update and update with real data
      confirmUpdate(updateId);
      await fetchPayouts();

      toast({
        title: "Success",
        description: "Payout created successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating payout:', error);
      
      // Revert optimistic update
      revertUpdate(updateId);
      
      toast({
        title: "Error",
        description: error.message || "Failed to create payout",
        variant: "destructive",
      });
      return null;
    }
  }, [user, addOptimisticUpdate, confirmUpdate, revertUpdate, fetchPayouts, toast]);

  // Enhanced update with optimistic updates
  const updatePayout = useCallback(async (id: string, payoutData: Partial<Payout>) => {
    const existingPayout = payouts.find(p => p.id === id);
    if (!existingPayout) return null;

    const optimisticPayout = { ...existingPayout, ...payoutData, updated_at: new Date().toISOString() };
    const updateId = addOptimisticUpdate('update', optimisticPayout, existingPayout);

    try {
      const { data, error } = await supabase
        .from('payouts')
        .update(payoutData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      confirmUpdate(updateId);
      await fetchPayouts();

      toast({
        title: "Success",
        description: "Payout updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating payout:', error);
      revertUpdate(updateId);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update payout",
        variant: "destructive",
      });
      return null;
    }
  }, [payouts, addOptimisticUpdate, confirmUpdate, revertUpdate, fetchPayouts, toast]);

  // Enhanced delete with optimistic updates
  const deletePayout = useCallback(async (id: string) => {
    const existingPayout = payouts.find(p => p.id === id);
    if (!existingPayout) return;

    const updateId = addOptimisticUpdate('delete', existingPayout);

    try {
      const { error } = await supabase
        .from('payouts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      confirmUpdate(updateId);

      toast({
        title: "Success",
        description: "Payout deleted successfully",
      });

    } catch (error: any) {
      console.error('Error deleting payout:', error);
      revertUpdate(updateId);
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete payout",
        variant: "destructive",
      });
    }
  }, [payouts, addOptimisticUpdate, confirmUpdate, revertUpdate, toast]);

  const addRoyaltyToPayout = async (payoutId: string, royaltyData: Omit<PayoutRoyalty, 'id' | 'payout_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('payout_royalties')
        .insert({
          ...royaltyData,
          payout_id: payoutId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Royalty added to payout",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding royalty to payout:', error);
      toast({
        title: "Error",
        description: "Failed to add royalty to payout",
        variant: "destructive",
      });
      return null;
    }
  };

  const removeRoyaltyFromPayout = async (payoutRoyaltyId: string) => {
    try {
      const { error } = await supabase
        .from('payout_royalties')
        .delete()
        .eq('id', payoutRoyaltyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Royalty removed from payout",
      });
    } catch (error: any) {
      console.error('Error removing royalty from payout:', error);
      toast({
        title: "Error",
        description: "Failed to remove royalty from payout",
        variant: "destructive",
      });
    }
  };

  const calculatePayoutTotals = async (clientId: string, periodStart: string, periodEnd: string) => {
    try {
      // Calculate gross royalties from royalty allocations for the client and period
      const { data: royalties, error: royaltyError } = await supabase
        .from('royalty_allocations')
        .select('gross_royalty_amount, net_amount')
        .eq('user_id', user?.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      if (royaltyError) throw royaltyError;

      const grossRoyalties = royalties?.reduce((sum, r) => sum + (r.gross_royalty_amount || 0), 0) || 0;
      
      // Calculate previous payments to this client
      const { data: previousPayouts, error: payoutError } = await supabase
        .from('payouts')
        .select('amount_due, gross_royalties')
        .eq('user_id', user?.id)
        .eq('client_id', clientId)
        .eq('status', 'paid');

      if (payoutError) throw payoutError;

      const paymentsToDate = previousPayouts?.reduce((sum, p) => sum + (p.amount_due || 0), 0) || 0;
      const royaltiesToDate = previousPayouts?.reduce((sum, p) => sum + (p.gross_royalties || 0), 0) || 0;

      const totals = {
        gross_royalties: grossRoyalties,
        total_expenses: 0, // Will be calculated by the form
        net_payable: grossRoyalties, // Will be adjusted for expenses
        royalties_to_date: royaltiesToDate + grossRoyalties,
        payments_to_date: paymentsToDate,
        amount_due: grossRoyalties, // Will be adjusted for expenses
      };

      return totals;
    } catch (error: any) {
      console.error('Error calculating payout totals:', error);
      return null;
    }
  };

  const getClientAccountBalance = async (clientId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('client_account_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching client balance:', error);
      return null;
    }
  };

  const getPayoutExpenses = async (payoutId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('payout_expenses')
        .select('*')
        .eq('payout_id', payoutId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching payout expenses:', error);
      return [];
    }
  };

  const updateWorkflowStage = async (payoutId: string, newStage: string, reason?: string, metadata = {}) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .rpc('update_payout_workflow_stage', {
          payout_id_param: payoutId,
          new_stage: newStage,
          reason_param: reason,
          metadata_param: metadata
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Payout moved to ${newStage}`,
      });

      await fetchPayouts();
      return true;
    } catch (error: any) {
      console.error('Error updating workflow stage:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow stage",
        variant: "destructive",
      });
      return false;
    }
  };

  const bulkUpdatePayouts = async (payoutIds: string[], operation: string, config = {}) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('payout_batch_operations')
        .insert({
          user_id: user.id,
          operation_type: operation,
          payout_ids: payoutIds,
          total_count: payoutIds.length,
          operation_config: config
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Batch operation ${operation} initiated`,
      });

      await fetchPayouts();
      return true;
    } catch (error: any) {
      console.error('Error creating batch operation:', error);
      toast({
        title: "Error",
        description: "Failed to initiate batch operation",
        variant: "destructive",
      });
      return false;
    }
  };

  const getWorkflowHistory = async (payoutId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('payout_workflow_history')
        .select('*')
        .eq('payout_id', payoutId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching workflow history:', error);
      return [];
    }
  };

  // Enhanced initialization with retry logic
  useEffect(() => {
    if (user) {
      executeWithRetry().catch(console.error);
    }
  }, [user]); // Removed executeWithRetry from dependencies to prevent infinite loop

  // Memoized computed values for performance
  const memoizedValues = useMemo(() => {
    const totalPayouts = payouts.length;
    const pendingPayouts = payouts.filter(p => p.workflow_stage === 'pending_review').length;
    const approvedPayouts = payouts.filter(p => p.workflow_stage === 'approved').length;
    const paidPayouts = payouts.filter(p => p.workflow_stage === 'paid').length;
    const totalAmount = payouts.reduce((sum, p) => sum + p.amount_due, 0);

    return {
      totalPayouts,
      pendingPayouts,
      approvedPayouts,
      paidPayouts,
      totalAmount,
    };
  }, [payouts]);

  return {
    payouts,
    loading,
    hasPendingUpdates,
    statistics: memoizedValues,
    createPayout,
    updatePayout,
    deletePayout,
    addRoyaltyToPayout,
    removeRoyaltyFromPayout,
    calculatePayoutTotals,
    getClientAccountBalance,
    getPayoutExpenses,
    updateWorkflowStage,
    bulkUpdatePayouts,
    getWorkflowHistory,
    refreshPayouts: fetchPayouts,
    retryFetch: executeWithRetry,
  };
}