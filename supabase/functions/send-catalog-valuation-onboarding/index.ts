import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";
import { sendGmail } from "../_shared/gmail.ts";
import { catalogValuationOnboardingEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OnboardingEmailRequest {
  user_id?: string;
  user_email: string;
  module_id: string;
  access_source: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[CATALOG-ONBOARDING] Function started");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, user_email, module_id, access_source }: OnboardingEmailRequest = await req.json();
    
    console.log("[CATALOG-ONBOARDING] Processing email for:", { user_id, user_email, module_id });

    if (!user_email) {
      throw new Error("Missing required field: user_email");
    }

    const effectiveUserId = user_id || 'test-user-' + Date.now();
    const firstName = user_email.split('@')[0].split('.')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    const htmlContent = catalogValuationOnboardingEmail({
      userName: capitalizedName,
      accessSource: access_source,
    });

    const result = await sendGmail({
      to: [user_email],
      subject: "Welcome to Catalog Valuation - Get Started Today!",
      html: htmlContent,
      from: "Encore Music",
    });

    console.log("[CATALOG-ONBOARDING] Email sent successfully:", result);

    if (result.id) {
      await supabase
        .from('onboarding_emails')
        .update({
          delivery_status: 'sent',
          email_data: {
            gmail_id: result.id,
            sent_at: new Date().toISOString(),
            access_source
          }
        })
        .eq('user_id', effectiveUserId)
        .eq('module_id', module_id)
        .eq('email_type', 'welcome');

      console.log("[CATALOG-ONBOARDING] Database updated with delivery status");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Onboarding email sent successfully", email_id: result.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[CATALOG-ONBOARDING] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
