import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface AgreementTerms {
  id: string;
  title: string;
  commission_percentage: number;
  advance_amount: number;
  start_date: string;
  end_date: string;
  territory_restrictions: string[];
  controlled_percentage: number;
  contract_data: any;
}

export interface ContractWriter {
  id: string;
  name: string;
  performance_percentage: number;
  mechanical_percentage: number;
  synch_percentage: number;
  controlled: boolean;
}

export interface AgreementCalculationResult {
  gross_royalties: number;
  net_royalties: number;
  total_expenses: number;
  net_payable: number;
  advance_recoupment: number;
  commission_deduction: number;
  territory_adjustments: Record<string, number>;
  calculation_method: 'agreement_based' | 'manual';
  agreement_id?: string;
}

export function useAgreementCalculation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getClientAgreements = async (clientId: string) => {
    try {
      // Get client name to match with contract counterparty
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', clientId)
        .single();

      if (contactError) throw contactError;

      console.log('Looking for agreements for client:', contact.name);

      // Try multiple approaches to find agreements
      let allAgreements: AgreementTerms[] = [];

      // Method 1: Direct contract match by counterparty name
      const { data: directAgreements, error: directError } = await supabase
        .from('contracts')
        .select(`
          id,
          title,
          commission_percentage,
          advance_amount,
          start_date,
          end_date,
          controlled_percentage,
          contract_data,
          counterparty_name,
          contract_status
        `)
        .eq('user_id', user?.id)
        .or(`counterparty_name.eq.${contact.name},counterparty_name.ilike.%${contact.name}%`)
        .in('contract_status', ['active', 'signed', 'draft']);

      if (!directError && directAgreements) {
        allAgreements.push(...directAgreements.map(agreement => ({
          ...agreement,
          territory_restrictions: (agreement.contract_data as any)?.territory_restrictions || []
        })));
      }

      // Method 2: Find through payee hierarchy (Payee → Writer → Original Publisher → Agreement)
      const { data: payeeAgreements, error: payeeError } = await supabase
        .from('payees')
        .select(`
          writer_id,
          writers!inner(
            original_publisher_id,
            original_publishers!inner(
              agreement_id,
              contracts!inner(
                id,
                title,
                commission_percentage,
                advance_amount,
                start_date,
                end_date,
                controlled_percentage,
                contract_data,
                counterparty_name,
                contract_status
              )
            )
          )
        `)
        .eq('user_id', user?.id)
        .ilike('payee_name', `%${contact.name}%`);

      if (!payeeError && payeeAgreements) {
        const hierarchyAgreements = payeeAgreements
          .map(p => p.writers?.original_publishers?.contracts)
          .filter(Boolean)
          .filter(contract => ['active', 'signed', 'draft'].includes(contract.contract_status));
        
        hierarchyAgreements.forEach(contract => {
          if (!allAgreements.find(a => a.id === contract.id)) {
            allAgreements.push({
              ...contract,
              territory_restrictions: (contract.contract_data as any)?.territory_restrictions || []
            });
          }
        });
      }

      console.log('Found agreements (all methods):', allAgreements);
      return allAgreements;
    } catch (error: any) {
      console.error('Error fetching client agreements:', error);
      return [];
    }
  };

  const getPayeeAgreements = async (payeeName: string) => {
    try {
      console.log('Looking for agreements through payee hierarchy for:', payeeName);

      // Find agreements through the payee hierarchy
      const { data: payeeData, error } = await supabase
        .from('payees')
        .select(`
          id,
          payee_name,
          writer_id,
          writers!inner(
            id,
            writer_name,
            original_publisher_id,
            original_publishers!inner(
              id,
              publisher_name,
              agreement_id,
              contracts!inner(
                id,
                title,
                commission_percentage,
                advance_amount,
                start_date,
                end_date,
                controlled_percentage,
                contract_data,
                counterparty_name,
                contract_status
              )
            )
          )
        `)
        .eq('user_id', user?.id)
        .or(`payee_name.eq.${payeeName},payee_name.ilike.%${payeeName}%`);

      if (error) throw error;

      const agreements = payeeData
        ?.map(p => p.writers?.original_publishers?.contracts)
        .filter(Boolean)
        .map(contract => ({
          ...contract,
          territory_restrictions: (contract.contract_data as any)?.territory_restrictions || []
        })) as AgreementTerms[];

      console.log('Found payee agreements:', agreements);
      return agreements || [];
    } catch (error: any) {
      console.error('Error fetching payee agreements:', error);
      return [];
    }
  };

  const getAgreementWriters = async (agreementId: string) => {
    try {
      const { data: writers, error } = await supabase
        .from('contract_interested_parties')
        .select(`
          id,
          name,
          performance_percentage,
          mechanical_percentage,
          synch_percentage,
          party_type
        `)
        .eq('contract_id', agreementId)
        .eq('party_type', 'writer');

      if (error) throw error;

      // Check which writers are controlled by cross-referencing with royalty allocations
      const writerNames = writers?.map(w => w.name) || [];
      const { data: controlledWriters, error: controlError } = await supabase
        .from('royalty_allocations')
        .select('work_id, controlled_status')
        .eq('user_id', user?.id)
        .eq('controlled_status', 'Controlled');

      if (controlError) throw controlError;

      // For now, assume all writers in agreements are controlled
      // TODO: Implement proper controlled writer mapping
      const controlledWriterNames = new Set(writerNames);

      return writers?.map(writer => ({
        id: writer.id,
        name: writer.name || '',
        performance_percentage: writer.performance_percentage || 0,
        mechanical_percentage: writer.mechanical_percentage || 0,
        synch_percentage: writer.synch_percentage || 0,
        controlled: controlledWriterNames.has(writer.name || '')
      })) as ContractWriter[] || [];
    } catch (error: any) {
      console.error('Error fetching agreement writers:', error);
      return [];
    }
  };

  const calculateAgreementBasedRoyalties = async (
    agreementId: string,
    clientId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<AgreementCalculationResult | null> => {
    setLoading(true);
    try {
      // Get agreement terms
      const { data: agreement, error: agreementError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (agreementError) throw agreementError;

      // Get controlled writers for this agreement
      const writers = await getAgreementWriters(agreementId);
      const controlledWriters = writers.filter(w => w.controlled);

      if (controlledWriters.length === 0) {
        toast({
          title: "No controlled writers",
          description: "This agreement has no controlled writers for calculation",
          variant: "destructive"
        });
        return null;
      }

      // Calculate royalties for controlled writers only
      const writerNames = controlledWriters.map(w => w.name);
      const { data: royalties, error: royaltyError } = await supabase
        .from('royalty_allocations')
        .select('gross_royalty_amount, net_amount')
        .eq('user_id', user?.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      if (royaltyError) throw royaltyError;

      // Apply agreement terms to calculations
      const grossRoyalties = royalties?.reduce((sum, r) => sum + (r.gross_royalty_amount || 0), 0) || 0;
      const commissionRate = agreement.commission_percentage || 0;
      const commissionDeduction = grossRoyalties * (commissionRate / 100);
      
      // Territory-specific adjustments (placeholder for future implementation)
      const territoryAdjustments: Record<string, number> = {
        'Worldwide': grossRoyalties
      };

      // Calculate expenses for controlled writers
      const { data: expenses, error: expenseError } = await supabase
        .from('payout_expenses')
        .select('amount, is_recoupable, expense_flags')
        .eq('user_id', user?.id)
        .eq('expense_status', 'approved')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      if (expenseError) throw expenseError;

      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const netRoyalties = grossRoyalties - commissionDeduction;
      const netPayable = netRoyalties - totalExpenses;

      // Calculate advance recoupment
      const advanceAmount = agreement.advance_amount || 0;
      const advanceRecoupment = Math.min(netPayable, advanceAmount);

      return {
        gross_royalties: grossRoyalties,
        net_royalties: netRoyalties,
        total_expenses: totalExpenses,
        net_payable: Math.max(0, netPayable - advanceRecoupment),
        advance_recoupment: advanceRecoupment,
        commission_deduction: commissionDeduction,
        territory_adjustments: territoryAdjustments,
        calculation_method: 'agreement_based',
        agreement_id: agreementId
      };

    } catch (error: any) {
      console.error('Error calculating agreement-based royalties:', error);
      toast({
        title: "Calculation Error",
        description: error.message || "Failed to calculate royalties",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateManualRoyalties = async (
    clientId: string,
    periodStart: string,
    periodEnd: string,
    manualSplits?: Record<string, number>,
    manualExpenses?: number
  ): Promise<AgreementCalculationResult | null> => {
    setLoading(true);
    try {
      // Use existing manual calculation logic from usePayouts
      const { data: royalties, error: royaltyError } = await supabase
        .from('royalty_allocations')
        .select('gross_royalty_amount, net_amount')
        .eq('user_id', user?.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      if (royaltyError) throw royaltyError;

      const grossRoyalties = royalties?.reduce((sum, r) => sum + (r.gross_royalty_amount || 0), 0) || 0;
      
      // Use manual expenses if provided, otherwise calculate from database
      let totalExpenses = manualExpenses || 0;
      if (!manualExpenses) {
        const { data: expenses, error: expenseError } = await supabase
          .from('payout_expenses')
          .select('amount')
          .eq('user_id', user?.id)
          .eq('expense_status', 'approved')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59');

        if (expenseError) throw expenseError;
        totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      }

      const netRoyalties = grossRoyalties;
      const netPayable = netRoyalties - totalExpenses;

      return {
        gross_royalties: grossRoyalties,
        net_royalties: netRoyalties,
        total_expenses: totalExpenses,
        net_payable: Math.max(0, netPayable),
        advance_recoupment: 0,
        commission_deduction: 0,
        territory_adjustments: {},
        calculation_method: 'manual'
      };

    } catch (error: any) {
      console.error('Error calculating manual royalties:', error);
      toast({
        title: "Calculation Error",
        description: error.message || "Failed to calculate royalties",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getClientAgreements,
    getPayeeAgreements,
    getAgreementWriters,
    calculateAgreementBasedRoyalties,
    calculateManualRoyalties
  };
}