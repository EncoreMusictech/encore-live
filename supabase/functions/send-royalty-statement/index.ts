import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import { royaltyStatementEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, recipient_name, statement_period, total_earnings, total_paid, balance, line_items } = await req.json();
    if (!to) throw new Error("Missing recipient email (to)");

    const html = royaltyStatementEmail({
      recipientName: recipient_name || "Valued Client",
      statementPeriod: statement_period || "Current Period",
      totalEarnings: total_earnings || "$0.00",
      totalPaid: total_paid || "$0.00",
      balance: balance || "$0.00",
      lineItems: line_items,
    });

    const result = await sendGmail({
      to: [to],
      subject: `Royalty Statement — ${statement_period || "Current Period"}`,
      html,
      from: "Encore Music",
    });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-royalty-statement error:", e);
    return new Response(JSON.stringify({ error: e.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
