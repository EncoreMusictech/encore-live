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

    // Try different search strategies based on what the official MLC website uses
    
    // Strategy 1: Direct writer name search (like the screenshot shows)
    if (writerName && !mlcData) {
      console.log('Searching MLC by writer name:', writerName);
      
      // Use the same endpoint structure as the official MLC site
      const writerSearchResponse = await fetch('https://public-api.themlc.com/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchType: 'writer',
          writerName: writerName.toUpperCase(), // MLC often expects uppercase
          pageSize: 50,
          pageNumber: 1
        })
      });

      console.log('Writer search status:', writerSearchResponse.status);
      console.log('Writer search headers:', Object.fromEntries(writerSearchResponse.headers.entries()));
      
      if (writerSearchResponse.ok) {
        const writerResults = await writerSearchResponse.json();
        console.log('Writer search response:', JSON.stringify(writerResults, null, 2));
        
        if (writerResults && writerResults.results && writerResults.results.length > 0) {
          mlcData = writerResults;
        }
      } else {
        const errorText = await writerSearchResponse.text();
        console.log('Writer search failed:', writerSearchResponse.status, errorText);
      }
    }

    // Strategy 2: Song/work title search  
    if (workTitle && !mlcData) {
      console.log('Searching MLC by work title:', workTitle);
      
      const titleSearchResponse = await fetch('https://public-api.themlc.com/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchType: 'work',
          workTitle: workTitle.toUpperCase(),
          pageSize: 50,
          pageNumber: 1
        })
      });

      if (titleSearchResponse.ok) {
        const titleResults = await titleSearchResponse.json();
        console.log('Title search response:', JSON.stringify(titleResults, null, 2));
        
        if (titleResults && titleResults.results && titleResults.results.length > 0) {
          mlcData = titleResults;
        }
      } else {
        console.log('Title search failed:', titleSearchResponse.status, await titleSearchResponse.text());
      }
    }

    // Strategy 3: ISRC search if provided
    if (isrc && !mlcData) {
      console.log('Searching MLC by ISRC:', isrc);
      
      const isrcSearchResponse = await fetch('https://public-api.themlc.com/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchType: 'recording',
          isrc: isrc,
          pageSize: 50,
          pageNumber: 1
        })
      });

      console.log('ISRC search status:', isrcSearchResponse.status);
      console.log('ISRC search headers:', Object.fromEntries(isrcSearchResponse.headers.entries()));
      
      if (isrcSearchResponse.ok) {
        const isrcResults = await isrcSearchResponse.json();
        console.log('ISRC search response:', JSON.stringify(isrcResults, null, 2));
        
        if (isrcResults && isrcResults.results && isrcResults.results.length > 0) {
          mlcData = isrcResults;
        }
      } else {
        const errorText = await isrcSearchResponse.text();
        console.log('ISRC search failed:', isrcSearchResponse.status, errorText);
        
        // Try alternative ISRC endpoint
        console.log('Trying alternative ISRC search endpoint...');
        const altIsrcResponse = await fetch('https://public-api.themlc.com/search/recordings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isrc: isrc
          })
        });
        
        console.log('Alternative ISRC search status:', altIsrcResponse.status);
        if (altIsrcResponse.ok) {
          const altIsrcResults = await altIsrcResponse.json();
          console.log('Alternative ISRC search response:', JSON.stringify(altIsrcResults, null, 2));
          
          if (altIsrcResults && altIsrcResults.length > 0) {
            mlcData = { results: altIsrcResults };
          }
        } else {
          const altErrorText = await altIsrcResponse.text();
          console.log('Alternative ISRC search also failed:', altIsrcResponse.status, altErrorText);
        }
      }
    }

    // Strategy 4: Try the legacy endpoints as fallback
    if (!mlcData && (workTitle || writerName)) {
      console.log('Trying legacy songcode search as fallback...');
      
      const searchBody: any = {};
      if (workTitle) searchBody.title = workTitle;
      if (writerName) {
        const nameParts = writerName.split(' ');
        if (nameParts.length >= 2) {
          searchBody.writers = [{
            writerFirstName: nameParts[0],
            writerLastName: nameParts.slice(1).join(' ')
          }];
        } else {
          searchBody.writers = [{
            writerFirstName: nameParts[0],
            writerLastName: nameParts[0]
          }];
        }
      }

      const songResponse = await fetch('https://public-api.themlc.com/search/songcode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody)
      });

      if (songResponse.ok) {
        const songs = await songResponse.json();
        console.log('Legacy songcode response:', JSON.stringify(songs, null, 2));

        if (songs && songs.length > 0) {
          // Convert to consistent format
          mlcData = { results: songs };
        }
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