import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestBody = await req.json();
    const { searchId, songwriterName, searchData } = requestBody;

    if (!searchId || !songwriterName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: searchId and songwriterName' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'N8N webhook not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update webhook status to 'sending'
    const { error: updateError } = await supabaseClient
      .from('song_catalog_searches')
      .update({ 
        webhook_status: 'sending',
        webhook_sent_at: new Date().toISOString()
      })
      .eq('id', searchId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update webhook status:', updateError);
    }

    // Prepare webhook payload
    const webhookPayload = {
      searchId,
      songwriterName,
      userId: user.id,
      timestamp: new Date().toISOString(),
      searchData: searchData || {},
      source: 'song-estimator-tool'
    };

    console.log('Sending webhook to n8n:', { url: n8nWebhookUrl, payload: webhookPayload });

    // Send webhook to n8n
    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookResponseText = await webhookResponse.text();
    
    if (webhookResponse.ok) {
      console.log('Webhook sent successfully:', webhookResponseText);
      
      // Update webhook status to 'sent'
      await supabaseClient
        .from('song_catalog_searches')
        .update({ 
          webhook_status: 'sent',
          webhook_response: webhookResponseText
        })
        .eq('id', searchId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook sent successfully',
          response: webhookResponseText 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('Webhook failed:', webhookResponse.status, webhookResponseText);
      
      // Update webhook status to 'failed'
      await supabaseClient
        .from('song_catalog_searches')
        .update({ 
          webhook_status: 'failed',
          webhook_error: `HTTP ${webhookResponse.status}: ${webhookResponseText}`
        })
        .eq('id', searchId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ 
          error: 'Webhook failed', 
          details: webhookResponseText,
          status: webhookResponse.status 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in trigger-n8n-webhook function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: (error as Error).message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});