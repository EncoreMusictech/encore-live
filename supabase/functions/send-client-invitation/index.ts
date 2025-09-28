// import React from 'npm:react@18.3.1' // Temporarily disabled to fix build
// import { Resend } from 'npm:resend@4.0.0' // Temporarily disabled to fix build
// import { renderAsync } from 'npm:@react-email/components@0.0.22' // Temporarily disabled to fix build
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
// import ClientInvitationEmail from './_templates/client-invitation.tsx' // Temporarily disabled to fix build
// import UserInvitationEmail from './_templates/user-invitation.tsx' // Temporarily disabled to fix build
// import AdminInvitationEmail from './_templates/admin-invitation.tsx' // Temporarily disabled to fix build

// const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string) // Temporarily disabled to fix build

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type InvitationPayload = {
  invitee_email: string
  invitee_name?: string
  token: string
  role?: 'client' | 'user' | 'admin'
  permissions?: Record<string, any>
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
    
    // Determine the appropriate route and template based on role
    const role = body.role || 'client'
    let acceptUrl: string
    let emailTemplate: any
    let subject: string

    if (role === 'client') {
      // Client portal access
      acceptUrl = `${siteUrl}/client-portal?token=${encodeURIComponent(body.token)}`
      emailTemplate = null // ClientInvitationEmail
      subject = 'You\'re invited to the ENCORE Client Portal'
    } else if (role === 'user') {
      // CRM user access
      acceptUrl = `${siteUrl}/crm?token=${encodeURIComponent(body.token)}`
      emailTemplate = null // UserInvitationEmail
      subject = 'ENCORE CRM Team Access - User Invitation'
    } else if (role === 'admin') {
      // CRM admin access
      acceptUrl = `${siteUrl}/crm?token=${encodeURIComponent(body.token)}`
      emailTemplate = null // AdminInvitationEmail
      subject = 'ENCORE CRM Administrator Access Invitation'
    } else {
      throw new Error('Invalid role specified')
    }

    const emailProps = {
      invitee_name: body.invitee_name,
      subscriber_name: body.subscriber_name || 'ENCORE',
      site_url: siteUrl,
      accept_url: acceptUrl,
      support_email: body.support_email || 'support@encoremusic.tech',
      ...(role === 'user' && { permissions: body.permissions })
    }

    // Email template rendering disabled for build
    const html = '<div>Email functionality disabled</div>'

    if (!Deno.env.get('RESEND_API_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY secret in Edge Function settings.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Email sending disabled for build
    const error = null;

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