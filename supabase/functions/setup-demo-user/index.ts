import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create demo user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'info@encoremusic.tech',
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        role: 'demo'
      }
    });

    if (authError) {
      console.error('Error creating demo user:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Grant module access for demo user
    const modules = [
      'catalog-valuation',
      'deal-simulator', 
      'contract-management',
      'copyright-management',
      'sync-licensing'
    ];

    for (const moduleId of modules) {
      const { error: moduleError } = await supabaseAdmin
        .from('user_module_access')
        .upsert({
          user_id: authData.user.id,
          module_id: moduleId,
          access_source: 'free_tier',
          granted_at: new Date().toISOString()
        });

      if (moduleError) {
        console.error(`Error granting access to module ${moduleId}:`, moduleError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo user created successfully',
        user_id: authData.user.id 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in setup-demo-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);