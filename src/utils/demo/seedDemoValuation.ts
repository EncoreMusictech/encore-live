import { supabase } from '@/integrations/supabase/client';

export async function seedDemoCatalogValuation(userId: string) {
  // Check if already seeded
  const { count } = await supabase
    .from('catalog_valuations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('artist_name', 'Alicia Keys');

  if ((count ?? 0) >= 1) return;

  // 1. Catalog valuation
  const { error: valErr } = await supabase.from('catalog_valuations').insert({
    user_id: userId,
    artist_name: 'Alicia Keys',
    valuation_amount: 12500000,
    valuation_methodology: 'blended',
    valuation_methodology_v2: 'blended_v2',
    dcf_valuation: 11800000,
    multiple_valuation: 13200000,
    blended_valuation: 12500000,
    risk_adjusted_value: 11900000,
    confidence_score: 87,
    total_streams: 8500000000,
    monthly_listeners: 28000000,
    genre: 'R&B',
    popularity_score: 82,
    catalog_age_years: 23,
    ltm_revenue: 950000,
    discount_rate: 10,
    currency: 'USD',
    top_tracks: JSON.stringify([
      { name: 'If I Ain\'t Got You', streams: 1800000000, popularity: 78 },
      { name: 'No One', streams: 1500000000, popularity: 75 },
      { name: 'Fallin\'', streams: 1200000000, popularity: 72 },
      { name: 'Girl on Fire', streams: 1100000000, popularity: 80 },
      { name: 'Empire State of Mind (Part II)', streams: 900000000, popularity: 68 },
    ]),
    comparable_multiples: JSON.stringify({
      genre_avg: 12.5,
      comparable_deals: [
        { artist: 'John Legend', multiple: 14.0, year: 2024 },
        { artist: 'Mary J. Blige', multiple: 11.5, year: 2023 },
        { artist: 'Usher', multiple: 13.0, year: 2024 },
      ],
    }),
    growth_assumptions: JSON.stringify({
      streaming_growth: 0.05,
      sync_growth: 0.08,
      performance_growth: 0.03,
      terminal_growth: 0.02,
    }),
    cash_flow_projections: JSON.stringify([
      { year: 2026, revenue: 997500, expenses: 149625, net: 847875 },
      { year: 2027, revenue: 1047375, expenses: 157106, net: 890269 },
      { year: 2028, revenue: 1099744, expenses: 164962, net: 934782 },
      { year: 2029, revenue: 1154731, expenses: 173210, net: 981521 },
      { year: 2030, revenue: 1212467, expenses: 181870, net: 1030597 },
    ]),
    revenue_diversification_score: 78,
    has_additional_revenue: true,
    total_additional_revenue: 450000,
  } as any);

  if (valErr) console.error('Demo catalog valuation insert error:', valErr);

  // 2. Deal historical statements (8 quarters)
  const { count: stmtCount } = await supabase
    .from('deal_historical_statements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('artist_name', 'Alicia Keys');

  if ((stmtCount ?? 0) < 8) {
    const quarters = [
      { year: 2024, quarter: 1, gross: 210000, net: 178500, streams: 520000000, perf: 65000, mech: 38000, sync: 45000, streaming: 62000 },
      { year: 2024, quarter: 2, gross: 225000, net: 191250, streams: 540000000, perf: 68000, mech: 40000, sync: 50000, streaming: 67000 },
      { year: 2024, quarter: 3, gross: 238000, net: 202300, streams: 560000000, perf: 72000, mech: 42000, sync: 52000, streaming: 72000 },
      { year: 2024, quarter: 4, gross: 252000, net: 214200, streams: 580000000, perf: 76000, mech: 44000, sync: 55000, streaming: 77000 },
      { year: 2025, quarter: 1, gross: 245000, net: 208250, streams: 570000000, perf: 74000, mech: 43000, sync: 53000, streaming: 75000 },
      { year: 2025, quarter: 2, gross: 260000, net: 221000, streams: 595000000, perf: 78000, mech: 45000, sync: 58000, streaming: 79000 },
      { year: 2025, quarter: 3, gross: 275000, net: 233750, streams: 610000000, perf: 82000, mech: 47000, sync: 62000, streaming: 84000 },
      { year: 2025, quarter: 4, gross: 290000, net: 246500, streams: 630000000, perf: 86000, mech: 49000, sync: 67000, streaming: 88000 },
    ];

    const stmtInserts = quarters.map(q => ({
      user_id: userId,
      artist_name: 'Alicia Keys',
      year: q.year,
      quarter: q.quarter,
      period_label: `Q${q.quarter} ${q.year}`,
      statement_type: 'publishing',
      gross_revenue: q.gross,
      net_revenue: q.net,
      streams: q.streams,
      performance_royalties: q.perf,
      mechanical_royalties: q.mech,
      sync_revenue: q.sync,
      streaming_revenue: q.streaming,
      expenses: q.gross - q.net,
      source_detected: 'Demo Music Publishing',
      catalog_name: 'Alicia Keys Catalog',
    }));

    const { error: stErr } = await supabase.from('deal_historical_statements').insert(stmtInserts as any);
    if (stErr) console.error('Demo historical statements insert error:', stErr);
  }

  // 3. Deal scenario
  const { count: scenarioCount } = await supabase
    .from('deal_scenarios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('artist_name', 'Alicia Keys');

  if ((scenarioCount ?? 0) < 1) {
    const { error: scErr } = await supabase.from('deal_scenarios').insert({
      user_id: userId,
      artist_id: 'demo-alicia-keys',
      artist_name: 'Alicia Keys',
      scenario_name: 'Alicia Keys — Netflix Sync Deal Analysis',
      selected_tracks: JSON.stringify([
        { name: 'Empire State of Mind (Part II)', popularity: 68, estimated_streams: 900000000 },
        { name: 'Girl on Fire', popularity: 80, estimated_streams: 1100000000 },
        { name: 'No One', popularity: 75, estimated_streams: 1500000000 },
      ]),
      deal_terms: JSON.stringify({
        deal_type: 'licensing',
        upfront_advance: 500000,
        revenue_share: 75,
        term_length: 5,
        recoupment_rate: 75,
        ownership_percentage: 100,
        discount_rate: 10,
        catalog_age: 23,
      }),
      projections: JSON.stringify({
        year1: { gross: 290000, net: 246500, roi: -50.7 },
        year2: { gross: 304500, net: 258825, roi: -0.9 },
        year3: { gross: 319725, net: 271766, roi: 53.4 },
        year4: { gross: 335711, net: 285355, roi: 110.5 },
        year5: { gross: 352497, net: 299622, roi: 170.3 },
        total_net: 1362068,
        payback_period_years: 2.1,
        irr: 28.5,
      }),
    } as any);
    if (scErr) console.error('Demo deal scenario insert error:', scErr);
  }
}
