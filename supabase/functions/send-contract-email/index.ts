import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import { contractEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractEmailRequest {
  to: string;
  recipientName: string;
  contractTitle: string;
  contractContent: string;
  senderMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, recipientName, contractTitle, contractContent, senderMessage }: ContractEmailRequest = await req.json();

    const html = contractEmail({
      recipientName,
      contractTitle,
      contractContent,
      senderMessage,
    });

    console.log(`Sending contract email to: ${to} for contract: ${contractTitle}`);

    const result = await sendGmail({
      to: [to],
      subject: `Contract: ${contractTitle}`,
      html,
      from: "Encore Music",
    });

    return new Response(JSON.stringify({
      success: true,
      messageId: result.id,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contract-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
