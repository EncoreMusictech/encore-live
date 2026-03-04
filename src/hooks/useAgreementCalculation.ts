import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { normalizeTerritoryCode } from '@/utils/territoryNormalizer';
import { isControlled } from '@/utils/isControlled';
import { resolveOwnershipSplits, ResolvedSplits } from '@/utils/resolveOwnershipSplits';

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
  split_source: 'contract' | 'work';
  calculated_amount: number;
  is_controlled: boolean;
}

export interface ReconciliationEntry {
  allocation_id: string;
  reason: string;
  gross_amount: number;
  revenue_type: string | null;
  country: string | null;
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
  // ── reconciliation tracking ──
  excluded_total: number;
  unpayable_total: number;
  needs_review_total: number;
  excluded_allocations: ReconciliationEntry[];
  unpayable_allocations: ReconciliationEntry[];
  needs_review_allocations: ReconciliationEntry[];
  // ── backward-compat fields used by PayoutForm / PayoutList ──
  net_royalties: number;
  commission_deduction: number;
  territory_adjustments: Record<string, number>;
  royalties_to_date: number;
  payments_to_date: number;
  amount_due: number;
}

// ── Revenue-type → split field map ────────────────────────────────────

const SPLIT_FIELD_MAP: Record<string, string> = {
  performance: 'performance_percentage',
  mechanical: 'mechanical_percentage',
  synch: 'synch_percentage',
};

// ── Copyright → Work map builder ──────────────────────────────────────

interface ScheduleWork {
  id: string;
  copyright_id: string | null;
  inherits_royalty_splits: boolean | null;
  created_at: string;
}

function buildCopyrightToWorkMap(works: ScheduleWork[]): Map<string, string> {
  const map = new Map<string, string>();
  const seen = new Map<string, ScheduleWork>();

  for (const work of works) {
    if (!work.copyright_id) continue;
    const existing = seen.get(work.copyright_id);
    if (!existing) {
      seen.set(work.copyright_id, work);
      map.set(work.copyright_id, work.id);
    } else {
      // Deterministic: prefer inherits_royalty_splits = false, then latest created_at
      console.warn(`Duplicate copyright_id ${work.copyright_id} in schedule works for same contract. Applying deterministic resolution.`);
      const preferNew =
        (work.inherits_royalty_splits === false && existing.inherits_royalty_splits !== false) ||
        (work.inherits_royalty_splits === existing.inherits_royalty_splits &&
          new Date(work.created_at) > new Date(existing.created_at));
      if (preferNew) {
        seen.set(work.copyright_id, work);
        map.set(work.copyright_id, work.id);
      }
    }
  }

  return map;
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

  // ── Fetch ALL interested parties (not just writers) ────────────────

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
    if (!contractTerritories || contractTerritories.length === 0) return true;
    if (!allocationCountry) return true;

    const normalised = normalizeTerritoryCode(allocationCountry);
    if (contractTerritories.some(t => t.toUpperCase() === 'WORLDWIDE' || t.toUpperCase() === 'WW')) {
      return true;
    }
    return contractTerritories.some(t => normalizeTerritoryCode(t) === normalised);
  };

  // ── Ownership-split calculation ────────────────────────────────────

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

      // Reconciliation tracking arrays
      const excludedAllocations: ReconciliationEntry[] = [];
      const unpayableAllocations: ReconciliationEntry[] = [];
      const needsReviewAllocations: ReconciliationEntry[] = [];
      let excludedTotal = 0;
      let unpayableTotal = 0;
      let needsReviewTotal = 0;

      // Commission deduction (only for commission-only model)
      let commissionDeduction = 0;

      if (dealModel === 'ownership_split') {
        // Quick contract-level check for controlled parties
        const { data: contractParties } = await supabase
          .from('contract_interested_parties')
          .select('controlled_status')
          .eq('contract_id', agreementId);

        const hasControlled = (contractParties || []).some(p => isControlled(p.controlled_status));
        if (!hasControlled) {
          toast({
            title: 'No controlled parties',
            description: 'This agreement has no controlled parties for calculation',
            variant: 'destructive',
          });
          return null;
        }
      }

      // 2. Fetch schedule works filtered by contract_id [FIX 2]
      const { data: scheduleWorks } = await supabase
        .from('contract_schedule_works')
        .select('id, copyright_id, inherits_royalty_splits, created_at')
        .eq('contract_id', agreementId)
        .not('copyright_id', 'is', null);

      const copyrightToWorkMap = buildCopyrightToWorkMap(
        (scheduleWorks || []) as ScheduleWork[],
      );
      const copyrightIds = Array.from(copyrightToWorkMap.keys());

      // Split cache keyed by ${contractId}:${workId} or ${contractId}:contract [FIX 3]
      const splitCache = new Map<string, ResolvedSplits>();

      async function getCachedSplits(contractId: string, workId?: string | null): Promise<ResolvedSplits> {
        const key = workId ? `${contractId}:${workId}` : `${contractId}:contract`;
        if (splitCache.has(key)) return splitCache.get(key)!;
        const result = await resolveOwnershipSplits(contractId, workId);
        splitCache.set(key, result);
        return result;
      }

      // 3. Fetch scoped allocations
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

      // 4. Calculate based on deal model
      let grossRoyalties = 0;
      let territoryExclusions = 0;
      const partyBreakdowns: PartyBreakdown[] = [];

      if (dealModel === 'ownership_split') {
        for (const allocation of royalties || []) {
          const gross = allocation.gross_royalty_amount || 0;
          grossRoyalties += gross;

          // Territory check
          if (!isTerritoryEligible(allocation.country, territories)) {
            territoryExclusions += gross;
            continue;
          }

          const allocEntry = {
            allocation_id: allocation.id,
            gross_amount: gross,
            revenue_type: allocation.revenue_type,
            country: allocation.country,
          };

          // ── Stop conditions [FIX 4] ──
          // When met, add to list and continue without allocating

          if (!allocation.revenue_type) {
            unpayableAllocations.push({ ...allocEntry, reason: 'missing_revenue_type' });
            unpayableTotal += gross;
            continue;
          }

          if (allocation.revenue_type === 'other') {
            needsReviewAllocations.push({ ...allocEntry, reason: 'revenue_type_other' });
            needsReviewTotal += gross;
            continue;
          }

          if (allocation.revenue_type_confidence === 'low') {
            needsReviewAllocations.push({ ...allocEntry, reason: 'low_confidence' });
            needsReviewTotal += gross;
            continue;
          }

          if (allocation.rights_basis === 'exclude_from_splits') {
            excludedAllocations.push({ ...allocEntry, reason: 'excluded_rights_basis' });
            excludedTotal += gross;
            continue;
          }

          if (allocation.line_type && allocation.line_type !== 'royalty') {
            excludedAllocations.push({ ...allocEntry, reason: 'non_royalty_line_type' });
            excludedTotal += gross;
            continue;
          }

          // Look up work from copyright
          const workId = allocation.copyright_id
            ? copyrightToWorkMap.get(allocation.copyright_id) ?? null
            : null;

          // Resolve splits (cached)
          const splits = await getCachedSplits(agreementId, workId);

          if (!splits.valid) {
            unpayableAllocations.push({ ...allocEntry, reason: 'invalid_split_totals' });
            unpayableTotal += gross;
            continue;
          }

          // ── Allocate per-party ──
          let uncontrolledTotal = 0;
          const revenueType = allocation.revenue_type;
          const splitField = SPLIT_FIELD_MAP[revenueType] || 'performance_percentage';

          for (const party of splits.parties) {
            const splitPct = (party as any)[splitField] || 0;
            const calculatedAmount = gross * (splitPct / 100);
            const partyIsControlled = party.is_controlled;
            const payableAmount = partyIsControlled ? calculatedAmount : 0;

            if (!partyIsControlled) {
              uncontrolledTotal += calculatedAmount; // [FIX 7]
            }

            partyBreakdowns.push({
              party_id: party.id,
              party_name: party.name,
              party_type: party.party_type,
              revenue_type: revenueType,
              gross_share: calculatedAmount,
              recoupment_applied: 0,
              net_payable: payableAmount,
              controlled_status: party.controlled_status,
              split_percentage: splitPct,
              split_source: splits.split_source,
              calculated_amount: calculatedAmount,
              is_controlled: partyIsControlled,
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

      // 6. Recoupment
      let advanceRecoupment = 0;
      if (dealModel === 'ownership_split') {
        const { data: ledger } = await supabase
          .from('entity_advance_ledger')
          .select('balance_remaining')
          .eq('contract_id', agreementId)
          .maybeSingle();

        const remainingAdvance = ledger?.balance_remaining || 0;

        if (remainingAdvance > 0) {
          const totalControlledPayable = partyBreakdowns
            .filter(pb => pb.is_controlled)
            .reduce((s, pb) => s + pb.net_payable, 0);

          let recoupedSoFar = 0;
          for (const pb of partyBreakdowns) {
            if (!pb.is_controlled) continue;
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
        .filter(pb => pb.is_controlled)
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
        unallocatable_amount: unpayableTotal,
        party_breakdowns: partyBreakdowns,
        calculation_method: 'agreement_based',
        agreement_id: agreementId,
        contract_deal_model: dealModel,
        // reconciliation
        excluded_total: excludedTotal,
        unpayable_total: unpayableTotal,
        needs_review_total: needsReviewTotal,
        excluded_allocations: excludedAllocations,
        unpayable_allocations: unpayableAllocations,
        needs_review_allocations: needsReviewAllocations,
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
        excluded_total: 0,
        unpayable_total: 0,
        needs_review_total: 0,
        excluded_allocations: [],
        unpayable_allocations: [],
        needs_review_allocations: [],
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
