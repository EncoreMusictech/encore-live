import { sendGmail } from "../_shared/gmail.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { clientInvitationEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type InvitationPayload = {
  invitee_email: string;
  invitee_name?: string;
  token: string;
  role?: 'client' | 'user' | 'admin';
  permissions?: Record<string, any>;
  subscriber_name?: string;
  company_name?: string;
  site_url?: string;
  support_email?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as InvitationPayload;
    const siteUrl = body.site_url || 'https://www.encoremusic.tech';
    const role = body.role || 'client';
    const acceptUrl = `${siteUrl}/accept-invitation?token=${encodeURIComponent(body.token)}`;
    const subscriberName = body.subscriber_name || 'ENCORE';
    const companyName = body.company_name || subscriberName;
    const supportEmail = body.support_email || 'support@encoremusic.tech';
    const inviteeName = body.invitee_name || 'there';

    let subject: string;
    if (role === 'client') {
      subject = `You're invited to join ${companyName}`;
    } else if (role === 'user') {
      subject = `You're invited to join ${companyName} as a team member`;
    } else if (role === 'admin') {
      subject = `You're invited as an administrator for ${companyName}`;
    } else {
      throw new Error('Invalid role specified');
    }

    const html = clientInvitationEmail({
      inviteeName,
      companyName,
      subscriberName,
      acceptUrl,
      role,
      supportEmail,
    });

    console.log(`Sending invitation email to ${body.invitee_email}`);

    const result = await sendGmail({
      to: [body.invitee_email],
      subject,
      html,
      from: 'ENCORE',
    });

    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ ok: true, id: result.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e: any) {
    console.error('send-client-invitation error', e);
    return new Response(
      JSON.stringify({ error: e?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
