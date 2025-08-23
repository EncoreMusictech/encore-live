import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryRequest {
  exportId: string;
  ftpCredentialId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { exportId, ftpCredentialId }: DeliveryRequest = await req.json();

    // Get export details
    const { data: exportData, error: exportError } = await supabaseClient
      .from('copyright_exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single();

    if (exportError || !exportData) {
      return new Response('Export not found', { status: 404, headers: corsHeaders });
    }

    // Get FTP credentials
    const { data: ftpCreds, error: ftpError } = await supabaseClient
      .from('pro_ftp_credentials')
      .select('*')
      .eq('id', ftpCredentialId)
      .eq('user_id', user.id)
      .single();

    if (ftpError || !ftpCreds) {
      return new Response('FTP credentials not found', { status: 404, headers: corsHeaders });
    }

    // Create delivery job
    const { data: deliveryJob, error: jobError } = await supabaseClient
      .from('export_delivery_jobs')
      .insert({
        user_id: user.id,
        export_id: exportId,
        ftp_credential_id: ftpCredentialId,
        file_path: exportData.file_storage_path || `${exportData.format}_${exportData.id}.${exportData.format.toLowerCase()}`,
        delivery_status: 'pending'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating delivery job:', jobError);
      return new Response('Failed to create delivery job', { status: 500, headers: corsHeaders });
    }

    // Update export with delivery job reference
    await supabaseClient
      .from('copyright_exports')
      .update({ delivery_job_id: deliveryJob.id })
      .eq('id', exportId);

    // Start delivery process (in a real implementation, this would use actual FTP/SFTP libraries)
    const deliveryResult = await simulateDelivery({
      host: ftpCreds.host,
      port: ftpCreds.port,
      username: ftpCreds.username,
      basePath: ftpCreds.base_path,
      filePath: deliveryJob.file_path,
      connectionType: ftpCreds.connection_type
    });

    // Update delivery job status
    const updatedStatus = deliveryResult.success ? 'completed' : 'failed';
    await supabaseClient
      .from('export_delivery_jobs')
      .update({
        delivery_status: updatedStatus,
        attempt_count: 1,
        last_attempt_at: new Date().toISOString(),
        completed_at: deliveryResult.success ? new Date().toISOString() : null,
        error_message: deliveryResult.error || null,
        delivery_metadata: deliveryResult.metadata || {}
      })
      .eq('id', deliveryJob.id);

    return new Response(JSON.stringify({
      success: deliveryResult.success,
      deliveryJobId: deliveryJob.id,
      message: deliveryResult.success ? 'File delivered successfully' : deliveryResult.error
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in deliver-export-ftp:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Simulated delivery function - in production this would use real FTP/SFTP libraries
async function simulateDelivery(config: any) {
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate success/failure based on host validity
  const success = config.host && config.host !== 'invalid-host.com';
  
  return {
    success,
    error: success ? null : 'Connection failed: Invalid host or credentials',
    metadata: {
      host: config.host,
      port: config.port,
      connectionType: config.connectionType,
      deliveredAt: success ? new Date().toISOString() : null
    }
  };
}