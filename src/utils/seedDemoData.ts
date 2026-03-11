import { supabase } from '@/integrations/supabase/client';
import { seedDemoCopyrights } from './demo/seedDemoCopyrights';
import { seedDemoContracts } from './demo/seedDemoContracts';
import { seedDemoSyncLicenses } from './demo/seedDemoSync';
import { seedDemoRoyalties } from './demo/seedDemoRoyalties';
import { seedDemoPayeeHierarchy } from './demo/seedDemoPayees';
import { seedDemoCatalogValuation } from './demo/seedDemoValuation';

/**
 * Seeds demo-specific data for the demo account.
 * Idempotent — skips if data already exists.
 */
export async function seedDemoData(userId: string) {
  try {
    // Phase 1: Notifications + Messages (independent)
    await Promise.all([
      seedDemoNotifications(userId),
      seedDemoMessages(userId),
    ]);

    // Phase 2: Copyrights first (other modules depend on IDs)
    const copyrightIds = await seedDemoCopyrights(userId);

    // Phase 3: Contract (depends on copyright IDs)
    const contractId = await seedDemoContracts(userId, copyrightIds);

    // Phase 4: Everything else (depends on copyrights and/or contract)
    await Promise.all([
      seedDemoSyncLicenses(userId, copyrightIds),
      seedDemoRoyalties(userId, copyrightIds),
      seedDemoPayeeHierarchy(userId, contractId),
      seedDemoCatalogValuation(userId),
    ]);

    console.log('Demo data seeding complete');
  } catch (err) {
    console.error('Demo data seeding error:', err);
  }
}

// ── Notifications ──────────────────────────────────────────────

async function seedDemoNotifications(userId: string) {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((count ?? 0) >= 5) return;

  const notifications: Array<{
    user_id: string;
    type: 'contract_signed' | 'contract_expiring' | 'contract_pending' | 'royalty_statement' | 'payment_processed' | 'copyright_registered' | 'sync_opportunity' | 'system_alert';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    data: any;
  }> = [
    {
      user_id: userId,
      type: 'contract_signed',
      priority: 'high',
      title: 'Co-Publishing Agreement Executed',
      message: 'Your co-publishing agreement with Alicia Keys (AGR-2026010101) has been fully executed.',
      data: { contractId: 'demo-contract-1', contractTitle: 'Alicia Keys — Co-Publishing Agreement' },
    },
    {
      user_id: userId,
      type: 'royalty_statement',
      priority: 'medium',
      title: 'Q4 2025 Royalty Statement Ready',
      message: 'Your quarterly royalty statement for Q4 2025 is available. Total earnings: $22,623.75.',
      data: { amount: 22623.75, period: 'Q4 2025' },
    },
    {
      user_id: userId,
      type: 'sync_opportunity',
      priority: 'medium',
      title: 'Sync License Issued — Netflix "City Lights"',
      message: 'Sync license for "Empire State of Mind (Part II)" in Netflix drama "City Lights" has been issued. Fee: $30,000.',
      data: { platform: 'Netflix', fee: 30000, work: 'Empire State of Mind (Part II)' },
    },
    {
      user_id: userId,
      type: 'payment_processed',
      priority: 'high',
      title: 'Sync Payment Deposited',
      message: 'A sync licensing payment of $30,000 from Netflix has been deposited to your account.',
      data: { amount: 30000, paymentMethod: 'Wire Transfer', source: 'Netflix' },
    },
    {
      user_id: userId,
      type: 'copyright_registered',
      priority: 'medium',
      title: '8 Works Registered Successfully',
      message: 'All 8 Alicia Keys works have been registered with ASCAP successfully.',
      data: { worksCount: 8, pro: 'ASCAP', artist: 'Alicia Keys' },
    },
    {
      user_id: userId,
      type: 'contract_expiring',
      priority: 'medium',
      title: 'Sync License Term Reminder',
      message: 'Your sync license with Netflix for "City Lights" is active through May 2030.',
      data: { contractId: 'demo-sync-1', daysRemaining: 1542 },
    },
    {
      user_id: userId,
      type: 'system_alert',
      priority: 'low',
      title: 'Catalog Valuation Updated',
      message: 'Your Alicia Keys catalog valuation has been updated: $12.5M (87% confidence).',
      data: { valuation: 12500000, confidence: 87, artist: 'Alicia Keys' },
    },
    {
      user_id: userId,
      type: 'contract_pending',
      priority: 'high',
      title: 'Recoupment Status Update',
      message: 'The $500K advance for Alicia Keys co-publishing agreement is 35% recouped ($175K recovered).',
      data: { advance: 500000, recouped: 175000, percentage: 35 },
    },
  ];

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) console.error('Demo notifications insert error:', error);
}

// ── Company & Messages ─────────────────────────────────────────

async function seedDemoMessages(userId: string) {
  const { data: existing } = await supabase
    .from('company_users')
    .select('company_id, companies!inner(slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('companies.slug', 'demo-music-publishing')
    .limit(1)
    .maybeSingle();

  let companyId: string;

  if (existing?.company_id) {
    companyId = existing.company_id;
  } else {
    await supabase
      .from('company_users')
      .delete()
      .eq('user_id', userId);

    const { data: co } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', 'demo-music-publishing')
      .maybeSingle();

    if (co?.id) {
      companyId = co.id;
    } else {
      const { data: newCo, error: coErr } = await supabase
        .from('companies')
        .insert({
          name: 'Demo Music Publishing',
          display_name: 'Demo Music Publishing',
          slug: 'demo-music-publishing',
          company_type: 'standard',
          contact_email: 'demo@encoremusic.tech',
          created_by: userId,
        })
        .select('id')
        .single();

      if (coErr || !newCo) {
        console.error('Demo company creation error:', coErr);
        return;
      }
      companyId = newCo.id;
    }

    const { error: cuErr } = await supabase.from('company_users').insert({
      company_id: companyId,
      user_id: userId,
      role: 'admin',
      status: 'active',
      joined_at: new Date().toISOString(),
    });
    if (cuErr) console.error('Demo company_users insert error:', cuErr);
  }

  const { count } = await supabase
    .from('company_messages')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  if ((count ?? 0) >= 3) return;

  const now = Date.now();
  const messages = [
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'demo@encoremusic.tech',
      sender_name: 'Demo User',
      content: 'Hi team! The Alicia Keys co-publishing agreement has been fully executed. Can you confirm the 8 works are registered with ASCAP?',
      is_encore_admin: false,
      created_at: new Date(now - 3600000 * 4).toISOString(),
      read_by: JSON.stringify([]),
    },
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'support@encoremusic.tech',
      sender_name: 'ENCORE Support',
      content: 'Yes! All 8 works are now registered. We\'ve also processed the Q4 2025 royalty statement — total earnings of $22,623.75 across sync, performance, mechanical, and streaming.',
      is_encore_admin: true,
      created_at: new Date(now - 3600000 * 3).toISOString(),
      read_by: JSON.stringify([]),
    },
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'demo@encoremusic.tech',
      sender_name: 'Demo User',
      content: 'Great! I saw the Netflix sync license for "Empire State of Mind (Part II)" was issued. Has the $30K payment been received?',
      is_encore_admin: false,
      created_at: new Date(now - 3600000 * 2).toISOString(),
      read_by: JSON.stringify([]),
    },
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'support@encoremusic.tech',
      sender_name: 'ENCORE Support',
      content: 'The $30,000 sync fee from Netflix has been received and deposited. The fee allocations have been split per the agreement — Alicia Keys (50%), Al Shuckburgh (15%), and Demo Music Publishing (35%).',
      is_encore_admin: true,
      created_at: new Date(now - 3600000).toISOString(),
      read_by: JSON.stringify([]),
    },
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'demo@encoremusic.tech',
      sender_name: 'Demo User',
      content: 'Perfect. Can you also update the catalog valuation? The latest streaming numbers should push it above $12M.',
      is_encore_admin: false,
      created_at: new Date(now - 1800000).toISOString(),
      read_by: JSON.stringify([]),
    },
  ];

  const { error } = await supabase.from('company_messages').insert(messages);
  if (error) console.error('Demo messages insert error:', error);
}
