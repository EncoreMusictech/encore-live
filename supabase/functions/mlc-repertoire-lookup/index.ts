import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get MLC OAuth token
async function getMlcAccessToken() {
  const mlcUsername = Deno.env.get('MLC_USERNAME');
  const mlcPassword = Deno.env.get('MLC_PASSWORD');

  if (!mlcUsername || !mlcPassword) {
    console.log('MLC credentials not configured');
    return { success: false, error: 'MLC credentials not configured' };
  }

  try {
    console.log(`Attempting to get MLC access token with username: ${mlcUsername}`);
    
    const response = await fetch('https://api.themlc.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${mlcUsername}&client_secret=${mlcPassword}`,
    });

    console.log(`MLC OAuth response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get MLC access token:', errorText);
      return { success: false, error: `OAuth failed: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    console.log('Successfully obtained MLC access token');
    return { success: true, token: data.access_token };
  } catch (error) {
    console.error('Error getting MLC access token:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to search MLC repertoire
async function searchMlcRepertoire(accessToken: string, params: any) {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.workTitle) searchParams.set('workTitle', params.workTitle);
    if (params.writerName) searchParams.set('writerName', params.writerName);
    if (params.publisherName) searchParams.set('publisherName', params.publisherName);
    if (params.iswc) searchParams.set('iswc', params.iswc);
    if (params.isrc) searchParams.set('isrc', params.isrc);

    console.log('Searching MLC repertoire with params:', searchParams.toString());
    
    const response = await fetch(`https://api.themlc.com/v1/mlc-repertoire-lookup?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log(`MLC repertoire search response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('MLC repertoire search failed:', errorText);
      return { 
        found: false, 
        error: `Search failed: ${response.status} - ${errorText}`,
        message: 'No works found in MLC database'
      };
    }

    const data = await response.json();
    console.log('MLC repertoire search successful');
    
    // Process the response to match expected format
    const hasResults = data.works && data.works.length > 0;
    
    return {
      found: hasResults,
      works: data.works || [],
      writers: data.writers || [],
      publishers: data.publishers || [],
      metadata: {
        confidence: hasResults ? 'high' : 'low',
        source: 'MLC API',
        searchParams: Object.fromEntries(searchParams),
        totalMatches: data.works ? data.works.length : 0
      },
      message: hasResults ? `Found ${data.works.length} work(s)` : 'No works found in MLC database'
    };
  } catch (error) {
    console.error('Error in MLC repertoire search:', error);
    return { 
      found: false, 
      error: error.message,
      message: 'Search error occurred'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('MLC repertoire lookup request:', body);
    
    // Step 1: Get authentication token
    const authResult = await getMlcAccessToken();
    if (!authResult.success) {
      return new Response(JSON.stringify({
        found: false,
        error: 'Authentication failed',
        message: 'MLC API authentication failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Search repertoire
    const searchResult = await searchMlcRepertoire(authResult.token, body);
    
    return new Response(JSON.stringify(searchResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('MLC repertoire lookup failed:', error);
    return new Response(JSON.stringify({
      found: false,
      error: error.message,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});