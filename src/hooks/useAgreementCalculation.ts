import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { normalizeTerritoryCode } from '@/utils/territoryNormalizer';

// ── Interfaces ────────────────────────────────────────────────────────

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
  contract_deal_model?: string;
}

/** Replaces the old ContractWriter – includes all party types */
export interface ContractParty {
  id: string;
  name: string;
  party_type: string;
  performance_percentage: number;
  mechanical_percentage: number;
  synch_percentage: number;
  controlled_status: string; // 'C', 'NC', etc.
  /** @deprecated kept for backward-compat in AgreementTermsPreview */
  controlled: boolean;
}

/** Backward-compatible alias */
export type ContractWriter = ContractParty;

export interface PartyBreakdown {
  party_id: string;
  party_name: string;
  party_type: string;
  revenue_type: string;
  gross_share: number;
  recoupment_applied: number;
  net_payable: number;
  controlled_status: string;
  split_percentage: number;
}

export interface AgreementCalculationResult {
  gross_royalties: number;
  total_expenses: number;
  net_payable: number;
  advance_recoupment: number;
  territory_exclusions: number;
  unallocatable_amount: number;
  party_breakdowns: PartyBreakdown[];
  calculation_method: 'agreement_based' | 'manual';
  agreement_id?: string;
  contract_deal_model: string;
  // ── backward-compat fields used by PayoutForm / PayoutList ──
  net_royalties: number;
  commission_deduction: number;
  territory_adjustments: Record<string, number>;
  royalties_to_date: number;
  payments_to_date: number;
  amount_due: number;
}

// ── Revenue-type → split field map ────────────────────────────────────

const SPLIT_FIELD_MAP: Record<string, keyof ContractParty> = {
  performance: 'performance_percentage',
  mechanical: 'mechanical_percentage',
  synch: 'synch_percentage',
};

function getPartySplitForRevenueType(party: ContractParty, revenueType: string): number {
  const field = SPLIT_FIELD_MAP[revenueType];
  if (field) return (party[field] as number) || 0;
  // 'other' – average of all three as a fallback
  return (
    ((party.performance_percentage || 0) +
      (party.mechanical_percentage || 0) +
      (party.synch_percentage || 0)) /
    3
  );
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useAgreementCalculation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // ── Fetch agreements for a client (by contact id) ──────────────────

  const getClientAgreements = async (clientId: string) => {
    try {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', clientId)
        .single();

      if (contactError) throw contactError;

      let allAgreements: AgreementTerms[] = [];

      // Direct contract match
      const { data: directAgreements, error: directError } = await supabase
        .from('contracts')
        .select(`
          id, title, commission_percentage, advance_amount,
          start_date, end_date, controlled_percentage,
          contract_data, counterparty_name, contract_status,
          contract_deal_model
        `)
        .eq('user_id', user?.id)
        .or(`counterparty_name.eq.${contact.name},counterparty_name.ilike.%${contact.name}%`)
        .in('contract_status', ['active', 'signed', 'draft']);

      if (!directError && directAgreements) {
        allAgreements.push(
          ...directAgreements.map(a => ({
            ...a,
            territory_restrictions: (a.contract_data as any)?.territory_restrictions || [],
          })),
        );
      }

      // Payee hierarchy lookup
      const { data: payeeAgreements, error: payeeError } = await supabase
        .from('payees')
        .select(`
          writer_id,
          writers!inner(
            original_publisher_id,
            original_publishers!inner(
              agreement_id,
              contracts!inner(
                id, title, commission_percentage, advance_amount,
                start_date, end_date, controlled_percentage,
                contract_data, counterparty_name, contract_status,
                contract_deal_model
              )
            )
          )
        `)
        .eq('user_id', user?.id)
        .ilike('payee_name', `%${contact.name}%`);

      if (!payeeError && payeeAgreements) {
        payeeAgreements
          .map(p => p.writers?.original_publishers?.contracts)
          .filter(Boolean)
          .filter(c => ['active', 'signed', 'draft'].includes(c.contract_status))
          .forEach(contract => {
            if (!allAgreements.find(a => a.id === contract.id)) {
              allAgreements.push({
                ...contract,
                territory_restrictions: (contract.contract_data as any)?.territory_restrictions || [],
              });
            }
          });
      }

      return allAgreements;
    } catch (error: any) {
      console.error('Error fetching client agreements:', error);
      return [];
    }
  };

  const getPayeeAgreements = async (payeeName: string) => {
    try {
      const { data: payeeData, error } = await supabase
        .from('payees')
        .select(`
          id, payee_name, writer_id,
          writers!inner(
            id, writer_name, original_publisher_id,
            original_publishers!inner(
              id, publisher_name, agreement_id,
              contracts!inner(
                id, title, commission_percentage, advance_amount,
                start_date, end_date, controlled_percentage,
                contract_data, counterparty_name, contract_status,
                contract_deal_model
              )
            )
          )
        `)
        .eq('user_id', user?.id)
        .or(`payee_name.eq.${payeeName},payee_name.ilike.%${payeeName}%`);

      if (error) throw error;

      return (
        payeeData
          ?.map(p => p.writers?.original_publishers?.contracts)
          .filter(Boolean)
          .map(contract => ({
            ...contract,
            territory_restrictions: (contract.contract_data as any)?.territory_restrictions || [],
          })) as AgreementTerms[]
      ) || [];
    } catch (error: any) {
      console.error('Error fetching payee agreements:', error);
      return [];
    }
  };

  // ── Phase 4a: Fetch ALL interested parties (not just writers) ──────

  const getAgreementParties = async (agreementId: string): Promise<ContractParty[]> => {
    try {
      const { data: parties, error } = await supabase
        .from('contract_interested_parties')
        .select(`
          id, name,
          performance_percentage, mechanical_percentage, synch_percentage,
          party_type, controlled_status
        `)
        .eq('contract_id', agreementId);

      if (error) throw error;

      return (
        parties?.map(p => ({
          id: p.id,
          name: p.name || '',
          party_type: p.party_type || 'writer',
          performance_percentage: p.performance_percentage || 0,
          mechanical_percentage: p.mechanical_percentage || 0,
          synch_percentage: p.synch_percentage || 0,
          controlled_status: p.controlled_status || 'NC',
          controlled: p.controlled_status === 'C',
        })) || []
      );
    } catch (error: any) {
      console.error('Error fetching agreement parties:', error);
      return [];
    }
  };

  /** @deprecated Use getAgreementParties – kept for backward compat */
  const getAgreementWriters = getAgreementParties;

  // ── Territory eligibility check ────────────────────────────────────

  const isTerritoryEligible = (
    allocationCountry: string | null | undefined,
    contractTerritories: string[] | null | undefined,
  ): boolean => {
    // Empty/null territories = worldwide (all eligible)
    if (!contractTerritories || contractTerritories.length === 0) return true;
    if (!allocationCountry) return true; // can't exclude without data

    const normalised = normalizeTerritoryCode(allocationCountry);
    // Check for "Worldwide" / "WW" marker
    if (contractTerritories.some(t => t.toUpperCase() === 'WORLDWIDE' || t.toUpperCase() === 'WW')) {
      return true;
    }
    return contractTerritories.some(t => normalizeTerritoryCode(t) === normalised);
  };

  // ── Phase 4d: Ownership-split calculation ──────────────────────────

  const calculateAgreementBasedRoyalties = async (
    agreementId: string,
    clientId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<AgreementCalculationResult | null> => {
    setLoading(true);
    try {
      // 1. Fetch contract
      const { data: agreement, error: agreementError } = await supabase
        .from('contracts')
        .select('*, contract_deal_model')
        .eq('id', agreementId)
        .single();

      if (agreementError) throw agreementError;

      const dealModel: string = agreement.contract_deal_model || 'ownership_split';
      const territories: string[] =
        agreement.territories || (agreement.contract_data as any)?.territory_restrictions || [];

      // 2. Fetch interested parties
      const parties = await getAgreementParties(agreementId);
      const controlledParties = parties.filter(p => p.controlled_status === 'C');

      if (controlledParties.length === 0 && dealModel === 'ownership_split') {
        toast({
          title: 'No controlled parties',
          description: 'This agreement has no controlled parties for calculation',
          variant: 'destructive',
        });
        return null;
      }

      // 3. Fetch scoped allocations (linked via contract_schedule_works / copyright_id)
      const { data: scheduleWorks } = await supabase
        .from('contract_schedule_works')
        .select('copyright_id')
        .eq('contract_id', agreementId)
        .not('copyright_id', 'is', null);

      const copyrightIds = scheduleWorks?.map(sw => sw.copyright_id).filter(Boolean) || [];

      let royaltiesQuery = supabase
        .from('royalty_allocations')
        .select('id, gross_royalty_amount, net_amount, revenue_type, country, copyright_id')
        .eq('user_id', user?.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      // Scope to contract works if possible
      if (copyrightIds.length > 0) {
        royaltiesQuery = royaltiesQuery.in('copyright_id', copyrightIds);
      }

      const { data: royalties, error: royaltyError } = await royaltiesQuery;
      if (royaltyError) throw royaltyError;

      // 4. Calculate based on deal model
      let grossRoyalties = 0;
      let territoryExclusions = 0;
      let unallocatableAmount = 0;
      let commissionDeduction = 0;
      const partyBreakdowns: PartyBreakdown[] = [];

      if (dealModel === 'ownership_split') {
        // ── Ownership-split model ──
        for (const allocation of royalties || []) {
          const gross = allocation.gross_royalty_amount || 0;
          grossRoyalties += gross;

          // Territory check
          if (!isTerritoryEligible(allocation.country, territories)) {
            territoryExclusions += gross;
            continue;
          }

          // Revenue type check
          const revenueType = allocation.revenue_type;
          if (!revenueType) {
            unallocatableAmount += gross;
            continue;
          }

          // Apply per-party splits
          for (const party of parties) {
            const splitPct = getPartySplitForRevenueType(party, revenueType);
            const partyGrossShare = gross * (splitPct / 100);

            partyBreakdowns.push({
              party_id: party.id,
              party_name: party.name,
              party_type: party.party_type,
              revenue_type: revenueType,
              gross_share: partyGrossShare,
              recoupment_applied: 0, // Phase 8
              net_payable: party.controlled_status === 'C' ? partyGrossShare : 0,
              controlled_status: party.controlled_status,
              split_percentage: splitPct,
            });
          }
        }
      } else {
        // ── Commission-only model ──
        grossRoyalties = (royalties || []).reduce((s, r) => s + (r.gross_royalty_amount || 0), 0);
        const commissionRate = agreement.commission_percentage || 0;
        commissionDeduction = grossRoyalties * (commissionRate / 100);
      }

      // 5. Expenses
      const { data: expenses } = await supabase
        .from('payout_expenses')
        .select('amount, is_recoupable, expense_flags')
        .eq('user_id', user?.id)
        .eq('expense_status', 'approved')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      const totalExpenses =
        expenses?.reduce((sum, e) => {
          const isRecoupable =
            e.is_recoupable || (e.expense_flags as any)?.recoupable === true;
          return sum + (isRecoupable ? e.amount : 0);
        }, 0) || 0;

      // 6. Recoupment (Phase 8 – per-party using entity_advance_ledger)
      let advanceRecoupment = 0;
      if (dealModel === 'ownership_split') {
        // Get remaining advance balance from ledger
        const { data: ledger } = await supabase
          .from('entity_advance_ledger')
          .select('balance_remaining')
          .eq('contract_id', agreementId)
          .maybeSingle();

        const remainingAdvance = ledger?.balance_remaining || 0;

        if (remainingAdvance > 0) {
          // Apply recoupment proportionally to controlled parties
          const totalControlledPayable = partyBreakdowns
            .filter(pb => pb.controlled_status === 'C')
            .reduce((s, pb) => s + pb.net_payable, 0);

          let recoupedSoFar = 0;
          for (const pb of partyBreakdowns) {
            if (pb.controlled_status !== 'C') continue;
            const partyRecoup = Math.min(
              pb.net_payable,
              remainingAdvance * (pb.net_payable / (totalControlledPayable || 1)),
            );
            pb.recoupment_applied = partyRecoup;
            pb.net_payable = Math.max(0, pb.net_payable - partyRecoup);
            recoupedSoFar += partyRecoup;
          }
          advanceRecoupment = recoupedSoFar;
        }
      } else {
        const advanceAmount = agreement.advance_amount || 0;
        const netAfterCommission = grossRoyalties - commissionDeduction;
        advanceRecoupment = Math.min(Math.max(0, netAfterCommission), advanceAmount);
      }

      // 7. Totals
      const controlledNetPayable = partyBreakdowns
        .filter(pb => pb.controlled_status === 'C')
        .reduce((s, pb) => s + pb.net_payable, 0);

      const netPayable =
        dealModel === 'ownership_split'
          ? Math.max(0, controlledNetPayable - totalExpenses)
          : Math.max(0, grossRoyalties - commissionDeduction - totalExpenses - advanceRecoupment);

      return {
        gross_royalties: grossRoyalties,
        total_expenses: totalExpenses,
        net_payable: netPayable,
        advance_recoupment: advanceRecoupment,
        territory_exclusions: territoryExclusions,
        unallocatable_amount: unallocatableAmount,
        party_breakdowns: partyBreakdowns,
        calculation_method: 'agreement_based',
        agreement_id: agreementId,
        contract_deal_model: dealModel,
        // backward-compat
        net_royalties: grossRoyalties - commissionDeduction,
        commission_deduction: commissionDeduction,
        territory_adjustments: territoryExclusions > 0 ? { 'Excluded': territoryExclusions } : {},
        royalties_to_date: grossRoyalties,
        payments_to_date: 0,
        amount_due: netPayable,
      };
    } catch (error: any) {
      console.error('Error calculating agreement-based royalties:', error);
      toast({
        title: 'Calculation Error',
        description: error.message || 'Failed to calculate royalties',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Manual calculation (no agreement) ──────────────────────────────

  const calculateManualRoyalties = async (
    clientId: string,
    periodStart: string,
    periodEnd: string,
    manualSplits?: Record<string, number>,
    manualExpenses?: number,
  ): Promise<AgreementCalculationResult | null> => {
    setLoading(true);
    try {
      const { data: royalties, error: royaltyError } = await supabase
        .from('royalty_allocations')
        .select('gross_royalty_amount, net_amount')
        .eq('user_id', user?.id)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      if (royaltyError) throw royaltyError;

      const grossRoyalties = royalties?.reduce((sum, r) => sum + (r.gross_royalty_amount || 0), 0) || 0;

      let totalExpenses = manualExpenses || 0;
      if (!manualExpenses) {
        const { data: expenses } = await supabase
          .from('payout_expenses')
          .select('amount')
          .eq('user_id', user?.id)
          .eq('expense_status', 'approved')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59');

        totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      }

      const netPayable = Math.max(0, grossRoyalties - totalExpenses);

      return {
        gross_royalties: grossRoyalties,
        total_expenses: totalExpenses,
        net_payable: netPayable,
        advance_recoupment: 0,
        territory_exclusions: 0,
        unallocatable_amount: 0,
        party_breakdowns: [],
        calculation_method: 'manual',
        contract_deal_model: 'manual',
        // backward-compat
        net_royalties: grossRoyalties,
        commission_deduction: 0,
        territory_adjustments: {},
        royalties_to_date: grossRoyalties,
        payments_to_date: 0,
        amount_due: netPayable,
      };
    } catch (error: any) {
      console.error('Error calculating manual royalties:', error);
      toast({
        title: 'Calculation Error',
        description: error.message || 'Failed to calculate royalties',
        variant: 'destructive',
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
    getAgreementParties,
    getAgreementWriters, // backward-compat alias
    calculateAgreementBasedRoyalties,
    calculateManualRoyalties,
  };
}
