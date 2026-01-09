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

// Determine recipient email based on category
const getRecipientEmail = (category: string): string => {
  // Account, Billing, and Other go to Services
  const servicesCategories = ['billing', 'other'];
  
  if (servicesCategories.includes(category?.toLowerCase())) {
    return 'Services@encoremusic.tech';
  }
  
  // All others (technical, feature, integration) go to Support
  return 'Support@encoremusic.tech';
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ticketData: SupportTicketRequest = await req.json();

    const priorityColor: Record<string, string> = {
      low: "#22c55e",
      medium: "#f59e0b", 
      high: "#ef4444",
      critical: "#dc2626"
    };

    const recipientEmail = getRecipientEmail(ticketData.category);
    console.log(`Routing ticket ${ticketData.ticketId} to ${recipientEmail} (category: ${ticketData.category})`);

    // Send email to support team
    const supportEmailResponse = await resend.emails.send({
      from: "Encore Music Support <support@encoremusic.tech>",
      to: [recipientEmail],
      replyTo: ticketData.email,
      subject: `[${ticketData.priority?.toUpperCase() || 'LOW'}] Support Ticket ${ticketData.ticketId}: ${ticketData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Support Ticket</h1>
          </div>
          
          <div style="padding: 20px; background: #f9fafb;">
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1f2937;">Ticket Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;">Ticket ID:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${ticketData.ticketId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Priority:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: ${priorityColor[ticketData.priority] || '#6b7280'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                      ${ticketData.priority?.toUpperCase() || 'LOW'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Category:</td>
                  <td style="padding: 8px 0;">${ticketData.category || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Feature:</td>
                  <td style="padding: 8px 0;">${ticketData.feature || 'Not specified'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1f2937;">Customer Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;">Name:</td>
                  <td style="padding: 8px 0;">${ticketData.firstName} ${ticketData.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${ticketData.email}">${ticketData.email}</a></td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 20px;">
              <h2 style="margin-top: 0; color: #1f2937;">Subject</h2>
              <p style="font-weight: bold; margin-bottom: 16px;">${ticketData.subject}</p>
              
              <h2 style="color: #1f2937;">Description</h2>
              <p style="white-space: pre-wrap; color: #4b5563;">${ticketData.description}</p>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This is an automated message from Encore Music Support System</p>
          </div>
        </div>
      `,
    });

    console.log("Support email sent successfully:", supportEmailResponse);

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Encore Music Support <support@encoremusic.tech>",
      to: [ticketData.email],
      subject: `We received your support request - Ticket ${ticketData.ticketId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Support Request Received</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${ticketData.firstName},</p>
            
            <p>Thank you for contacting Encore Music Support. We have received your support request and our team is reviewing it.</p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
              <p style="margin: 8px 0 0;"><strong>Subject:</strong> ${ticketData.subject}</p>
            </div>
            
            <p>We typically respond within 24 hours. For urgent matters, please indicate "Critical" priority in your ticket.</p>
            
            <p>Best regards,<br>The Encore Music Support Team</p>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb;">
            <p>© ${new Date().getFullYear()} Encore Music. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("Customer confirmation email sent:", customerEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      ticketId: ticketData.ticketId,
      routedTo: recipientEmail
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
