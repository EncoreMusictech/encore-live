import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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
  statement_pdf_url?: string;
  status: string;
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
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPayouts = async () => {
    if (!user) return;
    
    try {
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
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payouts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPayout = async (payoutData: Omit<Payout, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('payouts')
        .insert({
          ...payoutData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payout created successfully",
      });

      await fetchPayouts();
      return data;
    } catch (error: any) {
      console.error('Error creating payout:', error);
      toast({
        title: "Error",
        description: "Failed to create payout",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePayout = async (id: string, payoutData: Partial<Payout>) => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .update(payoutData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payout updated successfully",
      });

      await fetchPayouts();
      return data;
    } catch (error: any) {
      console.error('Error updating payout:', error);
      toast({
        title: "Error",
        description: "Failed to update payout",
        variant: "destructive",
      });
      return null;
    }
  };

  const deletePayout = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payouts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payout deleted successfully",
      });

      await fetchPayouts();
    } catch (error: any) {
      console.error('Error deleting payout:', error);
      toast({
        title: "Error",
        description: "Failed to delete payout",
        variant: "destructive",
      });
    }
  };

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
      // This would calculate totals based on royalty allocations for the client
      // For now, returning mock data - this would be replaced with actual calculation logic
      const totals = {
        gross_royalties: 0,
        total_expenses: 0,
        net_payable: 0,
        royalties_to_date: 0,
        payments_to_date: 0,
        amount_due: 0,
      };

      return totals;
    } catch (error: any) {
      console.error('Error calculating payout totals:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [user]);

  return {
    payouts,
    loading,
    createPayout,
    updatePayout,
    deletePayout,
    addRoyaltyToPayout,
    removeRoyaltyFromPayout,
    calculatePayoutTotals,
    refreshPayouts: fetchPayouts,
  };
}