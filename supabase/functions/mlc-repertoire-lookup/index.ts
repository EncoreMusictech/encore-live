import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  // Always handle CORS first
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('MLC function started');
    console.log('Environment check - MLC_USERNAME exists:', !!Deno.env.get('MLC_USERNAME'));
    console.log('Environment check - MLC_PASSWORD exists:', !!Deno.env.get('MLC_PASSWORD'));

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return json({ error: 'Invalid JSON in request body' }, 400);
    }

    const { workTitle, writerName, publisherName, iswc, isrc } = requestBody;
    console.log('Search parameters:', { workTitle, writerName, publisherName, iswc, isrc });

    if (!workTitle && !writerName && !iswc && !isrc) {
      return json({ error: 'At least one search parameter is required' }, 400);
    }

    const mlcUsername = Deno.env.get('MLC_USERNAME');
    const mlcPassword = Deno.env.get('MLC_PASSWORD');

    if (!mlcUsername || !mlcPassword) {
      console.log('MLC credentials not configured');
      return json({ 
        error: 'MLC credentials not configured. Please set MLC_USERNAME and MLC_PASSWORD.',
        found: false,
        writers: [],
        publishers: [],
        metadata: {}
      });
    }

    console.log('Getting MLC access token...');
    
    // Get MLC OAuth token
    const authResponse = await fetch('https://public-api.themlc.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: mlcUsername,
        password: mlcPassword
      })
    });

    console.log('Auth response status:', authResponse.status);

    if (!authResponse.ok) {
      const authText = await authResponse.text();
      console.error('MLC OAuth failed:', authResponse.status, authText);
      throw new Error(`MLC OAuth failed: ${authResponse.status} - ${authText}`);
    }

    const authData = await authResponse.json();
    console.log('Auth data received:', authData);
    
    if (authData.error) {
      throw new Error(`MLC OAuth error: ${authData.error} - ${authData.errorDescription || ''}`);
    }

    const accessToken = authData.accessToken;
    console.log('Access token obtained successfully');

    // For now, just return a success response to test the auth
    return json({
      found: false,
      writers: [],
      publishers: [],
      metadata: {},
      message: 'MLC authentication successful - search functionality temporarily disabled for testing',
      debug: {
        hasToken: !!accessToken,
        tokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : 'none'
      }
    });

  } catch (error) {
    console.error('MLC lookup error:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    return json({ 
      error: error.message || 'Unexpected error during MLC lookup',
      found: false,
      writers: [],
      publishers: [],
      metadata: {},
      debug: {
        errorName: error?.name,
        errorType: typeof error
      }
    }, 500);
  }
});