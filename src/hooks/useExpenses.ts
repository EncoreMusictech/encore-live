import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useDataFiltering } from './useDataFiltering';

export interface PayoutExpense {
  id: string;
  user_id: string;
  payout_id?: string;
  expense_type: string;
  description: string;
  amount: number;
  is_percentage: boolean;
  percentage_rate?: number;
  agreement_id?: string;
  payee_id?: string;
  expense_behavior: 'crossed' | 'direct';
  // Legacy individual boolean fields (kept for backward compatibility)
  is_commission_fee: boolean;
  is_finder_fee: boolean;
  is_recoupable: boolean;
  // New combined JSON field
  expense_flags?: {
    recoupable?: boolean;
    commission_fee?: boolean;
    finder_fee?: boolean;
  };
  valid_from_date?: string;
  valid_to_date?: string;
  expense_cap?: number;
  work_id?: string;
  invoice_url?: string;
  date_incurred?: string;
  expense_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  // Relations
  contracts?: {
    title: string;
    counterparty_name: string;
  };
  payees?: {
    payee_name: string;
  };
  copyrights?: {
    work_title: string;
  };
}

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<PayoutExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { applyUserIdFilter, applyEntityFilter, filterKey } = useDataFiltering();

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('payout_expenses')
        .select(`
          *,
          contracts:agreement_id(title, counterparty_name),
          payees:payee_id(payee_name),
          copyrights:work_id(work_title)
        `)
        .order('created_at', { ascending: false });
      
      query = applyUserIdFilter(query);
      query = applyEntityFilter(query);
      
      const { data, error } = await query;

      if (error) throw error;
      setExpenses((data || []) as PayoutExpense[]);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData: Omit<PayoutExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      // Auto-link to matching payout if not specified and expense is approved & recoupable
      let finalExpenseData = { ...expenseData };
      
      if (!expenseData.payout_id && 
          expenseData.expense_status === 'approved' && 
          (expenseData.is_recoupable || expenseData.expense_flags?.recoupable) &&
          expenseData.payee_id) {
        
        // Find matching payout
        const { data: matchingPayout } = await supabase
          .from('payouts')
          .select('id')
          .eq('payee_id', expenseData.payee_id)
          .eq('user_id', user.id)
          .in('status', ['pending', 'approved'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (matchingPayout) {
          finalExpenseData.payout_id = matchingPayout.id;
        }
      }

      const { data, error } = await supabase
        .from('payout_expenses')
        .insert({
          ...finalExpenseData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Expense created successfully');
      await fetchExpenses();
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Failed to create expense');
      return null;
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<PayoutExpense>) => {
    try {
      let finalExpenseData = { ...expenseData };
      
      // Auto-link to matching payout if conditions are met
      if (!expenseData.payout_id && 
          expenseData.expense_status === 'approved' && 
          (expenseData.is_recoupable || expenseData.expense_flags?.recoupable) &&
          expenseData.payee_id) {
        
        // Find matching payout
        const { data: matchingPayout } = await supabase
          .from('payouts')
          .select('id')
          .eq('payee_id', expenseData.payee_id)
          .eq('user_id', user?.id || '')
          .in('status', ['pending', 'approved'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (matchingPayout) {
          finalExpenseData.payout_id = matchingPayout.id;
        }
      }

      const { data, error } = await supabase
        .from('payout_expenses')
        .update(finalExpenseData)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Expense updated successfully');
      await fetchExpenses();
      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payout_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Expense deleted successfully');
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const getExpensesByPayee = async (payeeId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('payout_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('payee_id', payeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses by payee:', error);
      return [];
    }
  };

  const getExpensesByWork = async (workId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('payout_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('work_id', workId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses by work:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user, filterKey]); // Re-fetch when filter changes

  return {
    expenses,
    loading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByPayee,
    getExpensesByWork
  };
}