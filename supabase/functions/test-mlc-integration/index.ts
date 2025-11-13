import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const mlcUsername = Deno.env.get('MLC_USERNAME');
const mlcPassword = Deno.env.get('MLC_PASSWORD');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get MLC OAuth token
async function getMlcAccessToken() {
  if (!mlcUsername || !mlcPassword) {
    console.log('MLC credentials not configured');
    return { success: false, error: 'MLC credentials not configured' };
  }

  try {
    console.log(`Attempting to get MLC access token with username: ${mlcUsername}`);
    
    const response = await fetch('https://public-api.themlc.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: mlcUsername,
        password: mlcPassword
      }),
    });

    console.log(`MLC OAuth response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get MLC access token:', errorText);
      return { success: false, error: `OAuth failed: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    console.log('Successfully obtained MLC access token');
    return { success: true, token: data.idToken, data };
  } catch (error) {
    console.error('Error getting MLC access token:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Helper function to test MLC song lookup
async function testMlcLookup(accessToken: string) {
  try {
    console.log('Testing MLC song code search...');
    
    // Test with a well-known song
    const searchBody = {
      title: 'Yesterday',
      writers: [{
        writerFirstName: 'Paul',
        writerLastName: 'McCartney'
      }]
    };

    const response = await fetch('https://public-api.themlc.com/search/songcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchBody),
    });

    console.log(`MLC search response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('MLC search failed:', errorText);
      return { success: false, error: `Search failed: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    console.log('MLC search successful:', JSON.stringify(data));
    return { success: true, data };
  } catch (error) {
    console.error('Error in MLC lookup:', error);
    return { success: false, error: (error as Error).message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Testing MLC integration...');
    
    // Step 1: Test authentication
    const authResult = await getMlcAccessToken();
    if (!authResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication failed',
        details: authResult.error
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Test search
    const searchResult = await testMlcLookup(authResult.token);
    
    return new Response(JSON.stringify({
      success: true,
      auth: { success: authResult.success },
      search: searchResult,
      credentials_configured: !!(mlcUsername && mlcPassword)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});