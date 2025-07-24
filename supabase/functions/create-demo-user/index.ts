import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create the demo user
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'demo@encoremusic.tech',
      password: 'demo123',
      email_confirm: true
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Grant module access
    const { error: accessError } = await supabaseAdmin
      .from('user_module_access')
      .insert([
        { user_id: user.user.id, module_id: 'catalog-valuation', access_source: 'demo_access' },
        { user_id: user.user.id, module_id: 'deal-simulator', access_source: 'demo_access' },
        { user_id: user.user.id, module_id: 'contract-management', access_source: 'demo_access' },
        { user_id: user.user.id, module_id: 'copyright-management', access_source: 'demo_access' },
        { user_id: user.user.id, module_id: 'sync-licensing', access_source: 'demo_access' }
      ])

    if (accessError) {
      console.error('Error granting access:', accessError)
      return new Response(
        JSON.stringify({ error: accessError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, user: user.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})