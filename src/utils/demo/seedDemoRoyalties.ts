import { supabase } from '@/integrations/supabase/client';

export async function seedDemoRoyalties(userId: string, copyrightIds: string[]) {
  // Check if already seeded
  const { count } = await supabase
    .from('royalty_allocations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .ilike('comments', '%DEMO-AK%');

  if ((count ?? 0) >= 4) return;

  const allocations = [
    {
      user_id: userId,
      song_title: 'Empire State of Mind (Part II)',
      artist: 'Alicia Keys',
      gross_royalty_amount: 15000,
      gross_amount: 15000,
      net_amount: 11250,
      controlled_status: 'Controlled' as const,
      recoupable_expenses: true,
      quarter: 'Q3 2025',
      source: 'Demo Music Publishing',
      revenue_source: 'Sync Licensing',
      revenue_type: 'synchronization',
      media_type: 'TV Series',
      country: 'US',
      copyright_id: copyrightIds[4] ?? null,
      comments: 'DEMO-AK — Netflix sync license fee for "City Lights" S1E10',
      ownership_splits: { 'Alicia Keys': 50, 'Al Shuckburgh': 15, 'Demo Music Publishing': 35 },
    },
    {
      user_id: userId,
      song_title: 'No One',
      artist: 'Alicia Keys',
      gross_royalty_amount: 2845.60,
      gross_amount: 2845.60,
      net_amount: 2133.70,
      controlled_status: 'Controlled' as const,
      recoupable_expenses: true,
      quarter: 'Q4 2025',
      source: 'ASCAP',
      revenue_source: 'Performance',
      revenue_type: 'performance',
      media_type: 'Radio/Streaming',
      country: 'US',
      copyright_id: copyrightIds[1] ?? null,
      comments: 'DEMO-AK — Q4 2025 ASCAP performance royalties',
      ownership_splits: { 'Alicia Keys': 50, 'Kerry Brothers Jr.': 25, 'Demo Music Publishing': 25 },
    },
    {
      user_id: userId,
      song_title: 'If I Ain\'t Got You',
      artist: 'Alicia Keys',
      gross_royalty_amount: 1567.25,
      gross_amount: 1567.25,
      net_amount: 1175.44,
      controlled_status: 'Controlled' as const,
      recoupable_expenses: true,
      quarter: 'Q4 2025',
      source: 'Harry Fox Agency',
      revenue_source: 'Mechanical',
      revenue_type: 'mechanical',
      media_type: 'Digital',
      country: 'US',
      copyright_id: copyrightIds[0] ?? null,
      comments: 'DEMO-AK — Q4 2025 HFA mechanical royalties',
      ownership_splits: { 'Alicia Keys': 100, 'Demo Music Publishing': 0 },
    },
    {
      user_id: userId,
      song_title: 'Girl on Fire',
      artist: 'Alicia Keys',
      gross_royalty_amount: 3210.90,
      gross_amount: 3210.90,
      net_amount: 2087.09,
      controlled_status: 'Controlled' as const,
      recoupable_expenses: true,
      quarter: 'Q4 2025',
      source: 'Spotify',
      revenue_source: 'Streaming',
      revenue_type: 'streaming',
      media_type: 'Digital',
      country: 'US',
      copyright_id: copyrightIds[3] ?? null,
      comments: 'DEMO-AK — Q4 2025 Spotify streaming revenue',
      ownership_splits: { 'Alicia Keys': 65, 'Jeff Bhasker': 20, 'Salaam Remi': 15 },
    },
  ];

  const { error } = await supabase.from('royalty_allocations').insert(allocations as any);
  if (error) console.error('Demo royalty allocations insert error:', error);

  // Seed a royalties import staging record
  const { count: stagingCount } = await supabase
    .from('royalties_import_staging')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('detected_source', 'Demo Music Publishing');

  if ((stagingCount ?? 0) < 1) {
    const { error: stErr } = await supabase.from('royalties_import_staging').insert({
      user_id: userId,
      detected_source: 'Demo Music Publishing',
      original_filename: 'DMP_Q4_2025_Royalty_Statement.xlsx',
      processing_status: 'processed',
      mapping_version: 'v2',
      raw_data: {
        total_rows: 4,
        source: 'Demo Music Publishing',
        period: 'Q4 2025',
      },
      mapped_data: {
        total_gross: 22623.75,
        total_net: 16646.23,
        works_count: 4,
        period: 'Q4 2025',
        source: 'Demo Music Publishing',
        summary: {
          sync: 15000,
          performance: 2845.60,
          mechanical: 1567.25,
          streaming: 3210.90,
        },
      },
      validation_status: { hasErrors: false, hasUnmapped: false, isValid: true },
      unmapped_fields: [],
    } as any);
    if (stErr) console.error('Demo staging insert error:', stErr);
  }
}
