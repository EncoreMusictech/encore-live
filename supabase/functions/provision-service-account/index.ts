import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use the caller's JWT to verify they are an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller is an admin using their own JWT
    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedEmails = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'];
    
    // Also check user_roles table
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = allowedEmails.includes(callerUser.email || '') || roleData?.role === 'admin';

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { companyId, companyName, companySlug } = await req.json();

    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: 'companyId and companyName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if a service account already exists for this company
    const { data: existing } = await adminClient
      .from('company_service_accounts')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        serviceAccountId: existing.service_user_id,
        serviceEmail: existing.service_email,
        alreadyExisted: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a virtual service account user via admin API
    // Email follows a predictable pattern: svc-{slug}@service.encoremusic.tech
    const slug = (companySlug || companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')).substring(0, 40);
    const serviceEmail = `svc-${slug}@service.encoremusic.tech`;
    const servicePassword = crypto.randomUUID() + crypto.randomUUID(); // long random password, never used directly

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: serviceEmail,
      password: servicePassword,
      email_confirm: true,
      user_metadata: {
        display_name: `${companyName} Service Account`,
        is_service_account: true,
        company_id: companyId,
        company_name: companyName,
      },
    });

    if (createError || !newUser?.user) {
      console.error('Failed to create service account user:', createError);
      return new Response(JSON.stringify({ error: `Failed to create auth user: ${createError?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceUserId = newUser.user.id;

    // Record the service account in company_service_accounts
    const { error: insertError } = await adminClient
      .from('company_service_accounts')
      .insert({
        company_id: companyId,
        service_user_id: serviceUserId,
        service_email: serviceEmail,
        display_name: `${companyName} Service Account`,
      });

    if (insertError) {
      // Rollback: delete the auth user we just created
      await adminClient.auth.admin.deleteUser(serviceUserId);
      console.error('Failed to insert service account record:', insertError);
      return new Response(JSON.stringify({ error: `DB insert failed: ${insertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Link the service account to the company in company_users as admin role
    const { error: cuError } = await adminClient
      .from('company_users')
      .insert({
        company_id: companyId,
        user_id: serviceUserId,
        role: 'service_account',
        status: 'active',
        invited_by: callerUser.id,
      });

    if (cuError) {
      console.warn('Could not add service account to company_users (may need manual cleanup):', cuError);
    }

    // Also update the companies table with the service_account_user_id
    await adminClient
      .from('companies')
      .update({ service_account_user_id: serviceUserId })
      .eq('id', companyId);

    console.log(`[provision-service-account] Created service account ${serviceEmail} for company ${companyName} (${companyId})`);

    return new Response(JSON.stringify({
      success: true,
      serviceAccountId: serviceUserId,
      serviceEmail,
      alreadyExisted: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
