import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import { monthlyInvoiceEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, recipient_name, company_name, invoice_id, invoice_date, due_date, modules, subtotal, tax, total, payment_url } = await req.json();
    if (!to) throw new Error("Missing recipient email (to)");

    const html = monthlyInvoiceEmail({
      recipientName: recipient_name || "Valued Client",
      companyName: company_name || "ENCORE",
      invoiceId: invoice_id || `INV-${Date.now()}`,
      invoiceDate: invoice_date || new Date().toLocaleDateString("en-US"),
      dueDate: due_date || "Due upon receipt",
      modules: modules || [{ name: "Platform Access", price: "$0.00" }],
      subtotal: subtotal || "$0.00",
      tax,
      total: total || "$0.00",
      paymentUrl: payment_url,
    });

    const result = await sendGmail({
      to: [to],
      subject: `ENCORE Invoice ${invoice_id || ""} — ${total || "$0.00"}`,
      html,
      from: "Encore Music",
    });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-monthly-invoice error:", e);
    return new Response(JSON.stringify({ error: e.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
