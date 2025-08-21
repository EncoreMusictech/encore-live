import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportTicketRequest {
  firstName: string;
  lastName: string;
  email: string;
  priority: string;
  category: string;
  feature: string;
  subject: string;
  description: string;
  ticketId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ticketData: SupportTicketRequest = await req.json();

    const priorityColor = {
      low: "#22c55e",
      medium: "#f59e0b", 
      high: "#ef4444",
      critical: "#dc2626"
    };

    const emailResponse = await resend.emails.send({
      from: "ENCORE Support <noreply@encoremusic.tech>",
      to: ["info@encoremusic.tech"],
      subject: `Support Ticket: ${ticketData.subject} [${ticketData.ticketId}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            New Support Ticket
          </h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Ticket Details</h2>
            <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
            <p><strong>Subject:</strong> ${ticketData.subject}</p>
            <p><strong>Priority:</strong> <span style="color: ${priorityColor[ticketData.priority as keyof typeof priorityColor] || '#666'}; font-weight: bold;">${ticketData.priority.toUpperCase()}</span></p>
            <p><strong>Category:</strong> ${ticketData.category}</p>
            <p><strong>Feature:</strong> ${ticketData.feature}</p>
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Customer Information</h2>
            <p><strong>Name:</strong> ${ticketData.firstName} ${ticketData.lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${ticketData.email}">${ticketData.email}</a></p>
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Description</h2>
            <p style="white-space: pre-wrap; line-height: 1.6;">${ticketData.description}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            <p>This ticket was submitted via the ENCORE Rights Management platform.</p>
            <p>Submitted on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Support ticket email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      ticketId: ticketData.ticketId,
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-support-ticket function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);