import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { testBrandingEmail } from "../_shared/email-templates.ts";
import { resolveCompanyBranding } from "../_shared/resolve-branding.ts";
import { sendGmail } from "../_shared/gmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, to_email } = await req.json();

    if (!company_id || !to_email) {
      return new Response(
        JSON.stringify({ error: "company_id and to_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve branding for this company
    const branding = await resolveCompanyBranding(company_id);
    console.log(`[send-test-email] Resolved branding for ${company_id}:`, JSON.stringify(branding));

    const brandName = branding.brandName || "ENCORE";

    // Generate the test email HTML
    const html = testBrandingEmail({
      brandName,
      brandLogoUrl: branding.logoUrl,
      brandPrimaryColor: branding.primaryColor,
      brandAccentColor: branding.accentColor,
      brandHeaderBgColor: branding.headerBgColor,
    });

    // Send via Gmail
    const result = await sendGmail({
      to: [to_email],
      subject: `${brandName} — Whitelabel Branding Test`,
      html,
      from: brandName,
    });

    console.log(`[send-test-email] Email sent to ${to_email}, messageId: ${result.id}`);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-test-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
