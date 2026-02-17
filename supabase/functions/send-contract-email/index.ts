import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";

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

    const contractHtml = contractContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p style="margin-bottom: 12px; line-height: 1.5;">${line}</p>`)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Contract Document</h1>
        </div>
        <div style="padding: 30px;">
          <p>Dear ${recipientName},</p>
          ${senderMessage ? `<p style="color: #555; font-style: italic; border-left: 3px solid #6366f1; padding-left: 12px; margin: 20px 0;">${senderMessage}</p>` : ''}
          <p>Please find the contract <strong>"${contractTitle}"</strong> below:</p>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0; background: #f9fafb;">
            ${contractHtml}
          </div>
          <p style="color: #6b7280; font-size: 13px;">This email was sent from Encore Music Rights Management System.</p>
        </div>
      </div>
    `;

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
