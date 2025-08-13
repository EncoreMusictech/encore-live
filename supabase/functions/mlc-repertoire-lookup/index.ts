import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const mlcUsername = Deno.env.get('MLC_USERNAME');
const mlcPassword = Deno.env.get('MLC_PASSWORD');

const supabase = createClient(supabaseUrl, serviceKey || '');

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Get MLC OAuth token
async function getMlcAccessToken(): Promise<string> {
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

  return authData.accessToken;
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
    const accessToken = await getMlcAccessToken();

    let mlcData: any;

    // If we have ISRC, search recordings first
    if (isrc) {
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

      if (!recordingResponse.ok) {
        throw new Error(`MLC recordings search failed: ${recordingResponse.status}`);
      }

      const recordings = await recordingResponse.json();
      console.log('MLC recordings response:', recordings);

      if (recordings && recordings.length > 0) {
        // Get the work details using the mlcsongCode from the recording
        const recording = recordings[0];
        if (recording.mlcsongCode) {
          const workResponse = await fetch('https://public-api.themlc.com/works', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ mlcsongCode: recording.mlcsongCode }])
          });

          if (workResponse.ok) {
            const works = await workResponse.json();
            if (works && works.length > 0) {
              mlcData = { works };
            }
          }
        }
      }
    }

    // If no results from ISRC search or no ISRC provided, try songcode search
    if (!mlcData && (workTitle || writerName)) {
      console.log('Searching MLC by songcode...');
      
      const searchBody: any = {};
      if (workTitle) searchBody.title = workTitle;
      if (writerName) {
        const [firstName, ...lastNameParts] = writerName.split(' ');
        searchBody.writers = [{
          writerFirstName: firstName,
          writerLastName: lastNameParts.join(' ') || firstName
        }];
      }

      const songResponse = await fetch('https://public-api.themlc.com/search/songcode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody)
      });

      if (!songResponse.ok) {
        throw new Error(`MLC songcode search failed: ${songResponse.status}`);
      }

      const songs = await songResponse.json();
      console.log('MLC songcode response:', songs);

      if (songs && songs.length > 0) {
        // Get full work details for the first result
        const song = songs[0];
        if (song.mlcSongCode) {
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
              mlcData = { works };
            }
          }
        }
      }
    }

    if (!mlcData || !mlcData.works || mlcData.works.length === 0) {
      return json({
        found: false,
        writers: [],
        publishers: [],
        metadata: {},
        message: 'No works found in MLC database'
      });
    }

    // Process the first matching work
    const work = mlcData.works[0];
    
    // Extract writers from MLC format
    const writers = (work.writers || []).map((writer: any) => ({
      name: `${writer.writerFirstName || ''} ${writer.writerLastName || ''}`.trim(),
      ipi: writer.writerIPI || '',
      role: writer.writerRoleCode || 'songwriter',
      cae: '',
      share: 0 // MLC doesn't provide ownership shares in this endpoint
    }));

    // Extract publishers from MLC format
    const publishers = (work.publishers || []).map((publisher: any) => ({
      name: publisher.publisherName || '',
      ipi: publisher.publisherIpiNumber || '',
      share: publisher.collectionShare || 0,
      cae: '',
      mlcNumber: publisher.mlcPublisherNumber || ''
    }));

    // Extract metadata
    const metadata = {
      workTitle: work.primaryTitle || '',
      iswc: work.iswc || '',
      mlcWorkId: work.membersSongId || '',
      mlcSongCode: work.mlcSongCode || '',
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
      totalMatches: mlcData.works.length,
      verification_notes: `Found ${mlcData.works.length} work(s) in MLC database`
    };

    console.log('Processed MLC result:', result);
    return json(result);

  } catch (error) {
    console.error('MLC lookup error:', error);
    console.error('Error details:', error?.stack || 'No stack trace');
    console.error('Request body was:', await req.clone().json().catch(() => 'Could not parse request body'));
    return json({ 
      error: error.message || 'Unexpected error during MLC lookup',
      found: false,
      writers: [],
      publishers: [],
      metadata: {}
    }, 500);
  }
});