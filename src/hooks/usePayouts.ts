import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useAsyncOperation } from './useAsyncOperation';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import { useRetryLogic } from './useRetryLogic';
import { useDataFiltering } from './useDataFiltering';

export interface Payout {
  id: string;
  user_id: string;
  client_id: string;
  period: string;
  period_start?: string;
  period_end?: string;
  total_royalties: number;
  commissions_amount: number;
  gross_royalties: number;
  net_royalties: number;
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
  // Related data
  contacts?: {
    name: string;
    email: string;
  };
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
  const { applyUserIdFilter, filterKey } = useDataFiltering();

  // Helper function to dispatch events when payouts change
  const dispatchPayoutEvent = useCallback((eventType: string, payout?: any) => {
    const event = new CustomEvent(eventType, { detail: payout });
    window.dispatchEvent(event);
  }, []);
  
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
      
      let query = supabase
        .from('payouts')
        .select(`
          *,
          contacts(name, email),
          payees(payee_id, payee_name, contact_info, payment_info),
          payout_royalties(
            id,
            allocated_amount,
            royalty_allocations(work_id, song_title, gross_royalty_amount)
          )
        `)
        .order('created_at', { ascending: false });
      
      query = applyUserIdFilter(query);
      
      const { data, error } = await query;

      if (error) throw error;
      
      setPayouts(data || []);
      setLastFetchTime(now);
      
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      
      // Handle expired/invalid session
      const msg = (error?.message || '') as string;
      if (error?.code === 'PGRST401' || /jwt|token|unauthorized/i.test(msg)) {
        toast({
          title: "Session expired",
          description: "Please sign in again.",
          variant: "destructive",
        });
        // Defer sign-out to avoid interfering with current render
        setTimeout(() => {
          supabase.auth.signOut();
        }, 0);
      } else if (error?.code === 'PGRST301') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view payouts",
          variant: "destructive",
        });
      } else if (/network/i.test(msg)) {
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

      // Link any existing unlinked expenses for this client's payee
      try {
        await supabase.rpc('link_expenses_to_payout', {
          payout_id_param: data.id
        });
      } catch (linkError) {
        console.error('Error linking expenses to payout:', linkError);
        // Continue anyway, this is not critical for payout creation
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

      // Dispatch event to notify quarterly balance reports to refresh
      dispatchPayoutEvent('payoutUpdated', data);
      
      // If status changed to 'paid', specifically notify for payment status change
      if (payoutData.status === 'paid' && existingPayout.status !== 'paid') {
        dispatchPayoutEvent('payoutStatusChanged', data);
        
        // Create quarterly balance report for the paid period
        await createQuarterlyReportForPaidPayout(data);
      }

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

  const calculatePayoutTotals = async (clientId: string, periodStart: string, periodEnd: string, agreementId?: string) => {
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
      
      // Get the contact name for this client to find associated payee
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', clientId)
        .single();

      if (contactError && contactError.code !== 'PGRST116') throw contactError;

      let totalRecoupableExpenses = 0;
      
      if (contact?.name) {
        // Find payees matching this contact name
        const { data: payees, error: payeeError } = await supabase
          .from('payees')
          .select('id')
          .eq('payee_name', contact.name)
          .eq('user_id', user?.id);

        if (payeeError) throw payeeError;

        if (payees && payees.length > 0) {
          const payeeIds = payees.map(p => p.id);
          
          // Calculate total recoupable expenses for this payee from payout_expenses table
          const { data: expenses, error: expenseError } = await supabase
            .from('payout_expenses')
            .select('amount, is_recoupable, expense_flags, expense_status')
            .in('payee_id', payeeIds)
            .eq('user_id', user?.id)
            .in('expense_status', ['pending', 'approved']);

          if (expenseError) throw expenseError;

          // Sum up recoupable expenses
          totalRecoupableExpenses = expenses?.reduce((sum, expense) => {
            // Check for recoupable status from both legacy boolean field and new JSON field
            let isRecoupable = expense.is_recoupable;
            
            // Check the new JSON field if it exists
            if (expense.expense_flags && typeof expense.expense_flags === 'object') {
              try {
                const flags = expense.expense_flags as Record<string, any>;
                if (flags.recoupable === true) {
                  isRecoupable = true;
                }
              } catch (e) {
                // If JSON parsing fails, rely on legacy field
              }
            }
            
            return sum + (isRecoupable ? expense.amount : 0);
          }, 0) || 0;
          
          console.log(`Found ${expenses?.length || 0} expenses for payee(s), total recoupable: $${totalRecoupableExpenses}`);
        } else {
          console.log(`No payees found for contact: ${contact.name}`);
        }
      }
      
      // If agreement-based calculation is requested and agreementId is provided
      if (agreementId) {
        try {
          console.log('Using agreement-based calculation with agreementId:', agreementId);
          const { data: agreement, error: agreementError } = await supabase
            .from('contracts')
            .select('commission_percentage, advance_amount')
            .eq('id', agreementId)
            .single();
            
          if (agreementError) {
            console.error('Agreement error:', agreementError);
            throw agreementError;
          }
          
          console.log('Agreement data:', agreement);
          
          // Get commission expenses for this period and client
          const { data: commissionExpenses, error: expensesError } = await supabase
            .from('payout_expenses')
            .select('amount, is_percentage, percentage_rate')
            .eq('user_id', user.id)
            .eq('expense_status', 'approved')
            .or('is_commission_fee.eq.true,expense_flags->>commission_fee.eq.true')
            .gte('created_at', periodStart)
            .lte('created_at', periodEnd + 'T23:59:59');

          if (expensesError) {
            console.error('Commission expenses error:', expensesError);
            throw expensesError;
          }
          
          console.log('Commission expenses found:', commissionExpenses);
          
          // Calculate commission from agreement percentage
          const commissionRate = agreement?.commission_percentage || 0;
          let commissionDeduction = grossRoyalties * (commissionRate / 100);
          
          console.log('Agreement commission rate:', commissionRate, 'Amount:', commissionDeduction);
          
          // Add commission expenses
          if (commissionExpenses && commissionExpenses.length > 0) {
            const additionalCommissions = commissionExpenses.reduce((sum, expense) => {
              if (expense.is_percentage && expense.percentage_rate) {
                return sum + (grossRoyalties * (expense.percentage_rate / 100));
              } else {
                return sum + (expense.amount || 0);
              }
            }, 0);
            commissionDeduction += additionalCommissions;
            console.log('Additional commission from expenses:', additionalCommissions, 'Total:', commissionDeduction);
          }
          
          const netRoyalties = grossRoyalties - commissionDeduction;
          const netPayable = Math.max(0, netRoyalties - totalRecoupableExpenses);
          
          return {
            gross_royalties: grossRoyalties,
            net_royalties: netRoyalties,
            total_expenses: totalRecoupableExpenses,
            net_payable: netPayable,
            royalties_to_date: grossRoyalties,
            payments_to_date: 0,
            amount_due: netPayable,
            commission_deduction: commissionDeduction,
            calculation_method: 'agreement_based',
            agreement_id: agreementId
          };
        } catch (error) {
          console.error('Error in agreement-based calculation:', error);
          // Fall back to manual calculation
        }
      }
      
      // Manual calculation - now includes commission expenses
      console.log('Using manual calculation - checking for commission expenses');
      
      let commissionDeduction = 0;
      
      // Even in manual calculation, check for commission expenses
      try {
        const { data: commissionExpenses, error: expensesError } = await supabase
          .from('payout_expenses')
          .select('amount, is_percentage, percentage_rate')
          .eq('user_id', user.id)
          .eq('expense_status', 'approved')
          .or('is_commission_fee.eq.true,expense_flags->>commission_fee.eq.true')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59');

        if (!expensesError && commissionExpenses && commissionExpenses.length > 0) {
          commissionDeduction = commissionExpenses.reduce((sum, expense) => {
            if (expense.is_percentage && expense.percentage_rate) {
              return sum + (grossRoyalties * (expense.percentage_rate / 100));
            } else {
              return sum + (expense.amount || 0);
            }
          }, 0);
          console.log('Manual calculation - commission from expenses:', commissionDeduction);
        } else {
          console.log('Manual calculation - no commission expenses found');
        }
      } catch (error) {
        console.error('Error fetching commission expenses in manual calculation:', error);
      }
      
      const netRoyalties = grossRoyalties - commissionDeduction;
      const netPayable = Math.max(0, netRoyalties - totalRecoupableExpenses);
      
      return {
        gross_royalties: grossRoyalties,
        net_royalties: netRoyalties,
        total_expenses: totalRecoupableExpenses,
        net_payable: netPayable,
        royalties_to_date: grossRoyalties,
        payments_to_date: 0,
        amount_due: netPayable,
        commission_deduction: commissionDeduction,
        calculation_method: 'manual'
      };
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
      // Update both workflow_stage and status for consistency
      const statusValue = newStage === 'paid' ? 'paid' : 'pending';
      
      const { error } = await supabase
        .from('payouts')
        .update({ 
          workflow_stage: newStage,
          status: statusValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutId);
      
      if (error) throw error;

      // Also call the RPC for workflow history if it exists
      await supabase
        .rpc('update_payout_workflow_stage', {
          payout_id_param: payoutId,
          new_stage: newStage,
          reason_param: reason,
          metadata_param: metadata
        });

      if (error) throw error;

      // Dispatch events for quarterly balance reports to refresh
      dispatchPayoutEvent('payoutStatusChanged', { id: payoutId, stage: newStage });
      dispatchPayoutEvent('payoutUpdated', { id: payoutId, stage: newStage });
      
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
  }, [user, filterKey]); // Re-fetch when filter changes

  // Memoized computed values for performance
  // Function to manually recalculate payout expenses (for existing payouts)
  const recalculatePayoutExpenses = useCallback(async (payoutId: string) => {
    if (!user) return false;

    try {
      // First, link any unlinked expenses
      await supabase.rpc('link_expenses_to_payout', {
        payout_id_param: payoutId
      });

      // Then trigger a recalculation by updating the payout
      const { error } = await supabase
        .from('payouts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', payoutId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payout expenses recalculated",
      });

      await fetchPayouts();
      return true;
    } catch (error: any) {
      console.error('Error recalculating payout expenses:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate expenses",
        variant: "destructive",
      });
      return false;
    }
  }, [user, fetchPayouts, toast]);

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

  // Create quarterly balance report for paid payout
  const createQuarterlyReportForPaidPayout = async (payout: any) => {
    try {
      console.log('Creating quarterly report for paid payout:', payout.id);
      
      // Extract period information from payout
      const period = payout.period; // e.g., "Q1 2025"
      let year: number;
      let quarter: number;
      
      if (period && period.includes('Q')) {
        const match = period.match(/Q(\d)\s+(\d{4})/);
        if (match) {
          quarter = parseInt(match[1]);
          year = parseInt(match[2]);
        } else {
          // Fallback: use current date
          const now = new Date();
          year = now.getFullYear();
          quarter = Math.floor((now.getMonth() + 3) / 3);
        }
      } else {
        // Fallback: use current date
        const now = new Date();
        year = now.getFullYear();
        quarter = Math.floor((now.getMonth() + 3) / 3);
      }

      // Find the payee for this payout
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', payout.client_id)
        .single();
      
      if (contactError) throw contactError;
      
      // Find payee by name
      const { data: payee, error: payeeError } = await supabase
        .from('payees')
        .select(`
          id,
          payee_name,
          writer_id,
          writers!inner(
            original_publisher_id,
            original_publishers!inner(
              agreement_id
            )
          )
        `)
        .eq('user_id', user?.id)
        .ilike('payee_name', `%${contact.name}%`)
        .single();
      
      if (payeeError || !payee) {
        console.log('No payee found for contact:', contact.name);
        return;
      }
      
      const agreementId = payee.writers?.original_publishers?.agreement_id;
      
      // Check if quarterly report already exists for this period
      const { data: existingReport, error: checkError } = await supabase
        .from('quarterly_balance_reports')
        .select('id')
        .eq('user_id', user?.id)
        .eq('payee_id', payee.id)
        .eq('year', year)
        .eq('quarter', quarter)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingReport) {
        console.log(`Quarterly report already exists for ${payee.payee_name} ${year} Q${quarter}`);
        return;
      }
      
      // Create new quarterly balance report
      const reportData = {
        user_id: user?.id,
        payee_id: payee.id,
        contact_id: payout.client_id,
        agreement_id: agreementId || null,
        year,
        quarter,
        opening_balance: 0, // TODO: Calculate from previous quarter
        royalties_amount: payout.gross_royalties || 0,
        expenses_amount: payout.total_expenses || 0,
        payments_amount: payout.amount_due || 0,
        closing_balance: (payout.gross_royalties || 0) - (payout.total_expenses || 0) - (payout.amount_due || 0),
        is_calculated: true,
        calculation_date: new Date().toISOString()
      };
      
      const { data: newReport, error: insertError } = await supabase
        .from('quarterly_balance_reports')
        .insert(reportData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      console.log('Created quarterly balance report:', newReport.id);
      
      // Dispatch event to refresh quarterly reports
      dispatchPayoutEvent('quarterlyReportCreated', newReport);
      
    } catch (error: any) {
      console.error('Error creating quarterly report for paid payout:', error);
      // Don't fail the payout update if quarterly report creation fails
    }
  };

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
    recalculatePayoutExpenses,
    refreshPayouts: fetchPayouts,
    retryFetch: executeWithRetry,
  };
}