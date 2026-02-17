import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { sendGmail } from "../_shared/gmail.ts";
import { contractExpirationEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find contracts expiring in 30, 14, or 7 days
    const now = new Date();
    const checkDays = [30, 14, 7];
    let totalSent = 0;

    for (const days of checkDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, title, end_date, contract_type, counterparty_name, user_id, contract_status')
        .eq('contract_status', 'active')
        .gte('end_date', dateStr)
        .lt('end_date', dateStr + 'T23:59:59Z');

      if (error) {
        console.error(`Error querying contracts for ${days} days:`, error);
        continue;
      }

      if (!contracts?.length) continue;

      for (const contract of contracts) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(contract.user_id);
        if (!userData?.user?.email) continue;

        const html = contractExpirationEmail({
          recipientName: userData.user.user_metadata?.full_name || userData.user.email.split('@')[0],
          contractTitle: contract.title,
          expirationDate: new Date(contract.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          daysRemaining: days,
          contractType: contract.contract_type,
          counterpartyName: contract.counterparty_name,
        });

        const isUrgent = days <= 7;

        try {
          await sendGmail({
            to: [userData.user.email],
            subject: `${isUrgent ? "⚠️ URGENT: " : ""}Contract "${contract.title}" expires in ${days} days`,
            html,
            from: "Encore Music",
          });
          totalSent++;
        } catch (emailErr) {
          console.error(`Failed to send expiration email for contract ${contract.id}:`, emailErr);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, emails_sent: totalSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("check-expiring-contracts error:", e);
    return new Response(JSON.stringify({ error: e.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
