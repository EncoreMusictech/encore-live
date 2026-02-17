import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";
import { sendGmail } from "../_shared/gmail.ts";

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

const generateEmailHTML = (userEmail: string, accessSource: string) => {
  const firstName = userEmail.split('@')[0].split('.')[0];
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Catalog Valuation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1e293b; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Welcome to Catalog Valuation!</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">Your professional music IP valuation platform</p>
        </div>

        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 24px; border-radius: 8px; margin: 30px 0;">
            <h2 style="margin-top: 0; color: #1e293b;">Hello ${capitalizedName}! 👋</h2>
            <p style="margin-bottom: 0;">You now have access to our industry-leading catalog valuation tools. We're excited to help you make informed decisions about your music investments and catalog acquisitions.</p>
        </div>

        <h3 style="color: #1e293b; margin-bottom: 20px;">🎯 Key Features You Can Use Now</h3>
        <ul style="padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 8px;"><strong>DCF Analysis</strong> – Advanced discounted cash flow modeling</li>
            <li style="margin-bottom: 8px;"><strong>Risk Assessment</strong> – Comprehensive risk analysis and scoring</li>
            <li style="margin-bottom: 8px;"><strong>Spotify Integration</strong> – Real-time streaming data</li>
            <li style="margin-bottom: 8px;"><strong>Multiple Valuations</strong> – Compare DCF, multiple-based, and risk-adjusted values</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="https://encore-live.lovable.app/catalog-valuation" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center;">Start Your First Valuation →</a>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; margin: 0 0 16px 0;">Need help getting started?</p>
            <a href="mailto:support@encoremusic.tech" style="color: #667eea; text-decoration: none; font-weight: 500;">Contact our support team →</a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>This email was sent because you gained access to the Catalog Valuation module${accessSource ? ` via ${accessSource}` : ''}.</p>
            <p style="margin: 8px 0 0 0;">Encore Music | Professional Music IP Management</p>
        </div>
    </div>
</body>
</html>`;
};

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
    const htmlContent = generateEmailHTML(user_email, access_source);

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
