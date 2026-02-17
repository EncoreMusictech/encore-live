import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import { paymentConfirmationEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, recipient_name, payment_amount, payment_date, payment_method, reference_id, period } = await req.json();
    if (!to) throw new Error("Missing recipient email (to)");

    const html = paymentConfirmationEmail({
      recipientName: recipient_name || "Valued Client",
      paymentAmount: payment_amount || "$0.00",
      paymentDate: payment_date || new Date().toLocaleDateString("en-US"),
      paymentMethod: payment_method || "Direct Deposit",
      referenceId: reference_id || `PAY-${Date.now()}`,
      period,
    });

    const result = await sendGmail({
      to: [to],
      subject: `Payment of ${payment_amount} Confirmed — ${reference_id || "ENCORE"}`,
      html,
      from: "Encore Music",
    });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-payment-confirmation error:", e);
    return new Response(JSON.stringify({ error: e.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
