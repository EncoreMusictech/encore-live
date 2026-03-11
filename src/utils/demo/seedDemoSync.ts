import { supabase } from '@/integrations/supabase/client';

export async function seedDemoSyncLicenses(userId: string, copyrightIds: string[]) {
  // Check if already seeded
  const { count } = await supabase
    .from('sync_licenses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .ilike('notes', '%DEMO-AK%');

  if ((count ?? 0) >= 1) return;

  const linkedIds = copyrightIds.length >= 5 ? [copyrightIds[4]] : []; // Empire State of Mind (Part II)

  const { error } = await supabase.from('sync_licenses').insert({
    user_id: userId,
    project_title: 'Empire State of Mind (Part II) — Netflix Drama "City Lights"',
    media_type: 'TV Series',
    licensee_company: 'Netflix',
    licensee_name: 'Sarah Chen',
    licensee_email: 'sync-clearance@netflix.com',
    licensor_company: 'Demo Music Publishing',
    licensor_name: 'Demo User',
    licensor_email: 'demo@encoremusic.tech',
    synch_status: 'Licensed',
    license_status: 'Issued',
    invoice_status: 'Paid',
    pub_fee: 15000,
    master_fee: 15000,
    invoiced_amount: 30000,
    currency: 'USD',
    territories: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP'],
    territory: 'Worldwide',
    term_duration: '5 years',
    term_start: '2025-06-01',
    term_end: '2030-05-31',
    scene_description: 'Main character walks through NYC skyline during season finale montage',
    episode_season: 'S1E10',
    music_use: 'Background Vocal',
    music_prominence: 'Featured',
    rights_cleared: true,
    performance_rights_cleared: true,
    mechanical_rights_cleared: true,
    synchronization_rights_cleared: true,
    publishing_rights_cleared: true,
    master_rights_cleared: true,
    contract_execution_status: 'Fully Executed',
    contract_signed_date: '2025-05-15',
    payment_status: 'Received',
    payment_received: '2025-06-10',
    payment_method: 'Wire Transfer',
    linked_copyright_ids: linkedIds,
    controlled_writers: JSON.stringify([
      { name: 'Alicia Keys', share: 50, controlled: true },
      { name: 'Al Shuckburgh', share: 15, controlled: true },
      { name: 'Demo Music Publishing', share: 35, controlled: true },
    ]),
    fee_allocations: JSON.stringify({
      pub_fee_total: 15000,
      master_fee_total: 15000,
      controlled_pub_amount: 15000,
      controlled_master_amount: 15000,
      writers: [
        { name: 'Alicia Keys', pub_share: 7500, master_share: 7500 },
        { name: 'Al Shuckburgh', pub_share: 2250, master_share: 2250 },
        { name: 'Demo Music Publishing', pub_share: 5250, master_share: 5250 },
      ],
    }),
    notes: 'DEMO-AK — Netflix sync license for "Empire State of Mind (Part II)" in drama series "City Lights"',
    source: 'Inbound Request',
    request_received: '2025-04-01',
  } as any);

  if (error) console.error('Demo sync license insert error:', error);
}
