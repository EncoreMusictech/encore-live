import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { WelcomeEmail } from './_templates/welcome-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    // If webhook secret is configured, verify the webhook
    if (hookSecret) {
      const wh = new Webhook(hookSecret)
      try {
        const {
          user,
          email_data: { token, token_hash, redirect_to, email_action_type },
        } = wh.verify(payload, headers) as {
          user: {
            email: string
          }
          email_data: {
            token: string
            token_hash: string
            redirect_to: string
            email_action_type: string
            site_url: string
          }
        }

        // Only process signup confirmations
        if (email_action_type !== 'signup') {
          return new Response('Not a signup confirmation', { 
            status: 200,
            headers: corsHeaders
          })
        }

        const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

        const html = await renderAsync(
          React.createElement(WelcomeEmail, {
            confirmationUrl,
            userEmail: user.email,
          })
        )

        const { error } = await resend.emails.send({
          from: 'ENCORE Team <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Welcome to ENCORE Music Tech Solutions - Verify Your Account',
          html,
        })

        if (error) {
          console.error('Resend error:', error)
          throw error
        }

        console.log('Welcome email sent successfully to:', user.email)
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (webhookError) {
        console.error('Webhook verification failed:', webhookError)
        return new Response(
          JSON.stringify({
            error: {
              message: 'Webhook verification failed',
              details: webhookError.message,
            },
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    } else {
      // Handle direct API calls (for testing or alternative implementations)
      const { email, confirmationUrl } = await JSON.parse(payload)
      
      if (!email || !confirmationUrl) {
        return new Response(
          JSON.stringify({ error: 'Missing email or confirmationUrl' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const html = await renderAsync(
        React.createElement(WelcomeEmail, {
          confirmationUrl,
          userEmail: email,
        })
      )

      const { error } = await resend.emails.send({
        from: 'ENCORE Team <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to ENCORE Music Tech Solutions - Verify Your Account',
        html,
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      console.log('Welcome email sent successfully to:', email)
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Error in send-welcome-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: 'Internal server error',
          details: error.message,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})