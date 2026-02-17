import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import { contractExpirationEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, recipient_name, contract_title, expiration_date, days_remaining, contract_type, counterparty_name } = await req.json();
    if (!to) throw new Error("Missing recipient email (to)");

    const html = contractExpirationEmail({
      recipientName: recipient_name || "there",
      contractTitle: contract_title || "Untitled Contract",
      expirationDate: expiration_date || "TBD",
      daysRemaining: days_remaining ?? 30,
      contractType: contract_type || "publishing",
      counterpartyName: counterparty_name || "Unknown",
    });

    const isUrgent = (days_remaining ?? 30) <= 7;

    const result = await sendGmail({
      to: [to],
      subject: `${isUrgent ? "⚠️ URGENT: " : ""}Contract "${contract_title}" expires in ${days_remaining} days`,
      html,
      from: "Encore Music",
    });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-contract-expiration error:", e);
    return new Response(JSON.stringify({ error: e.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
