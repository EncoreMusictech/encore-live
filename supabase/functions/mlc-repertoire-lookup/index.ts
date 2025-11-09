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
    return { success: true, token: data.accessToken };
  } catch (error) {
    console.error('Error getting MLC access token:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Helper function to search MLC repertoire
async function searchMlcRepertoire(accessToken: string, params: any) {
  try {
    // Step 1: Search for song code using title and writer
    const searchBody: any = {};
    
    if (params.workTitle) {
      searchBody.title = params.workTitle;
    }
    
    if (params.writerName) {
      const names = params.writerName.split(' ');
      searchBody.writers = [{
        writerFirstName: names[0],
        writerLastName: names.slice(1).join(' ') || names[0]
      }];
    }

    console.log('Searching MLC song codes with:', JSON.stringify(searchBody));
    
    const searchResponse = await fetch('https://public-api.themlc.com/search/songcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchBody),
    });

    console.log(`MLC song code search response status: ${searchResponse.status}`);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('MLC song code search failed:', errorText);
      return { 
        found: false, 
        error: `Search failed: ${searchResponse.status} - ${errorText}`,
        message: 'No works found in MLC database'
      };
    }

    const searchResults = await searchResponse.json();
    console.log('MLC song code search results:', JSON.stringify(searchResults));
    
    if (!searchResults || searchResults.length === 0) {
      return {
        found: false,
        works: [],
        writers: [],
        publishers: [],
        metadata: {
          confidence: 'low',
          source: 'MLC API',
          searchParams: searchBody,
          totalMatches: 0
        },
        message: 'No works found in MLC database'
      };
    }

    // Step 2: Get full work details using song codes
    const songCodes = searchResults.map((result: any) => ({ mlcsongCode: result.mlcSongCode }));
    
    const worksResponse = await fetch('https://public-api.themlc.com/works', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(songCodes),
    });

    if (!worksResponse.ok) {
      const errorText = await worksResponse.text();
      console.error('MLC works fetch failed:', errorText);
      return {
        found: true,
        works: searchResults,
        writers: [],
        publishers: [],
        metadata: {
          confidence: 'medium',
          source: 'MLC API',
          searchParams: searchBody,
          totalMatches: searchResults.length
        },
        message: `Found ${searchResults.length} work(s)`
      };
    }

    const works = await worksResponse.json();
    console.log('MLC works details retrieved');
    
    // Extract writers and publishers from works
    const allWriters = works.flatMap((work: any) => work.writers || []);
    const allPublishers = works.flatMap((work: any) => work.publishers || []);
    
    return {
      found: true,
      works: works,
      writers: allWriters,
      publishers: allPublishers,
      metadata: {
        confidence: 'high',
        source: 'MLC API',
        searchParams: searchBody,
        totalMatches: works.length
      },
      message: `Found ${works.length} work(s)`
    };
  } catch (error) {
    console.error('Error in MLC repertoire search:', error);
    return { 
      found: false, 
      error: (error as Error).message,
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
      error: (error as Error).message,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});