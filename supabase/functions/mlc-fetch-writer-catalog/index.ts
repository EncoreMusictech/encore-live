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
    const { firstName, lastName, ipi, title } = await req.json();

    if (!firstName && !lastName && !ipi && !title) {
      return json({ error: 'At least one search parameter is required (firstName, lastName, ipi, or title)' }, 400);
    }

    const mlcUsername = Deno.env.get('MLC_USERNAME');
    const mlcPassword = Deno.env.get('MLC_PASSWORD');

    if (!mlcUsername || !mlcPassword) {
      return json({ 
        error: 'MLC credentials not configured. Please set MLC_USERNAME and MLC_PASSWORD.',
        works: []
      });
    }

    console.log('Getting MLC access token for comprehensive catalog fetch...');
    
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
    
    // Build search parameters for comprehensive catalog search
    const searchParams: any = {};
    
    if (title) {
      searchParams.title = title;
    }
    
    if (firstName || lastName) {
      searchParams.writers = [{
        writerFirstName: firstName || '',
        writerLastName: lastName || ''
      }];
    }
    
    if (ipi) {
      searchParams.writers = searchParams.writers || [{}];
      searchParams.writers[0].writerIPI = ipi;
    }

    console.log('MLC comprehensive catalog search parameters:', JSON.stringify(searchParams, null, 2));

    // Search for all songs by the writer
    const songResponse = await fetch('https://public-api.themlc.com/search/songcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams)
    });

    console.log('MLC catalog search status:', songResponse.status);

    if (!songResponse.ok) {
      const errorText = await songResponse.text();
      console.log('MLC catalog search failed:', songResponse.status, errorText);
      return json({
        error: `MLC search failed: ${songResponse.status}`,
        works: []
      });
    }

    const songs = await songResponse.json();
    console.log(`MLC found ${songs?.length || 0} songs for catalog fetch`);

    if (!songs || songs.length === 0) {
      return json({
        works: [],
        message: 'No works found in MLC database'
      });
    }

    // Process each song to get comprehensive work details
    const works = [];
    const targetName = `${firstName || ''} ${lastName || ''}`.trim().toLowerCase();
    
    for (const song of songs) {
      if (!song.mlcSongCode) continue;
      
      try {
        console.log(`Fetching comprehensive details for: ${song.title || 'Unknown'} (${song.mlcSongCode})`);
        
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
        
        // Validate that our target writer is in this work
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
            if (ipi && writer.writerIPI === ipi) {
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
          // Search for recordings using the song code
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
              processedRecordings.push(...recordings.map((rec: any, index: number) => ({
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
        
        // Build the comprehensive work object
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
        console.log(`Added comprehensive work: "${workEntry.work_title}" with ${processedWriters.length} writers, ${processedPublishers.length} publishers, ${processedRecordings.length} recordings`);
        
      } catch (error) {
        console.log(`Error processing work ${song.mlcSongCode}:`, error);
        continue;
      }
    }

    console.log(`MLC comprehensive catalog fetch completed. Found ${works.length} works`);

    return json({
      works,
      total_found: works.length,
      search_parameters: { firstName, lastName, ipi, title },
      source: 'MLC Public API'
    });

  } catch (error) {
    console.error('MLC comprehensive catalog fetch error:', error);
    return json({ 
      error: error.message || 'Unexpected error during MLC catalog fetch',
      works: []
    }, 500);
  }
});