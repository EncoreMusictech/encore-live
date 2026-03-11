import { supabase } from '@/integrations/supabase/client';

export async function seedDemoPayeeHierarchy(userId: string, contractId: string | null) {
  if (!contractId) return;

  // Check if already seeded
  const { count } = await supabase
    .from('original_publishers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('publisher_name', 'Demo Music Publishing');

  if ((count ?? 0) >= 1) return;

  // 1. Original Publisher
  const { data: op, error: opErr } = await supabase
    .from('original_publishers')
    .insert({
      user_id: userId,
      publisher_name: 'Demo Music Publishing',
      agreement_id: contractId,
      op_id: 'OP-DEMO-0001',
      contact_info: { email: 'demo@encoremusic.tech', phone: '(212) 555-0100' },
    } as any)
    .select('id')
    .single();

  if (opErr || !op) {
    console.error('Demo OP insert error:', opErr);
    return;
  }

  // 2. Writers linked to OP
  const writerInserts = [
    {
      user_id: userId,
      writer_name: 'Alicia Keys',
      original_publisher_id: op.id,
      writer_id: 'WR-DEMO-0001',
      contact_info: { email: 'management@aliciakeys.com', pro: 'ASCAP', ipi: '00349382747' },
    },
    {
      user_id: userId,
      writer_name: 'Kerry Brothers Jr.',
      original_publisher_id: op.id,
      writer_id: 'WR-DEMO-0002',
      contact_info: { pro: 'BMI' },
    },
  ];

  const { data: writers, error: wrErr } = await supabase
    .from('writers')
    .insert(writerInserts as any)
    .select('id');

  if (wrErr) {
    console.error('Demo writers insert error:', wrErr);
    return;
  }

  // 3. Payees linked to writers
  const payeeInserts = (writers ?? []).map((w, i) => ({
    user_id: userId,
    payee_name: i === 0 ? 'Alicia Keys' : 'Kerry Brothers Jr.',
    payee_type: 'Writer',
    writer_id: w.id,
    is_primary: i === 0,
    contact_info: i === 0
      ? { email: 'management@aliciakeys.com' }
      : { email: 'kerry@brothersmusic.com' },
    payment_info: {
      payment_method: 'Wire Transfer',
      currency: 'USD',
    },
    beginning_balance: 0,
  }));

  const { error: payErr } = await supabase.from('payees').insert(payeeInserts as any);
  if (payErr) console.error('Demo payees insert error:', payErr);
}
