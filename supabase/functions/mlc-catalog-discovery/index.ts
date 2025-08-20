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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { writerName } = await req.json();

    if (!writerName) {
      return json({ error: 'Writer name is required' }, 400);
    }

    const mlcUsername = Deno.env.get('MLC_USERNAME');
    const mlcPassword = Deno.env.get('MLC_PASSWORD');

    if (!mlcUsername || !mlcPassword) {
      return json({ 
        error: 'MLC credentials not configured. Please set MLC_USERNAME and MLC_PASSWORD.',
        found: false,
        catalog: []
      });
    }

    console.log('Getting MLC access token for catalog discovery...');
    
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

    if (!authResponse.ok) {
      throw new Error(`MLC OAuth failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    if (authData.error) {
      throw new Error(`MLC OAuth error: ${authData.error} - ${authData.errorDescription || ''}`);
    }

    const accessToken = authData.accessToken;
    
    console.log('Searching MLC catalog for all works by writer:', writerName);
    
    // Search for songs by writer name
    const nameParts = writerName.trim().split(/\s+/);
    const searchBody: any = {};
    
    if (nameParts.length >= 2) {
      searchBody.writers = [{
        writerFirstName: nameParts[0],
        writerLastName: nameParts.slice(1).join(' ')
      }];
    } else {
      // If only one name part, use it as last name
      searchBody.writers = [{
        writerFirstName: '',
        writerLastName: nameParts[0]
      }];
    }

    console.log('MLC catalog search body:', JSON.stringify(searchBody, null, 2));

    const songResponse = await fetch('https://public-api.themlc.com/search/songcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchBody)
    });

    console.log('MLC catalog search status:', songResponse.status);

    if (!songResponse.ok) {
      const errorText = await songResponse.text();
      console.log('MLC catalog search failed:', songResponse.status, errorText);
      return json({
        found: false,
        catalog: [],
        error: `MLC search failed: ${songResponse.status}`
      });
    }

    const songs = await songResponse.json();
    console.log(`MLC catalog search found ${songs?.length || 0} songs`);
    console.log('MLC catalog response:', JSON.stringify(songs, null, 2));

    if (!songs || songs.length === 0) {
      return json({
        found: false,
        catalog: [],
        message: 'No works found in MLC database for this writer'
      });
    }

    // Process ALL songs found, not just the first one
    const catalogWorks = [];
    const searchName = writerName.toLowerCase().trim();
    
    for (const song of songs) {
      if (song.mlcSongCode) {
        console.log(`Fetching work details for song: ${song.title || 'Unknown'} (${song.mlcSongCode})`);
        
        try {
          const workResponse = await fetch('https://public-api.themlc.com/works', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ mlcsongCode: song.mlcSongCode }])
          });

          if (workResponse.ok) {
            const works = await workResponse.json();
            
            if (works && works.length > 0) {
              const work = works[0];
              
              // Validate that the target songwriter is actually listed as a writer
              let targetWriterFound = false;
              const writers = [];
              
              if (work.writers && Array.isArray(work.writers)) {
                targetWriterFound = work.writers.some((writer: any) => {
                  const writerName = `${writer.writerFirstName || ''} ${writer.writerLastName || ''}`.trim().toLowerCase();
                  return (
                    writerName === searchName || 
                    writerName.includes(searchName) ||
                    searchName.includes(writer.writerLastName?.toLowerCase() || '')
                  );
                });
                
                writers.push(...work.writers.map((writer: any) => ({
                  name: `${writer.writerFirstName || ''} ${writer.writerLastName || ''}`.trim(),
                  ipi: writer.writerIPI || '',
                  role: writer.writerRoleCode || 'songwriter',
                  share: writer.share || 0
                })));
              }
              
              // Only include works where the target writer is actually credited
              if (targetWriterFound) {
                const publishers = work.publishers?.map((pub: any) => ({
                  name: pub.publisherName || '',
                  ipi: pub.publisherIpiNumber || '',
                  share: pub.collectionShare || 0
                })) || [];
                
                catalogWorks.push({
                  title: work.primaryTitle || work.title || song.title || 'Unknown Title',
                  iswc: work.iswc || '',
                  mlcWorkId: work.membersSongId || work.workId || '',
                  mlcSongCode: song.mlcSongCode,
                  writers,
                  publishers,
                  confidence: 0.9, // High confidence for MLC data
                  source: 'MLC Public API'
                });
                
                console.log(`Added work: ${work.primaryTitle || song.title} to catalog`);
              } else {
                console.log(`Skipping work: ${work.primaryTitle || song.title} - target writer not found in writers list`);
              }
            }
          } else {
            console.log(`Failed to fetch work details for ${song.mlcSongCode}: ${workResponse.status}`);
          }
        } catch (error) {
          console.log(`Error processing song ${song.mlcSongCode}:`, error);
          // Continue processing other songs
        }
      }
    }

    console.log(`MLC catalog discovery completed. Found ${catalogWorks.length} works for ${writerName}`);

    return json({
      found: catalogWorks.length > 0,
      catalog: catalogWorks,
      totalFound: catalogWorks.length,
      searchedWriter: writerName,
      source: 'MLC Public API',
      message: `Found ${catalogWorks.length} works in MLC database`
    });

  } catch (error) {
    console.error('MLC catalog discovery error:', error);
    return json({ 
      error: error.message || 'Unexpected error during MLC catalog discovery',
      found: false,
      catalog: []
    }, 500);
  }
});