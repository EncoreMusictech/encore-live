import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemoAccess } from "@/hooks/useDemoAccess";
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
  // Preferred payee display
  payee_name?: string;
  payees?: {
    payee_name: string;
  };
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
  const { isDemo } = useDemoAccess();

  console.log('🔍 useQuarterlyBalanceReports hook initialized:', { user: !!user, isDemo });

  const buildEphemeralFromPayouts = async (): Promise<QuarterlyBalanceReport[]> => {
    if (!user) return [];

    try {
      console.log('Building quarterly balance reports from payouts and expenses...');
      
      // Debug: Check for specific payee/contact data
      const { data: debugContacts } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', '%janishia%');
      console.log('Contacts containing "janishia":', debugContacts);

      const { data: debugPayees } = await supabase
        .from('payees')
        .select('id, payee_name')
        .eq('user_id', user.id)
        .ilike('payee_name', '%janishia%');
      console.log('Payees containing "janishia":', debugPayees);
      
      // Fetch all payouts for this user, including paid ones
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('id, payee_id, gross_royalties, total_expenses, amount_due, status, workflow_stage, created_at, period_start, period_end, period')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (payoutsError) {
        console.error('Error fetching payouts:', payoutsError);
        return [];
      }

      console.log(`Found ${payouts?.length || 0} payouts for balance calculation`);

      if (!payouts || payouts.length === 0) {
        console.log('No payouts found for quarterly balance calculation');
        return [];
      }

      console.log(`Found ${payouts.length} payouts for balance calculation`);

      // Collect unique payee ids
      const payeeIds = Array.from(new Set(payouts.map(p => p.payee_id).filter(Boolean)));

      // Load payees for name/email mapping
      const payeesMap = new Map<string, { name: string }>();
      if (payeeIds.length > 0) {
        const { data: payees } = await supabase
          .from('payees')
          .select('id, payee_name')
          .in('id', payeeIds as string[])
          .eq('user_id', user.id);
        payees?.forEach(p => payeesMap.set(p.id, { name: p.payee_name }));
      }
      
      console.log(`📊 Found ${payeesMap.size} payees for mapping`);

      // Group by payee/year/quarter and calculate running balances
      type PayeeQuarterData = {
        payee_id: string;
        payee: { name: string } | undefined;
        year: number;
        quarter: number;
        royalties_amount: number;
        expenses_amount: number;
        payments_amount: number;
        sortKey: number;
      };

      const quarterlyData = new Map<string, PayeeQuarterData>();
      const periodKey = (year: number, quarter: number) => `${year}-Q${quarter}`;
      const periodLabel = (year: number, quarter: number) => `Q${quarter} ${year}`;

      for (const payout of payouts) {
        const periodDate = (payout as any).period_start || payout.created_at;
        const d = new Date(periodDate);
        const year = d.getFullYear();
        const quarter = Math.ceil((d.getMonth() + 1) / 3);
        const payeeId = payout.payee_id;
        const payee = payeeId ? payeesMap.get(payeeId) : undefined;
        const payeeName = payee?.name || 'Unknown';
        
        console.log(`🔍 Processing payout for payee: "${payeeName}" (payee_id: ${payeeId})`);
        
        if (!payeeId) {
          console.log('⚠️ Skipping payout without payee_id');
          continue;
        }
        
        const key = `${payeeId}-${periodKey(year, quarter)}`;

        if (!quarterlyData.has(key)) {
          quarterlyData.set(key, {
            payee_id: payeeId,
            payee,
            year,
            quarter,
            royalties_amount: 0,
            expenses_amount: 0,
            payments_amount: 0,
            sortKey: year * 10 + quarter,
          });
        }

        const entry = quarterlyData.get(key)!;
        entry.royalties_amount += Number(payout.gross_royalties || 0);
        entry.expenses_amount += Number(payout.total_expenses || 0);
        
        // Only count payments for payouts marked as 'paid' (check both status and workflow_stage)
        const isPaid = String(payout.status || '').toLowerCase() === 'paid' || 
                      String((payout as any).workflow_stage || '').toLowerCase() === 'paid';
        if (isPaid) {
          entry.payments_amount += Number(payout.amount_due || 0);
          console.log(`✅ Added payment of $${payout.amount_due} for ${payeeName} in ${periodLabel(year, quarter)}`);
        } else {
          console.log(`⏳ Skipped payment for ${payeeName} in ${periodLabel(year, quarter)} - status: ${payout.status}, workflow_stage: ${(payout as any).workflow_stage}`);
        }
      }

      // Group by payee and calculate running balances chronologically
      const byPayee = new Map<string, PayeeQuarterData[]>();
      for (const entry of quarterlyData.values()) {
        if (!byPayee.has(entry.payee_id)) byPayee.set(entry.payee_id, []);
        byPayee.get(entry.payee_id)!.push(entry);
      }

      const results: QuarterlyBalanceReport[] = [];
      for (const [payeeId, entries] of byPayee) {
        // Sort chronologically
        entries.sort((a, b) => a.sortKey - b.sortKey);
        
        let runningBalance = 0;
        for (const entry of entries) {
          const openingBalance = runningBalance;
          const closingBalance = Number((openingBalance + entry.royalties_amount - entry.expenses_amount - entry.payments_amount).toFixed(2));
          
          results.push({
            id: `demo-${entry.payee_id}-${entry.year}-Q${entry.quarter}`,
            user_id: user.id,
            payee_id: entry.payee_id,
            contact_id: undefined,
            agreement_id: undefined,
            year: entry.year,
            quarter: entry.quarter,
            period_label: periodLabel(entry.year, entry.quarter),
            opening_balance: openingBalance,
            royalties_amount: entry.royalties_amount,
            expenses_amount: entry.expenses_amount,
            payments_amount: entry.payments_amount,
            closing_balance: closingBalance,
            is_calculated: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            payee_name: entry.payee?.name || 'Unknown',
            payees: entry.payee ? { payee_name: entry.payee.name } : undefined,
            contracts: undefined,
          });

          runningBalance = closingBalance;
          console.log(`${entry.payee?.name || 'Unknown'} ${periodLabel(entry.year, entry.quarter)}: Opening $${openingBalance}, Closing $${closingBalance}`);
        }
      }

      // Return most recent first to match default ordering
      results.sort((a, b) => (b.year - a.year) || (b.quarter - a.quarter));
      console.log(`Generated ${results.length} quarterly balance reports`);
      return results;
    } catch (e) {
      console.error('Error building quarterly reports from payouts:', e);
      return [];
    }
  };

  const fetchReports = async () => {
    console.log('🔍 fetchReports called:', { user: !!user, userId: user?.id });
    try {
      if (user) {
        console.log('🔍 User exists, proceeding with report fetch');
        // Detect if current user is a client by checking active portal access
        const { data: portalAccess } = await supabase
          .from('client_portal_access')
          .select('id')
          .eq('client_user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (portalAccess) {
          // Client mode: use secure RPC that aggregates client-visible balances (incl. paid amounts)
          const { data: clientRows, error: clientErr } = await supabase.rpc('get_client_quarterly_balances');
          if (clientErr) throw clientErr;

          // Get contract titles for agreement IDs
          const agreementIds = [...new Set(clientRows?.map((row: any) => row.agreement_id).filter(Boolean))];
          const contractsMap = new Map<string, { title: string; agreement_id: string }>();
          
          if (agreementIds.length > 0) {
            const { data: contractsData } = await supabase
              .from('contracts')
              .select('agreement_id, title')
              .in('agreement_id', agreementIds);
            
            contractsData?.forEach(contract => {
              if (contract.agreement_id) {
                contractsMap.set(contract.agreement_id, { 
                  title: contract.title,
                  agreement_id: contract.agreement_id 
                });
              }
            });
          }

          const mapped = (clientRows || []).map((row: any) => ({
            id: `client-${row.year}-Q${row.quarter}`,
            user_id: user.id,
            payee_id: `client-${user.id}`,
            contact_id: undefined,
            agreement_id: row.agreement_id,
            year: row.year,
            quarter: row.quarter,
            period_label: row.period_label,
            opening_balance: Number(row.opening_balance || 0),
            royalties_amount: Number(row.royalties_amount || 0),
            expenses_amount: Number(row.expenses_amount || 0),
            payments_amount: Number(row.payments_amount || 0),
            closing_balance: Number(row.closing_balance || 0),
            is_calculated: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            payee_name: row.contact_name,
            contacts: row.contact_name ? { name: row.contact_name } : undefined,
            contracts: row.agreement_id ? contractsMap.get(row.agreement_id) : undefined,
          })) as QuarterlyBalanceReport[];

          setReports(mapped);
          return;
        }

        // Try to fetch existing quarterly balance reports first
        const { data, error } = await supabase
          .from('quarterly_balance_reports')
          .select(`
            *,
            contacts!quarterly_balance_reports_contact_id_fkey(name, email),
            contracts!quarterly_balance_reports_agreement_id_fkey(title, agreement_id),
            payees!fk_quarterly_balance_reports_payee_id(payee_name)
          `)
          .eq('user_id', user.id)
          .order('year', { ascending: false })
          .order('quarter', { ascending: false });

        if (error) throw error;

        // If we have stored reports and not in demo mode, prefer those
        if (data && data.length > 0 && !isDemo) {
          console.log(`Using ${data.length} stored quarterly balance reports`);
          // Normalize Supabase join result so types match QuarterlyBalanceReport
          const normalized: QuarterlyBalanceReport[] = (data as any[]).map((row: any) => ({
            ...row,
            // Ensure a uniform top-level payee_name for UI grouping/search
            payee_name: row?.payees?.payee_name ?? row?.payee_name ?? row?.contacts?.name ?? 'Unknown',
            // Normalize nested relation to expected shape (avoid SelectQueryError typing)
            payees: row?.payees && typeof row.payees === 'object' && 'payee_name' in row.payees
              ? { payee_name: row.payees.payee_name as string }
              : undefined,
          }));

          // Fallback: if stored reports are missing payees present in payouts, rebuild from payouts
          try {
            const uniqueStoredPayees = new Set(normalized.map(r => r.payee_id).filter(Boolean));
            const { data: payoutRows } = await supabase
              .from('payouts')
              .select('payee_id')
              .eq('user_id', user.id);
            const uniquePayoutPayees = new Set((payoutRows || []).map(p => p.payee_id).filter(Boolean));

            if (uniquePayoutPayees.size > uniqueStoredPayees.size) {
              console.log(
                `Stored reports missing payees (stored: ${uniqueStoredPayees.size}, payouts: ${uniquePayoutPayees.size}). Using ephemeral build from payouts.`
              );
              const ephemeral = await buildEphemeralFromPayouts();
              setReports(ephemeral);
            } else {
              setReports(normalized);
            }
          } catch (e) {
            console.warn('Fallback comparison failed, using stored reports:', e);
            setReports(normalized);
          }
        } else {
          // Generate ephemeral reports from payouts - always build them if there are payouts
          console.log('Building quarterly balance reports from existing payouts');
          const demoData = await buildEphemeralFromPayouts();
          setReports(demoData);
        }
      }
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

    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Report creation is not available in demo mode. Sign up to create real reports.",
        variant: "destructive",
      });
      return null;
    }

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
          contracts!quarterly_balance_reports_agreement_id_fkey(title, agreement_id),
          payees!fk_quarterly_balance_reports_payee_id(payee_name)
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
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Report editing is not available in demo mode. Sign up to modify real reports.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('quarterly_balance_reports')
        .update(reportData)
        .eq('id', id)
        .select(`
          *,
          contacts!quarterly_balance_reports_contact_id_fkey(name, email),
          contracts!quarterly_balance_reports_agreement_id_fkey(title, agreement_id),
          payees!fk_quarterly_balance_reports_payee_id(payee_name)
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
    if (isDemo) {
      toast({
        title: "Demo Mode", 
        description: "Report deletion is not available in demo mode. Sign up to manage real reports.",
        variant: "destructive",
      });
      return;
    }

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

    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Report generation is not available in demo mode. Sign up to generate real reports.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current year and quarter to establish range
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

      // Generate quarters from current quarter up to 8 quarters in the future
      const quarters = [];
      for (let i = 0; i < 8; i++) {
        let year = currentYear;
        let quarter = currentQuarter + i;
        
        // Handle year rollover
        while (quarter > 4) {
          quarter -= 4;
          year += 1;
        }
        
        quarters.push({ year, quarter });
      }

      for (const { year, quarter } of quarters) {
        // Calculate quarter date range
        const quarterStart = new Date(year, (quarter - 1) * 3, 1);
        const quarterEnd = new Date(year, quarter * 3, 0, 23, 59, 59);

        // Fetch royalties that are linked to batches with date_received in this quarter
        // Only include royalties that have a batch_id (reconciled royalties)
        const { data: royaltiesWithBatches } = await supabase
          .from('royalty_allocations')
          .select(`
            net_amount,
            batch_id,
            reconciliation_batches!inner(date_received)
          `)
          .eq('user_id', user.id)
          .not('batch_id', 'is', null)
          .gte('reconciliation_batches.date_received', quarterStart.toISOString().split('T')[0])
          .lte('reconciliation_batches.date_received', quarterEnd.toISOString().split('T')[0]);

        // Fetch expenses for this period linked to this payee
        const { data: expenses } = await supabase
          .from('payout_expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('payee_id', payeeId)
          .gte('date_incurred', quarterStart.toISOString().split('T')[0])
          .lte('date_incurred', quarterEnd.toISOString().split('T')[0]);

        // Fetch payments for this period linked to this payee
        const { data: payments } = await supabase
          .from('payouts')
          .select('amount_due')
          .eq('user_id', user.id)
          .eq('client_id', contactId || payeeId)
          .eq('status', 'paid')
          .gte('created_at', quarterStart.toISOString())
          .lte('created_at', quarterEnd.toISOString());

        // Calculate totals
        const royaltiesAmount = royaltiesWithBatches?.reduce((sum, r) => sum + (r.net_amount || 0), 0) || 0;
        const expensesAmount = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const paymentsAmount = payments?.reduce((sum, p) => sum + (p.amount_due || 0), 0) || 0;

        // Get the previous quarter's closing balance for opening balance
        let previousQuarter = quarter - 1;
        let previousYear = year;
        if (previousQuarter === 0) {
          previousQuarter = 4;
          previousYear -= 1;
        }

        const { data: previousReport } = await supabase
          .from('quarterly_balance_reports')
          .select('closing_balance')
          .eq('user_id', user.id)
          .eq('payee_id', payeeId)
          .eq('year', previousYear)
          .eq('quarter', previousQuarter)
          .single();

        const openingBalance = previousReport?.closing_balance || 0;

        // Create or update the report with automatic closing balance calculation
        const { error } = await supabase
          .from('quarterly_balance_reports')
          .upsert({
            user_id: user.id,
            payee_id: payeeId,
            contact_id: contactId,
            agreement_id: agreementId,
            year,
            quarter,
            opening_balance: openingBalance,
            royalties_amount: royaltiesAmount,
            expenses_amount: expensesAmount,
            payments_amount: paymentsAmount,
          }, {
            onConflict: 'user_id,payee_id,year,quarter'
          });

        if (error) {
          console.error('Error upserting report:', error);
        }
      }

      await fetchReports();
      
      toast({
        title: "Success", 
        description: "Quarterly balance reports updated with reconciled royalties",
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
  }, [user, isDemo]);

  // Listen for payout changes that might affect quarterly balance reports
  useEffect(() => {
    const handlePayoutChanges = () => {
      console.log('Payout status changed, refreshing quarterly balance reports...');
      fetchReports();
    };

    // Listen for custom events from the payout system
    window.addEventListener('payoutStatusChanged', handlePayoutChanges);
    window.addEventListener('payoutUpdated', handlePayoutChanges);

    return () => {
      window.removeEventListener('payoutStatusChanged', handlePayoutChanges);
      window.removeEventListener('payoutUpdated', handlePayoutChanges);
    };
  }, []);

  // Manual refresh function
  const refreshReports = useCallback(() => {
    console.log('Manual refresh of quarterly balance reports triggered');
    fetchReports();
  }, []);

  // Generate persistent quarterly balance reports from existing payout data
  const generateMissingReports = async () => {
    if (!user || isDemo) {
      toast({
        title: "Demo Mode",
        description: "Report generation is not available in demo mode.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 Generating missing quarterly balance reports using edge function...');
      
      // Call the edge function instead of doing the processing client-side
      const { data, error } = await supabase.functions.invoke('generate-quarterly-reports', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('✅ Edge function completed successfully:', data);
      
      // Refresh the reports view
      await fetchReports();
      
      toast({
        title: "Success",
        description: data.message || "Generated quarterly balance reports from existing payout data",
      });

    } catch (error: any) {
      console.error('Error generating missing reports:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to generate quarterly balance reports: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Initialize quarterly balance reports for a new payee
  const initializePayeeReports = async (payeeId: string, contactId?: string, agreementId?: string) => {
    if (isDemo) {
      console.log('Demo mode: cannot initialize payee reports');
      return;
    }

    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
      
      // Generate reports for current quarter and next 7 quarters (2 years)
      const reportsToCreate = [];
      
      for (let i = 0; i < 8; i++) {
        let year = currentYear;
        let quarter = currentQuarter + i;
        
        // Handle year rollover
        while (quarter > 4) {
          quarter -= 4;
          year += 1;
        }
        
        reportsToCreate.push({
          user_id: user.id,
          payee_id: payeeId,
          contact_id: contactId || null,
          agreement_id: agreementId || null,
          year,
          quarter,
          opening_balance: 0,
          royalties_amount: 0,
          expenses_amount: 0,
          payments_amount: 0,
          closing_balance: 0,
          is_calculated: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Insert all reports
      const { error } = await supabase
        .from('quarterly_balance_reports')
        .insert(reportsToCreate);

      if (error) {
        console.error('Error initializing payee reports:', error);
        return;
      }

      console.log(`Initialized ${reportsToCreate.length} quarterly balance reports for payee ${payeeId}`);
      
      // Trigger aggregation for any existing royalties
      await generateReportsFromData(payeeId, contactId, agreementId);
      
    } catch (error) {
      console.error('Error in initializePayeeReports:', error);
    }
  };

  return {
    reports,
    loading,
    fetchReports,
    refreshReports,
    createReport,
    updateReport,
    deleteReport,
    generateReportsFromData,
    generateMissingReports,
    exportToCSV,
    initializePayeeReports,
  };
}
