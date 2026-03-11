import { supabase } from '@/integrations/supabase/client';

/**
 * Seeds demo-specific notifications and company messages for the demo account.
 * Idempotent — skips if data already exists.
 */
export async function seedDemoData(userId: string) {
  try {
    await Promise.all([
      seedDemoNotifications(userId),
      seedDemoMessages(userId),
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

  if ((count ?? 0) >= 5) return; // already seeded

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
      title: 'Publishing Agreement Signed',
      message: 'Your co-publishing agreement with "Starlight Records" has been fully executed.',
      data: { contractId: 'demo-contract-1', contractTitle: 'Co-Publishing — Starlight Records' },
    },
    {
      user_id: userId,
      type: 'royalty_statement',
      priority: 'medium',
      title: 'Q1 2026 Royalty Statement Ready',
      message: 'Your quarterly royalty statement for Q1 2026 is available. Total earnings: $4,215.80.',
      data: { amount: 4215.80, period: 'Q1 2026' },
    },
    {
      user_id: userId,
      type: 'sync_opportunity',
      priority: 'medium',
      title: 'New Sync Brief — Netflix Series',
      message: 'Netflix is seeking indie-pop tracks for an upcoming drama series. Your catalog matches their brief.',
      data: { platform: 'Netflix', genre: 'indie-pop', deadline: '2026-04-01' },
    },
    {
      user_id: userId,
      type: 'payment_processed',
      priority: 'high',
      title: 'Royalty Payment Deposited',
      message: 'A royalty payment of $1,892.33 has been deposited to your account via direct deposit.',
      data: { amount: 1892.33, paymentMethod: 'Direct Deposit' },
    },
    {
      user_id: userId,
      type: 'copyright_registered',
      priority: 'medium',
      title: 'Copyright Registration Complete',
      message: '"Golden Hour (Demo Mix)" has been registered with BMI successfully.',
      data: { workTitle: 'Golden Hour (Demo Mix)', pro: 'BMI' },
    },
    {
      user_id: userId,
      type: 'contract_expiring',
      priority: 'medium',
      title: 'Sync License Expiring',
      message: 'Your sync license with "Bright Horizon Films" expires in 14 days. Consider renewal.',
      data: { contractId: 'demo-sync-2', daysRemaining: 14 },
    },
    {
      user_id: userId,
      type: 'system_alert',
      priority: 'low',
      title: 'New Feature: AI Catalog Analysis',
      message: 'Try out the new AI-powered catalog valuation tools — now available in your dashboard.',
      data: { feature: 'AI Catalog Analysis', module: 'catalog-valuation' },
    },
    {
      user_id: userId,
      type: 'contract_pending',
      priority: 'high',
      title: 'Contract Awaiting Your Signature',
      message: 'A distribution agreement with "Worldwide Audio" is pending your review and signature.',
      data: { contractId: 'demo-dist-3', urgency: 'high' },
    },
  ];

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) console.error('Demo notifications insert error:', error);
}

// ── Company & Messages ─────────────────────────────────────────

async function seedDemoMessages(userId: string) {
  // Check if user already has a company membership
  const { data: existing } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  let companyId: string;

  if (existing?.company_id) {
    companyId = existing.company_id;
  } else {
    // Check if "Demo Music Publishing" company already exists
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
          company_type: 'publisher',
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

    // Link user to company
    const { error: cuErr } = await supabase.from('company_users').insert({
      company_id: companyId,
      user_id: userId,
      role: 'admin',
      status: 'active',
      joined_at: new Date().toISOString(),
    });
    if (cuErr) console.error('Demo company_users insert error:', cuErr);
  }

  // Check if messages already exist for this company
  const { count } = await supabase
    .from('company_messages')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  if ((count ?? 0) >= 3) return; // already seeded

  const now = Date.now();
  const messages = [
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'demo@encoremusic.tech',
      sender_name: 'Demo User',
      content: 'Hi team! I just uploaded my Q1 royalty statements. Can you confirm they\'ve been processed?',
      is_encore_admin: false,
      created_at: new Date(now - 3600000 * 4).toISOString(),
      read_by: JSON.stringify([]),
    },
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'support@encoremusic.tech',
      sender_name: 'ENCORE Support',
      content: 'Hi! Yes, we\'ve received your Q1 statements. Processing is underway — you\'ll see updated balances within 24 hours.',
      is_encore_admin: true,
      created_at: new Date(now - 3600000 * 3).toISOString(),
      read_by: JSON.stringify([]),
    },
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'demo@encoremusic.tech',
      sender_name: 'Demo User',
      content: 'Great, thank you! Also, I noticed a new sync opportunity notification — is that from the Netflix brief?',
      is_encore_admin: false,
      created_at: new Date(now - 3600000 * 2).toISOString(),
      read_by: JSON.stringify([]),
    },
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'support@encoremusic.tech',
      sender_name: 'ENCORE Support',
      content: 'That\'s correct! Netflix is looking for indie-pop tracks for their upcoming series. Your catalog is a strong match — would you like us to submit on your behalf?',
      is_encore_admin: true,
      created_at: new Date(now - 3600000).toISOString(),
      read_by: JSON.stringify([]),
    },
    {
      company_id: companyId,
      sender_id: userId,
      sender_email: 'demo@encoremusic.tech',
      sender_name: 'Demo User',
      content: 'Yes, please go ahead and submit! Let me know if you need any additional metadata or stems.',
      is_encore_admin: false,
      created_at: new Date(now - 1800000).toISOString(),
      read_by: JSON.stringify([]),
    },
  ];

  const { error } = await supabase.from('company_messages').insert(messages);
  if (error) console.error('Demo messages insert error:', error);
}
