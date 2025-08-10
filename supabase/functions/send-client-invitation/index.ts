import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import ClientInvitationEmail from './_templates/client-invitation.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type InvitationPayload = {
  invitee_email: string
  invitee_name?: string
  token: string
  subscriber_name?: string
  site_url?: string
  support_email?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as InvitationPayload
    const siteUrl = body.site_url || Deno.env.get('SITE_URL') || 'https://'+(Deno.env.get('PROJECT_DOMAIN')||'example.com')
    const acceptUrl = `${siteUrl}/client-portal?token=${encodeURIComponent(body.token)}`

    const html = await renderAsync(
      React.createElement(ClientInvitationEmail, {
        invitee_name: body.invitee_name,
        subscriber_name: body.subscriber_name || 'ENCORE',
        site_url: siteUrl,
        accept_url: acceptUrl,
        support_email: body.support_email || 'support@encoremusic.tech',
      })
    )

    if (!Deno.env.get('RESEND_API_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY secret in Edge Function settings.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const { error } = await resend.emails.send({
      from: 'ENCORE <onboarding@resend.dev>',
      to: [body.invitee_email],
      subject: 'You’re invited to the ENCORE Client Portal',
      html,
    })

    if (error) throw error

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e: any) {
    console.error('send-client-invitation error', e)
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
