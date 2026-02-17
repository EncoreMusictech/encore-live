import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { sendGmail } from "../_shared/gmail.ts";
import { welcomeEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json()
    const { userIds, email, autoCreate, clientName, role } = body

    // If email is provided, look up or auto-create user
    if (email) {
      console.log('Looking up user by email:', email)
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      if (authError) {
        console.error('Error listing users:', authError)
        return new Response(
          JSON.stringify({ error: 'Failed to look up user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const found = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (found) {
        return new Response(
          JSON.stringify({ found: true, user: { id: found.id, email: found.email }, created: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (autoCreate) {
        console.log('Auto-creating user for email:', email)
        const tempPassword = generateTempPassword()

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            created_via: 'client_portal_invite',
            client_name: clientName || 'Unknown',
          }
        })

        if (createError) {
          console.error('Error creating user:', createError)
          return new Response(
            JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('User created successfully:', newUser.user.id)

        try {
          await sendGmail({
            to: [email],
            subject: `Welcome to ${clientName || 'ENCORE'} — Your Account is Ready`,
            from: 'Encore Music',
            html: welcomeEmail({
              email,
              tempPassword,
              clientName: clientName || 'ENCORE',
              role: role || 'user',
            }),
          });
          console.log('Welcome email sent successfully to:', email)
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError)
        }

        return new Response(
          JSON.stringify({
            found: true,
            user: { id: newUser.user.id, email: newUser.user.email },
            created: true,
            emailSent: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'User not found', found: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(
        JSON.stringify({ error: 'userIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching user details for:', userIds)

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch auth users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userDetails = userIds.map(userId => {
      const profile = profiles?.find(p => p.id === userId)
      const authUser = authUsers.users.find(u => u.id === userId)
      const firstName = profile?.first_name || ''
      const lastName = profile?.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()

      return {
        id: userId,
        email: authUser?.email || `${userId.slice(0, 8)}@system.local`,
        name: fullName || `User ${userId.slice(0, 8)}...`,
        first_name: firstName,
        last_name: lastName
      }
    })

    console.log('Returning user details:', userDetails)

    return new Response(
      JSON.stringify({ users: userDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-user-details function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const specials = '!@#$%&*'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  password += specials.charAt(Math.floor(Math.random() * specials.length))
  password += Math.floor(Math.random() * 10)
  return password
}
