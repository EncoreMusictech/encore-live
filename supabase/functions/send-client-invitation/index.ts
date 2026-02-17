import { sendGmail } from "../_shared/gmail.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const siteUrl = body.site_url || 'https://encore-live.lovable.app';
    
    const role = body.role || 'client';
    let subject: string;
    const acceptUrl = `${siteUrl}/accept-invitation?token=${encodeURIComponent(body.token)}`;

    if (role === 'client') {
      subject = `You're invited to join ${body.company_name || 'ENCORE'}`;
    } else if (role === 'user') {
      subject = `You're invited to join ${body.company_name || 'ENCORE'} as a team member`;
    } else if (role === 'admin') {
      subject = `You're invited as an administrator for ${body.company_name || 'ENCORE'}`;
    } else {
      throw new Error('Invalid role specified');
    }

    const subscriberName = body.subscriber_name || 'ENCORE';
    const companyName = body.company_name || subscriberName;
    const supportEmail = body.support_email || 'support@encoremusic.tech';
    const inviteeName = body.invitee_name || 'there';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 18px; color: #333; margin: 0 0 20px;">Hi ${inviteeName},</p>
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 20px;">
                You've been invited to join <strong>${companyName}</strong> on ${subscriberName}'s Rights Management System.
              </p>
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 30px;">
                Click the button below to create your account and get started:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              <p style="font-size: 14px; color: #888; line-height: 1.5; margin: 30px 0 0; border-top: 1px solid #eee; padding-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${acceptUrl}" style="color: #6366f1; word-break: break-all;">${acceptUrl}</a>
              </p>
              <p style="font-size: 14px; color: #888; line-height: 1.5; margin: 20px 0 0;">
                This invitation will expire in 7 days. If you have any questions, contact us at 
                <a href="mailto:${supportEmail}" style="color: #6366f1;">${supportEmail}</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

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
