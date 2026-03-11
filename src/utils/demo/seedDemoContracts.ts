import { supabase } from '@/integrations/supabase/client';

export async function seedDemoContracts(userId: string, copyrightIds: string[]): Promise<string | null> {
  // Check if already seeded
  const { data: existing } = await supabase
    .from('contracts')
    .select('id')
    .eq('user_id', userId)
    .eq('agreement_id', 'AGR-2026010101')
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Create the contract
  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      user_id: userId,
      title: 'Alicia Keys — Co-Publishing Agreement',
      contract_type: 'publishing' as any,
      contract_status: 'signed' as any,
      counterparty_name: 'Alicia Keys',
      administrator: 'Demo Music Publishing',
      agreement_id: 'AGR-2026010101',
      advance_amount: 500000,
      commission_percentage: 25,
      start_date: '2024-01-01',
      end_date: '2029-12-31',
      territories: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP'],
      signature_status: 'fully_executed',
      recoupment_status: 'partially_recouped',
      distribution_cycle: 'quarterly',
      statement_delivery: 'electronic',
      notes: 'DEMO-AK — 5-year co-publishing deal covering 8 works. $500K advance at 25% commission.',
      contract_data: {
        agreement_type: 'co_publishing',
        publisher_share: 50,
        writer_share: 50,
        term_years: 5,
        option_periods: 2,
        retention_period_years: 10,
      },
      financial_terms: {
        advance: 500000,
        commission: 25,
        recoupment_rate: 75,
        minimum_delivery: 8,
        pipeline_advance: 100000,
      },
      royalty_splits: {
        performance: { writer: 50, publisher: 25, admin: 25 },
        mechanical: { writer: 50, publisher: 25, admin: 25 },
        sync: { writer: 50, publisher: 25, admin: 25 },
      },
    } as any)
    .select('id')
    .single();

  if (error || !contract) {
    console.error('Demo contract insert error:', error);
    return null;
  }

  const contractId = contract.id;

  // Insert interested parties
  const parties = [
    {
      contract_id: contractId,
      name: 'Alicia Keys',
      party_type: 'Writer',
      controlled_status: 'C',
      performance_percentage: 50,
      mechanical_percentage: 50,
      synch_percentage: 50,
      ipi_number: '00349382747',
      affiliation: 'ASCAP',
      email: 'management@aliciakeys.com',
    },
    {
      contract_id: contractId,
      name: 'Kerry Brothers Jr.',
      party_type: 'Writer',
      controlled_status: 'C',
      performance_percentage: 25,
      mechanical_percentage: 25,
      synch_percentage: 25,
      affiliation: 'BMI',
    },
    {
      contract_id: contractId,
      name: 'Demo Music Publishing',
      party_type: 'Publisher',
      controlled_status: 'C',
      performance_percentage: 25,
      mechanical_percentage: 25,
      synch_percentage: 25,
      email: 'demo@encoremusic.tech',
    },
  ];

  const { error: ipErr } = await supabase.from('contract_interested_parties').insert(parties as any);
  if (ipErr) console.error('Demo interested parties insert error:', ipErr);

  // Insert schedule of works (link copyrights to the contract)
  if (copyrightIds.length > 0) {
    const workTitles = [
      'If I Ain\'t Got You', 'No One', 'Fallin\'', 'Girl on Fire',
      'Empire State of Mind (Part II)', 'Unbreakable',
      'Try Sleeping with a Broken Heart', 'Superwoman',
    ];

    const scheduleWorks = copyrightIds.map((cId, i) => ({
      contract_id: contractId,
      copyright_id: cId,
      song_title: workTitles[i] ?? `Work ${i + 1}`,
      artist_name: 'Alicia Keys',
      inherits_controlled_status: true,
      inherits_royalty_splits: true,
    }));

    const { error: swErr } = await supabase.from('contract_schedule_works').insert(scheduleWorks as any);
    if (swErr) console.error('Demo schedule works insert error:', swErr);
  }

  return contractId;
}
