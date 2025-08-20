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

// Main MLC lookup function matching the specified interface
async function runMlcLookup(input: { firstName?: string; lastName?: string; ipi?: string; title?: string }) {
  const mlcUsername = Deno.env.get('MLC_USERNAME');
  const mlcPassword = Deno.env.get('MLC_PASSWORD');

  if (!mlcUsername || !mlcPassword) {
    throw new Error('MLC credentials not configured. Please set MLC_USERNAME and MLC_PASSWORD.');
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

  if (!authResponse.ok) {
    throw new Error(`MLC OAuth failed: ${authResponse.status}`);
  }

  const authData = await authResponse.json();
  if (authData.error) {
    throw new Error(`MLC OAuth error: ${authData.error} - ${authData.errorDescription || ''}`);
  }

  const accessToken = authData.accessToken;
  
  // Build search parameters
  const searchParams: any = {};
  
  if (input.title) {
    searchParams.title = input.title;
  }
  
  if (input.firstName || input.lastName) {
    searchParams.writers = [{
      writerFirstName: input.firstName || '',
      writerLastName: input.lastName || ''
    }];
  }
  
  if (input.ipi) {
    searchParams.writers = searchParams.writers || [{}];
    searchParams.writers[0].writerIPI = input.ipi;
  }

  console.log('MLC search parameters:', JSON.stringify(searchParams, null, 2));

  // Search for songs
  const songResponse = await fetch('https://public-api.themlc.com/search/songcode', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchParams)
  });

  if (!songResponse.ok) {
    const errorText = await songResponse.text();
    throw new Error(`MLC search failed: ${songResponse.status} - ${errorText}`);
  }

  const songs = await songResponse.json();
  console.log(`MLC found ${songs?.length || 0} songs`);

  if (!songs || songs.length === 0) {
    return [];
  }

  // Process each song to get comprehensive work details
  const works = [];
  const targetName = `${input.firstName || ''} ${input.lastName || ''}`.trim().toLowerCase();
  
  for (const song of songs) {
    if (!song.mlcSongCode) continue;
    
    try {
      console.log(`Fetching details for: ${song.title || 'Unknown'} (${song.mlcSongCode})`);
      
      // Get detailed work information
      const workResponse = await fetch('https://public-api.themlc.com/works', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ mlcsongCode: song.mlcSongCode }])
      });

      if (!workResponse.ok) {
        console.log(`Failed to fetch work details for ${song.mlcSongCode}: ${workResponse.status}`);
        continue;
      }

      const workDetails = await workResponse.json();
      if (!workDetails || workDetails.length === 0) continue;
      
      const work = workDetails[0];
      
      // Validate target writer is in this work
      let isTargetWriter = false;
      const processedWriters = [];
      
      if (work.writers && Array.isArray(work.writers)) {
        for (const writer of work.writers) {
          const writerFullName = `${writer.writerFirstName || ''} ${writer.writerLastName || ''}`.trim();
          const writerNameLower = writerFullName.toLowerCase();
          
          // Check if this matches our target writer
          if (targetName && (
            writerNameLower === targetName ||
            writerNameLower.includes(targetName) ||
            targetName.includes(writer.writerLastName?.toLowerCase() || '')
          )) {
            isTargetWriter = true;
          }
          
          // Check IPI match if provided
          if (input.ipi && writer.writerIPI === input.ipi) {
            isTargetWriter = true;
          }
          
          processedWriters.push({
            id: writer.writerIPI || `writer_${processedWriters.length}`,
            first_name: writer.writerFirstName || '',
            last_name: writer.writerLastName || '',
            ipi: writer.writerIPI || '',
            role: writer.writerRoleCode || 'songwriter'
          });
        }
      }
      
      // Only include works where our target writer is actually credited
      if (!isTargetWriter && targetName) {
        console.log(`Skipping work "${work.primaryTitle || song.title}" - target writer not found`);
        continue;
      }
      
      // Process publishers
      const processedPublishers = work.publishers?.map((pub: any, index: number) => ({
        id: pub.mlcPublisherNumber || `pub_${index}`,
        name: pub.publisherName || '',
        ipi: pub.publisherIpiNumber || '',
        role: 'publisher',
        mlc_publisher_number: pub.mlcPublisherNumber || '',
        collection_share: pub.collectionShare || 0
      })) || [];
      
      // Get recordings for this work
      const processedRecordings = [];
      try {
        const recordingResponse = await fetch('https://public-api.themlc.com/search/recordings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: work.primaryTitle || song.title,
            mlcsongCode: song.mlcSongCode
          })
        });
        
        if (recordingResponse.ok) {
          const recordings = await recordingResponse.json();
          if (recordings && Array.isArray(recordings)) {
            processedRecordings.push(...recordings.map((rec: any) => ({
              isrc: rec.isrc || '',
              title: rec.title || work.primaryTitle || song.title,
              artist: rec.artist || '',
              label: rec.label || ''
            })));
          }
        }
      } catch (error) {
        console.log(`Error fetching recordings for ${song.mlcSongCode}:`, error);
      }
      
      // Build the work object matching the specified interface
      const workEntry = {
        mlc_song_code: song.mlcSongCode,
        work_title: work.primaryTitle || work.title || song.title || 'Unknown Title',
        iswc: work.iswc || null,
        artists: song.artist || null,
        akas: [
          {
            id: 'primary',
            title: work.primaryTitle || song.title || 'Unknown Title',
            type: 'primary'
          }
        ],
        writers: processedWriters,
        publishers: processedPublishers,
        recordings: processedRecordings
      };
      
      works.push(workEntry);
      console.log(`Added work: "${workEntry.work_title}" with ${processedWriters.length} writers, ${processedPublishers.length} publishers, ${processedRecordings.length} recordings`);
      
    } catch (error) {
      console.log(`Error processing work ${song.mlcSongCode}:`, error);
      continue;
    }
  }

  console.log(`MLC lookup completed. Found ${works.length} works`);
  return works;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = await req.json();
    
    if (!input.firstName && !input.lastName && !input.ipi && !input.title) {
      return json({ error: 'At least one search parameter is required (firstName, lastName, ipi, or title)' }, 400);
    }

    console.log('Running MLC lookup with input:', input);
    
    const works = await runMlcLookup(input);
    
    return json({
      works,
      total_found: works.length,
      search_parameters: input,
      source: 'MLC Public API'
    });

  } catch (error) {
    console.error('MLC fetch writer catalog error:', error);
    return json({ 
      error: error.message || 'Unexpected error during MLC lookup',
      works: []
    }, 500);
  }
});