import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import { invitationReminderEmail } from "../_shared/email-templates.ts";
import { resolveBrandingByUserId } from "../_shared/resolve-branding.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, days_until_expiry, expires_at, subscriber_user_id } = await req.json();
    if (!email) throw new Error("Missing email");

    // Resolve whitelabel branding
    let brandLogoUrl: string | undefined;
    let brandName: string | undefined;
    if (subscriber_user_id) {
      const branding = await resolveBrandingByUserId(subscriber_user_id);
      brandLogoUrl = branding.logoUrl;
      brandName = branding.brandName;
    }

    const isUrgent = (days_until_expiry ?? 3) <= 1;

    const html = invitationReminderEmail({
      daysUntilExpiry: days_until_expiry ?? 3,
      expiresAt: expires_at || new Date(Date.now() + days_until_expiry * 86400000).toISOString(),
      isUrgent,
      brandLogoUrl,
      brandName,
    });

    const result = await sendGmail({
      to: [email],
      subject: isUrgent
        ? "⚠️ Your invitation expires tomorrow!"
        : "Reminder: Your invitation expires soon",
      html,
      from: brandName || "ENCORE",
    });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-invitation-reminder error:", e);
    return new Response(JSON.stringify({ error: e.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
