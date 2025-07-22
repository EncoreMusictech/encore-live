import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface QuarterlyBalanceReport {
  id: string;
  user_id: string;
  payee_id: string;
  contact_id?: string;
  agreement_id?: string;
  year: number;
  quarter: number;
  period_label: string;
  opening_balance: number;
  royalties_amount: number;
  expenses_amount: number;
  payments_amount: number;
  closing_balance: number;
  is_calculated: boolean;
  calculation_date?: string;
  created_at: string;
  updated_at: string;
  contacts?: {
    name: string;
    email?: string;
  };
  contracts?: {
    title: string;
    agreement_id?: string;
  };
}

export interface QuarterlyBalanceInsert {
  payee_id: string;
  contact_id?: string;
  agreement_id?: string;
  year: number;
  quarter: number;
  opening_balance?: number;
  royalties_amount?: number;
  expenses_amount?: number;
  payments_amount?: number;
}

export function useQuarterlyBalanceReports() {
  const [reports, setReports] = useState<QuarterlyBalanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReports = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('quarterly_balance_reports')
        .select(`
          *,
          contacts!quarterly_balance_reports_contact_id_fkey(name, email),
          contracts!quarterly_balance_reports_agreement_id_fkey(title, agreement_id)
        `)
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching quarterly balance reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quarterly balance reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (reportData: QuarterlyBalanceInsert): Promise<QuarterlyBalanceReport | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('quarterly_balance_reports')
        .insert({
          ...reportData,
          user_id: user.id,
        })
        .select(`
          *,
          contacts!quarterly_balance_reports_contact_id_fkey(name, email),
          contracts!quarterly_balance_reports_agreement_id_fkey(title, agreement_id)
        `)
        .single();

      if (error) throw error;

      setReports(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Quarterly balance report created successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating quarterly balance report:', error);
      toast({
        title: "Error",
        description: "Failed to create quarterly balance report",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateReport = async (id: string, reportData: Partial<QuarterlyBalanceReport>): Promise<QuarterlyBalanceReport | null> => {
    try {
      const { data, error } = await supabase
        .from('quarterly_balance_reports')
        .update(reportData)
        .eq('id', id)
        .select(`
          *,
          contacts!quarterly_balance_reports_contact_id_fkey(name, email),
          contracts!quarterly_balance_reports_agreement_id_fkey(title, agreement_id)
        `)
        .single();

      if (error) throw error;

      setReports(prev => prev.map(report => report.id === id ? data : report));
      toast({
        title: "Success",
        description: "Quarterly balance report updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating quarterly balance report:', error);
      toast({
        title: "Error",
        description: "Failed to update quarterly balance report",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteReport = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('quarterly_balance_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReports(prev => prev.filter(report => report.id !== id));
      toast({
        title: "Success",
        description: "Quarterly balance report deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting quarterly balance report:', error);
      toast({
        title: "Error",
        description: "Failed to delete quarterly balance report",
        variant: "destructive",
      });
    }
  };

  const generateReportsFromData = async (payeeId: string, contactId?: string, agreementId?: string): Promise<void> => {
    if (!user) return;

    try {
      // Get current year and quarter
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

      // Fetch data from different modules for the past 4 quarters
      const quarters = [];
      for (let i = 3; i >= 0; i--) {
        let year = currentYear;
        let quarter = currentQuarter - i;
        
        if (quarter <= 0) {
          year -= 1;
          quarter += 4;
        }
        
        quarters.push({ year, quarter });
      }

      for (const { year, quarter } of quarters) {
        // Calculate quarter date range
        const quarterStart = new Date(year, (quarter - 1) * 3, 1);
        const quarterEnd = new Date(year, quarter * 3, 0, 23, 59, 59);

        // Fetch royalties for this period
        const { data: royalties } = await supabase
          .from('royalty_allocations')
          .select('net_amount')
          .eq('user_id', user.id)
          .gte('created_at', quarterStart.toISOString())
          .lte('created_at', quarterEnd.toISOString());

        // Fetch expenses for this period
        const { data: expenses } = await supabase
          .from('payout_expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('is_recoupable', true)
          .gte('created_at', quarterStart.toISOString())
          .lte('created_at', quarterEnd.toISOString());

        // Fetch payments for this period
        const { data: payments } = await supabase
          .from('payouts')
          .select('amount_due')
          .eq('user_id', user.id)
          .eq('client_id', contactId || payeeId)
          .eq('status', 'paid')
          .gte('created_at', quarterStart.toISOString())
          .lte('created_at', quarterEnd.toISOString());

        const royaltiesAmount = royalties?.reduce((sum, r) => sum + (r.net_amount || 0), 0) || 0;
        const expensesAmount = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const paymentsAmount = payments?.reduce((sum, p) => sum + (p.amount_due || 0), 0) || 0;

        // Create or update the report
        await supabase
          .from('quarterly_balance_reports')
          .upsert({
            user_id: user.id,
            payee_id: payeeId,
            contact_id: contactId,
            agreement_id: agreementId,
            year,
            quarter,
            royalties_amount: royaltiesAmount,
            expenses_amount: expensesAmount,
            payments_amount: paymentsAmount,
          });
      }

      await fetchReports();
      
      toast({
        title: "Success",
        description: "Quarterly balance reports generated successfully",
      });
    } catch (error: any) {
      console.error('Error generating quarterly balance reports:', error);
      toast({
        title: "Error",
        description: "Failed to generate quarterly balance reports",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (reports: QuarterlyBalanceReport[]) => {
    const headers = [
      'Period',
      'Payee',
      'Agreement',
      'Opening Balance',
      'Royalties',
      'Expenses',
      'Payments',
      'Closing Balance'
    ];

    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        report.period_label,
        report.contacts?.name || 'Unknown',
        report.contracts?.title || 'N/A',
        report.opening_balance.toFixed(2),
        report.royalties_amount.toFixed(2),
        report.expenses_amount.toFixed(2),
        report.payments_amount.toFixed(2),
        report.closing_balance.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quarterly_balance_reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  return {
    reports,
    loading,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    generateReportsFromData,
    exportToCSV,
  };
}