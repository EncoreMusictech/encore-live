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
    const { workTitle, writerName, publisherName, iswc, isrc } = await req.json();

    if (!workTitle && !writerName && !iswc && !isrc) {
      return json({ error: 'At least one search parameter is required' }, 400);
    }

    const mlcUsername = Deno.env.get('MLC_USERNAME');
    const mlcPassword = Deno.env.get('MLC_PASSWORD');

    if (!mlcUsername || !mlcPassword) {
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

    if (!authResponse.ok) {
      throw new Error(`MLC OAuth failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    if (authData.error) {
      throw new Error(`MLC OAuth error: ${authData.error} - ${authData.errorDescription || ''}`);
    }

    const accessToken = authData.accessToken;
    let mlcData: any;

    // Strategy 1: ISRC search using correct endpoint
    if (isrc && !mlcData) {
      console.log('Searching MLC recordings by ISRC:', isrc);
      
      const recordingResponse = await fetch('https://public-api.themlc.com/search/recordings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isrc: isrc,
          title: workTitle || undefined,
          artist: writerName || undefined
        })
      });

      console.log('Recording search status:', recordingResponse.status);

      if (recordingResponse.ok) {
        const recordings = await recordingResponse.json();
        console.log('MLC recordings response:', JSON.stringify(recordings, null, 2));

        if (recordings && recordings.length > 0) {
          const recording = recordings[0];
          console.log('Found recording with mlcsongCode:', recording.mlcsongCode);
          
          if (recording.mlcsongCode) {
            console.log('Fetching work details for mlcsongCode:', recording.mlcsongCode);
            
            const workResponse = await fetch('https://public-api.themlc.com/works', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify([{ mlcsongCode: recording.mlcsongCode }])
            });

            console.log('Work fetch status:', workResponse.status);
            
            if (workResponse.ok) {
              const works = await workResponse.json();
              console.log('Work details response:', JSON.stringify(works, null, 2));
              
              if (works && works.length > 0) {
                mlcData = { works };
              }
            } else {
              const errorText = await workResponse.text();
              console.log('Work fetch failed:', workResponse.status, errorText);
            }
          }
        }
      } else {
        const errorText = await recordingResponse.text();
        console.log('Recording search failed:', recordingResponse.status, errorText);
      }
    }

    // Strategy 2: Song/writer search using correct endpoint
    if (!mlcData && (workTitle || writerName)) {
      console.log('Searching MLC by songcode with title:', workTitle, 'writer:', writerName);
      
      const searchBody: any = {};
      if (workTitle) searchBody.title = workTitle;
      if (writerName) {
        const nameParts = writerName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          searchBody.writers = [{
            writerFirstName: nameParts[0],
            writerLastName: nameParts.slice(1).join(' ')
          }];
        } else {
          // If only one name part, use it as last name (common for single names)
          searchBody.writers = [{
            writerFirstName: '',
            writerLastName: nameParts[0]
          }];
        }
      }

      console.log('Songcode search body:', JSON.stringify(searchBody, null, 2));

      const songResponse = await fetch('https://public-api.themlc.com/search/songcode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody)
      });

      console.log('Songcode search status:', songResponse.status);

      if (songResponse.ok) {
        const songs = await songResponse.json();
        console.log('MLC songcode response:', JSON.stringify(songs, null, 2));

        if (songs && songs.length > 0) {
          const song = songs[0];
          console.log('Found song with mlcSongCode:', song.mlcSongCode);
          
          if (song.mlcSongCode) {
            console.log('Fetching work details for mlcSongCode:', song.mlcSongCode);
            
            const workResponse = await fetch('https://public-api.themlc.com/works', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify([{ mlcsongCode: song.mlcSongCode }])
            });

            console.log('Work fetch status:', workResponse.status);
            
            if (workResponse.ok) {
              const works = await workResponse.json();
              console.log('Work details response:', JSON.stringify(works, null, 2));
              
              if (works && works.length > 0) {
                mlcData = { works };
              }
            } else {
              const errorText = await workResponse.text();
              console.log('Work fetch failed:', workResponse.status, errorText);
            }
          }
        }
      } else {
        const errorText = await songResponse.text();
        console.log('Songcode search failed:', songResponse.status, errorText);
      }
    }

    if (!mlcData || (!mlcData.results && !mlcData.works) || 
        (mlcData.results && mlcData.results.length === 0) || 
        (mlcData.works && mlcData.works.length === 0)) {
      return json({
        found: false,
        writers: [],
        publishers: [],
        metadata: {},
        message: 'No works found in MLC database'
      });
    }

    // Process the first matching work - handle both new and legacy response formats
    let work: any;
    let totalMatches: number;
    
    if (mlcData.results && mlcData.results.length > 0) {
      work = mlcData.results[0];
      totalMatches = mlcData.results.length;
    } else if (mlcData.works && mlcData.works.length > 0) {
      work = mlcData.works[0];
      totalMatches = mlcData.works.length;
    } else {
      return json({
        found: false,
        writers: [],
        publishers: [],
        metadata: {},
        message: 'No valid work data found'
      });
    }
    
    console.log('Processing work:', JSON.stringify(work, null, 2));
    
    // Extract writers from MLC format (handle various response structures)
    let writers = [];
    if (work.writers && Array.isArray(work.writers)) {
      writers = work.writers.map((writer: any) => ({
        name: `${writer.writerFirstName || writer.firstName || ''} ${writer.writerLastName || writer.lastName || ''}`.trim(),
        ipi: writer.writerIPI || writer.ipi || '',
        role: writer.writerRoleCode || writer.role || 'songwriter',
        cae: writer.cae || '',
        share: writer.share || 0
      }));
    } else if (work.writerName) {
      // Single writer in the work object
      writers = [{
        name: work.writerName,
        ipi: work.writerIPI || '',
        role: 'songwriter',
        cae: '',
        share: 0
      }];
    }

    // Extract publishers from MLC format
    let publishers = [];
    if (work.publishers && Array.isArray(work.publishers)) {
      publishers = work.publishers.map((publisher: any) => ({
        name: publisher.publisherName || publisher.name || '',
        ipi: publisher.publisherIpiNumber || publisher.ipi || '',
        share: publisher.collectionShare || publisher.share || 0,
        cae: publisher.cae || '',
        mlcNumber: publisher.mlcPublisherNumber || publisher.number || ''
      }));
    }

    // Extract metadata
    const metadata = {
      workTitle: work.primaryTitle || work.title || work.workTitle || '',
      iswc: work.iswc || '',
      mlcWorkId: work.membersSongId || work.workId || '',
      mlcSongCode: work.mlcSongCode || work.songCode || '',
      territory: 'USA',
      rightsType: 'mechanical',
      source: 'MLC Public API'
    };

    // Calculate confidence score
    let confidence = 0.6;
    if (work.iswc) confidence += 0.2;
    if (writers.length > 0) confidence += 0.1;
    if (publishers.length > 0) confidence += 0.1;
    confidence = Math.min(1.0, confidence);

    const result = {
      found: true,
      writers,
      publishers,
      metadata,
      confidence,
      source: 'MLC Public API',
      totalMatches,
      verification_notes: `Found ${totalMatches} work(s) in MLC database`
    };

    console.log('Processed MLC result:', result);
    return json(result);

  } catch (error) {
    console.error('MLC lookup error:', error);
    return json({ 
      error: error.message || 'Unexpected error during MLC lookup',
      found: false,
      writers: [],
      publishers: [],
      metadata: {}
    }, 500);
  }
});