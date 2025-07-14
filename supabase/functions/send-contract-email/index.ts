import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContractEmailRequest {
  to: string;
  recipientName: string;
  contractTitle: string;
  contractContent: string;
  senderMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, recipientName, contractTitle, contractContent, senderMessage }: ContractEmailRequest = await req.json();

    // Create HTML version of the contract
    const contractHtml = contractContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p style="margin-bottom: 12px; line-height: 1.5;">${line}</p>`)
      .join('');

    const emailResponse = await resend.emails.send({
      from: "Music Contracts <contracts@yourdomain.com>", // You'll need to update this with your verified domain
      to: [to],
      subject: `Contract for Review: ${contractTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contract for Review</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .contract-content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 8px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 30px;
              padding: 20px;
              background: #f1f3f4;
              border-radius: 8px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .action-button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Contract for Review</h1>
            <h2>${contractTitle}</h2>
          </div>
          
          <div>
            <p>Hello ${recipientName},</p>
            <p>You have received a new contract for your review and consideration. Please find the contract details below:</p>
            
            ${senderMessage ? `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>Message from sender:</strong><br>
                ${senderMessage}
              </div>
            ` : ''}
          </div>

          <div class="contract-content">
            ${contractContent}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p><strong>Next Steps:</strong></p>
            <p>Please review the contract carefully. If you have any questions or need clarification, please reply to this email.</p>
            <p>Once you're ready to proceed, we recommend having the contract reviewed by legal counsel before signing.</p>
          </div>

          <div class="footer">
            <p><strong>Important Notice:</strong></p>
            <p>This contract has been sent to you for review purposes. Please ensure all terms are acceptable before proceeding with any signatures or agreements.</p>
            <p>If you believe you received this email in error, please contact the sender immediately.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #888;">
              This email was sent via the Music Contract Management System.<br>
              Please do not reply directly to this automated email address.
            </p>
          </div>
        </body>
        </html>
      `,
      // Also include a plain text version
      text: `
Contract for Review: ${contractTitle}

Hello ${recipientName},

You have received a new contract for your review and consideration.

${senderMessage ? `Message from sender: ${senderMessage}\n\n` : ''}

CONTRACT DETAILS:
=================

${contractContent}

NEXT STEPS:
Please review the contract carefully. If you have any questions or need clarification, please reply to this email.

Once you're ready to proceed, we recommend having the contract reviewed by legal counsel before signing.

---
This email was sent via the Music Contract Management System.
      `,
    });

    console.log("Contract email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      message: "Contract sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contract-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);