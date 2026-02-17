import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendGmail } from "../_shared/gmail.ts";
import {
  supportTicketConfirmationEmail,
  supportTicketInternalEmail,
} from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

const getRecipientEmail = (category: string): string => {
  const servicesCategories = ['billing', 'other'];
  if (servicesCategories.includes(category?.toLowerCase())) {
    return 'Services@encoremusic.tech';
  }
  return 'Support@encoremusic.tech';
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ticketData: SupportTicketRequest = await req.json();
    const recipientEmail = getRecipientEmail(ticketData.category);
    console.log(`Routing ticket ${ticketData.ticketId} to ${recipientEmail} (category: ${ticketData.category})`);

    // Send internal notification to support team
    await sendGmail({
      to: [recipientEmail],
      subject: `[${ticketData.priority?.toUpperCase() || 'LOW'}] Support Ticket ${ticketData.ticketId}: ${ticketData.subject}`,
      html: supportTicketInternalEmail({
        ticketId: ticketData.ticketId,
        priority: ticketData.priority,
        category: ticketData.category,
        feature: ticketData.feature,
        firstName: ticketData.firstName,
        lastName: ticketData.lastName,
        email: ticketData.email,
        subject: ticketData.subject,
        description: ticketData.description,
      }),
      from: "Encore Music Support",
      replyTo: ticketData.email,
    });

    console.log("Support email sent successfully");

    // Send confirmation email to customer
    await sendGmail({
      to: [ticketData.email],
      subject: `We received your support request - Ticket ${ticketData.ticketId}`,
      html: supportTicketConfirmationEmail({
        firstName: ticketData.firstName,
        ticketId: ticketData.ticketId,
        subject: ticketData.subject,
      }),
      from: "Encore Music Support",
    });

    console.log("Customer confirmation email sent");

    return new Response(JSON.stringify({
      success: true,
      ticketId: ticketData.ticketId,
      routedTo: recipientEmail
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-support-ticket function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
