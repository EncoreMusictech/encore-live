import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a payee for "Unmatched Royalties" and fixes the payout record
 * to reflect the correct total based on allocated amounts
 */
export async function fixUnmatchedRoyaltiesPayout(userId: string) {
  try {
    // First, create a payee for "Unmatched Royalties" if it doesn't exist
    const { data: existingPayee } = await supabase
      .from('payees')
      .select('id')
      .eq('payee_name', 'Unmatched Royalties')
      .eq('user_id', userId)
      .maybeSingle();

    let payeeId = existingPayee?.id;

    if (!payeeId) {
      const { data: newPayee, error: payeeError } = await supabase
        .from('payees')
        .insert({
          payee_id: 'PAY-2025-UNMATCHED',
          payee_name: 'Unmatched Royalties',
          payee_type: 'other',
          user_id: userId,
          writer_id: null,
          contact_info: {
            email: '',
            phone: '',
            address: '',
            tax_id: ''
          },
          payment_info: {
            payment_settings: {
              frequency: 'quarterly',
              threshold: 0
            },
            default_splits: {
              mechanical: 100,
              performance: 100,
              synchronization: 100
            }
          },
          is_primary: false
        })
        .select('id')
        .single();

      if (payeeError) throw payeeError;
      payeeId = newPayee.id;
    }

    // Get the payout for Q3 2025 with "Unmatched Royalties"
    const { data: payout } = await supabase
      .from('payouts')
      .select('id, client_id, contacts(name)')
      .eq('period', 'Q3 2025')
      .eq('user_id', userId)
      .single();

    if (!payout) {
      throw new Error('Payout not found');
    }

    // Get the actual sum of allocated royalties
    const { data: royalties } = await supabase
      .from('payout_royalties')
      .select('allocated_amount')
      .eq('payout_id', payout.id);

    const actualTotal = royalties?.reduce((sum, r) => sum + Number(r.allocated_amount), 0) || 0;

    // Update the payout with correct values
    const { error: updateError } = await supabase
      .from('payouts')
      .update({
        payee_id: payeeId,
        total_royalties: actualTotal,
        gross_royalties: actualTotal,
        net_royalties: actualTotal,
        net_payable: actualTotal,
        amount_due: actualTotal
      })
      .eq('id', payout.id);

    if (updateError) throw updateError;

    return { success: true, payeeId, correctedTotal: actualTotal };
  } catch (error) {
    console.error('Error fixing unmatched royalties:', error);
    return { success: false, error };
  }
}
