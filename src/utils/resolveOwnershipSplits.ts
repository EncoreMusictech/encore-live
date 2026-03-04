import { supabase } from '@/integrations/supabase/client';
import { isControlled } from './isControlled';

// ── Types ─────────────────────────────────────────────────────────────

export interface ResolvedParty {
  id: string;
  name: string;
  party_type: string;
  controlled_status: string;
  is_controlled: boolean;
  performance_percentage: number;
  mechanical_percentage: number;
  synch_percentage: number;
}

export interface ResolvedSplits {
  parties: ResolvedParty[];
  split_source: 'contract' | 'work';
  valid: boolean;
  errors: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────

const TOLERANCE = 0.01;

function normalizePercentage(val: number | null | undefined): number {
  return val ?? 0;
}

function validateSums(parties: ResolvedParty[]): string[] {
  if (parties.length === 0) return ['No parties found'];

  const errors: string[] = [];
  const perfSum = parties.reduce((s, p) => s + p.performance_percentage, 0);
  const mechSum = parties.reduce((s, p) => s + p.mechanical_percentage, 0);
  const synchSum = parties.reduce((s, p) => s + p.synch_percentage, 0);

  if (Math.abs(perfSum - 100) > TOLERANCE) {
    errors.push(`Performance split total is ${perfSum.toFixed(2)}%, expected 100%`);
  }
  if (Math.abs(mechSum - 100) > TOLERANCE) {
    errors.push(`Mechanical split total is ${mechSum.toFixed(2)}%, expected 100%`);
  }
  if (Math.abs(synchSum - 100) > TOLERANCE) {
    errors.push(`Synch split total is ${synchSum.toFixed(2)}%, expected 100%`);
  }

  return errors;
}

function mapToResolvedParties(rows: any[]): ResolvedParty[] {
  return rows.map(r => ({
    id: r.id ?? r.party_id ?? '',
    name: r.name ?? r.party_name ?? '',
    party_type: r.party_type ?? 'writer',
    controlled_status: r.controlled_status ?? 'NC',
    is_controlled: isControlled(r.controlled_status),
    performance_percentage: normalizePercentage(r.performance_percentage),
    mechanical_percentage: normalizePercentage(r.mechanical_percentage),
    synch_percentage: normalizePercentage(r.synch_percentage),
  }));
}

// ── Fetch helpers ─────────────────────────────────────────────────────

async function fetchContractParties(contractId: string): Promise<ResolvedParty[]> {
  const { data, error } = await supabase
    .from('contract_interested_parties')
    .select('id, name, party_type, controlled_status, performance_percentage, mechanical_percentage, synch_percentage')
    .eq('contract_id', contractId);

  if (error) {
    console.error('Error fetching contract parties:', error);
    return [];
  }
  return mapToResolvedParties(data || []);
}

async function fetchWorkParties(contractScheduleWorkId: string): Promise<ResolvedParty[]> {
  const { data, error } = await supabase
    .from('contract_work_interested_parties')
    .select('id, party_id, party_name, party_type, controlled_status, performance_percentage, mechanical_percentage, synch_percentage')
    .eq('contract_schedule_work_id', contractScheduleWorkId);

  if (error) {
    console.error('Error fetching work parties:', error);
    return [];
  }
  return mapToResolvedParties(data || []);
}

async function checkInheritsFlag(contractScheduleWorkId: string): Promise<boolean | null> {
  const { data, error } = await supabase
    .from('contract_schedule_works')
    .select('inherits_royalty_splits')
    .eq('id', contractScheduleWorkId)
    .maybeSingle();

  if (error || !data) return null;
  return data.inherits_royalty_splits ?? null;
}

// ── Main resolver ─────────────────────────────────────────────────────

export async function resolveOwnershipSplits(
  contractId: string,
  contractScheduleWorkId?: string | null,
): Promise<ResolvedSplits> {
  // No work ID → contract-level splits
  if (!contractScheduleWorkId) {
    const parties = await fetchContractParties(contractId);
    const errors = validateSums(parties);
    return { parties, split_source: 'contract', valid: errors.length === 0, errors };
  }

  // Work ID exists → check inherits flag
  const inherits = await checkInheritsFlag(contractScheduleWorkId);

  if (inherits === true) {
    // Explicitly inherits → use contract-level
    const parties = await fetchContractParties(contractId);
    const errors = validateSums(parties);
    return { parties, split_source: 'contract', valid: errors.length === 0, errors };
  }

  // inherits is false or null → try work-level overrides
  const workParties = await fetchWorkParties(contractScheduleWorkId);

  if (workParties.length > 0) {
    const errors = validateSums(workParties);
    return { parties: workParties, split_source: 'work', valid: errors.length === 0, errors };
  }

  // No work-level rows → fallback to contract-level
  const parties = await fetchContractParties(contractId);
  const errors = validateSums(parties);
  return { parties, split_source: 'contract', valid: errors.length === 0, errors };
}
