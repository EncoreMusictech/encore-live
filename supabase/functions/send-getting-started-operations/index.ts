import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import { gettingStartedOperationsEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GettingStartedRequest {
  user_email: string;
  recipient_name: string;
  company_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[GETTING-STARTED-OPS] Function started");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_email, recipient_name, company_name }: GettingStartedRequest = await req.json();

    console.log("[GETTING-STARTED-OPS] Processing email for:", { user_email, recipient_name, company_name });

    if (!user_email) {
      throw new Error("Missing required field: user_email");
    }

    const htmlContent = gettingStartedOperationsEmail({
      recipientName: recipient_name || "Team",
      companyName: company_name || "your company",
    });

    const result = await sendGmail({
      to: [user_email],
      subject: "Getting Started – Submitting Your Contracts & Works on ENCORE",
      html: htmlContent,
      from: "Encore Music",
    });

    console.log("[GETTING-STARTED-OPS] Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, message: "Getting started email sent successfully", email_id: result.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[GETTING-STARTED-OPS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
