import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          onboarding_complete: boolean | null
          created_at: string
          updated_at: string
          terms_accepted: boolean | null
          terms_accepted_at: string | null
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for admin access
    const supabaseAdmin = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await req.json()
    const { userIds, email } = body

    // If email is provided, look up user by email
    if (email) {
      console.log('Looking up user by email:', email)
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Failed to look up user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const found = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (!found) {
        return new Response(
          JSON.stringify({ error: 'User not found', found: false }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ found: true, user: { id: found.id, email: found.email } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(
        JSON.stringify({ error: 'userIds array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Fetching user details for:', userIds)

    // Get user profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user auth data (email)
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch auth users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Combine profile and auth data
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
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-user-details function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})