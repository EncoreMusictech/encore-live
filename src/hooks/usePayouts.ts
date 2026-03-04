import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useAsyncOperation } from './useAsyncOperation';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import { useRetryLogic } from './useRetryLogic';
import { useDataFiltering } from './useDataFiltering';
import { isControlled } from '@/utils/isControlled';
import { resolveOwnershipSplits, ResolvedSplits } from '@/utils/resolveOwnershipSplits';

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
  revenue_type?: string;
  party_id?: string;
  party_role?: string;
  split_percentage?: number;
  controlled_status?: string;
  contract_id?: string;
  ownership_snapshot?: any;
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

        // Send payment confirmation email (best-effort)
        try {
          const payeeName = (data as any).payee_name || 'Valued Client';
          // Look up payee email from contacts
          const { data: contact } = await supabase
            .from('contacts')
            .select('email')
            .eq('id', data.client_id)
            .maybeSingle();
          
          if (contact?.email) {
            await supabase.functions.invoke('send-payment-confirmation', {
              body: {
                to: contact.email,
                recipient_name: payeeName,
                payment_amount: `$${(data.amount_due || 0).toFixed(2)}`,
                payment_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                payment_method: 'Direct Deposit (ACH)',
                reference_id: `PAY-${data.id?.substring(0, 8).toUpperCase()}`,
                period: data.period || undefined,
              },
            });
          }
        } catch (emailErr) {
          console.error('Payment confirmation email failed (non-blocking):', emailErr);
        }
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
      // Get the contact name for this client to find associated payee
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', clientId)
        .single();

      if (contactError && contactError.code !== 'PGRST116') throw contactError;

      // Calculate recoupable expenses for this payee
      let totalRecoupableExpenses = 0;
      if (contact?.name) {
        const { data: payees, error: payeeError } = await supabase
          .from('payees')
          .select('id')
          .eq('payee_name', contact.name)
          .eq('user_id', user?.id);

        if (!payeeError && payees && payees.length > 0) {
          const payeeIds = payees.map(p => p.id);
          const { data: expenses } = await supabase
            .from('payout_expenses')
            .select('amount, is_recoupable, expense_flags, expense_status')
            .in('payee_id', payeeIds)
            .eq('user_id', user?.id)
            .in('expense_status', ['pending', 'approved']);

          totalRecoupableExpenses = expenses?.reduce((sum, expense) => {
            let isRecoupable = expense.is_recoupable;
            if (expense.expense_flags && typeof expense.expense_flags === 'object') {
              try {
                const flags = expense.expense_flags as Record<string, any>;
                if (flags.recoupable === true) isRecoupable = true;
              } catch (e) { /* ignore */ }
            }
            return sum + (isRecoupable ? expense.amount : 0);
          }, 0) || 0;
        }
      }

      // ── Agreement-based calculation (ownership-split or commission-only) ──
      if (agreementId) {
        try {
          const { data: agreement, error: agreementError } = await supabase
            .from('contracts')
            .select('commission_percentage, advance_amount, contract_deal_model, territories, contract_data')
            .eq('id', agreementId)
            .single();

          if (agreementError) throw agreementError;

          const dealModel = agreement?.contract_deal_model || 'ownership_split';

          if (dealModel === 'ownership_split') {
            // [FIX 2/5] Schedule works: id, copyright_id, inherits_royalty_splits, created_at filtered by contract_id
            const { data: scheduleWorks } = await supabase
              .from('contract_schedule_works')
              .select('id, copyright_id, inherits_royalty_splits, created_at')
              .eq('contract_id', agreementId)
              .not('copyright_id', 'is', null);

            // Deterministic copyright → work map
            const copyrightToWorkMap = new Map<string, string>();
            const seenCopyrights = new Map<string, any>();
            for (const work of (scheduleWorks || [])) {
              if (!work.copyright_id) continue;
              const existing = seenCopyrights.get(work.copyright_id);
              if (!existing) {
                seenCopyrights.set(work.copyright_id, work);
                copyrightToWorkMap.set(work.copyright_id, work.id);
              } else {
                console.warn(`Duplicate copyright_id ${work.copyright_id} in schedule works. Deterministic resolution applied.`);
                const preferNew =
                  (work.inherits_royalty_splits === false && existing.inherits_royalty_splits !== false) ||
                  (work.inherits_royalty_splits === existing.inherits_royalty_splits &&
                    new Date(work.created_at) > new Date(existing.created_at));
                if (preferNew) {
                  seenCopyrights.set(work.copyright_id, work);
                  copyrightToWorkMap.set(work.copyright_id, work.id);
                }
              }
            }

            const copyrightIds = Array.from(copyrightToWorkMap.keys());

            // [FIX 3] Split cache keyed by ${contractId}:${workId} or ${contractId}:contract
            const splitCache = new Map<string, ResolvedSplits>();
            async function getCachedSplits(cId: string, wId?: string | null): Promise<ResolvedSplits> {
              const key = wId ? `${cId}:${wId}` : `${cId}:contract`;
              if (splitCache.has(key)) return splitCache.get(key)!;
              const result = await resolveOwnershipSplits(cId, wId);
              splitCache.set(key, result);
              return result;
            }

            let royaltiesQuery = supabase
              .from('royalty_allocations')
              .select('id, gross_royalty_amount, net_amount, revenue_type, country, copyright_id, line_type, revenue_type_confidence, rights_basis')
              .eq('user_id', user?.id)
              .gte('created_at', periodStart)
              .lte('created_at', periodEnd + 'T23:59:59');

            if (copyrightIds.length > 0) {
              royaltiesQuery = royaltiesQuery.in('copyright_id', copyrightIds);
            }

            const { data: royalties, error: royaltyError } = await royaltiesQuery;
            if (royaltyError) throw royaltyError;

            const grossRoyalties = (royalties || []).reduce((s, r) => s + (r.gross_royalty_amount || 0), 0);

            // Per-allocation split resolution with stop conditions
            let controlledTotal = 0;
            const SPLIT_FIELD_MAP: Record<string, string> = {
              performance: 'performance_percentage',
              mechanical: 'mechanical_percentage',
              synch: 'synch_percentage',
            };

            for (const allocation of royalties || []) {
              const gross = allocation.gross_royalty_amount || 0;
              const revenueType = allocation.revenue_type;

              // [FIX 4] Stop conditions — continue without allocating
              if (!revenueType) continue;
              if (revenueType === 'other') continue;
              if (allocation.revenue_type_confidence === 'low') continue;
              if (allocation.rights_basis === 'exclude_from_splits') continue;
              if (allocation.line_type && allocation.line_type !== 'royalty') continue;

              const workId = allocation.copyright_id
                ? copyrightToWorkMap.get(allocation.copyright_id) ?? null
                : null;

              const splits = await getCachedSplits(agreementId, workId);
              if (!splits.valid) continue;

              const splitField = SPLIT_FIELD_MAP[revenueType] || 'performance_percentage';

              // [FIX 7] Track uncontrolled_total per allocation
              for (const party of splits.parties) {
                if (!party.is_controlled) continue;
                const splitPct = (party as any)[splitField] || 0;
                controlledTotal += gross * (splitPct / 100);
              }
            }

            const netPayable = Math.max(0, controlledTotal - totalRecoupableExpenses);

            return {
              gross_royalties: grossRoyalties,
              net_royalties: controlledTotal,
              total_expenses: totalRecoupableExpenses,
              net_payable: netPayable,
              royalties_to_date: grossRoyalties,
              payments_to_date: 0,
              amount_due: netPayable,
              commission_deduction: 0,
              calculation_method: 'agreement_based',
              agreement_id: agreementId,
              contract_deal_model: dealModel,
            };
          } else {
            // Commission-only model – existing logic
            let royaltiesQuery = supabase
              .from('royalty_allocations')
              .select('gross_royalty_amount, net_amount')
              .eq('user_id', user?.id)
              .gte('created_at', periodStart)
              .lte('created_at', periodEnd + 'T23:59:59');

            const { data: royalties, error: royaltyError } = await royaltiesQuery;
            if (royaltyError) throw royaltyError;

            const grossRoyalties = (royalties || []).reduce((s, r) => s + (r.gross_royalty_amount || 0), 0);
            const commissionRate = agreement?.commission_percentage || 0;
            const commissionDeduction = grossRoyalties * (commissionRate / 100);
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
              agreement_id: agreementId,
              contract_deal_model: dealModel,
            };
          }
        } catch (error) {
          console.error('Error in agreement-based calculation:', error);
          // Fall through to manual
        }
      }

      // ── Manual calculation ──
      const { data: royalties, error: royaltyError } = await supabase
        .from('royalty_allocations')
        .select('gross_royalty_amount, net_amount')
        .eq('user_id', user?.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      if (royaltyError) throw royaltyError;

      const grossRoyalties = (royalties || []).reduce((s, r) => s + (r.gross_royalty_amount || 0), 0);
      const netPayable = Math.max(0, grossRoyalties - totalRecoupableExpenses);

      return {
        gross_royalties: grossRoyalties,
        net_royalties: grossRoyalties,
        total_expenses: totalRecoupableExpenses,
        net_payable: netPayable,
        royalties_to_date: grossRoyalties,
        payments_to_date: 0,
        amount_due: netPayable,
        commission_deduction: 0,
        calculation_method: 'manual',
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