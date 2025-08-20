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

// Rate limiting and caching
const requestCache = new Map();
const rateLimiter = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 20;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, []);
  }
  
  const requests = rateLimiter.get(key).filter((time: number) => time > windowStart);
  
  if (requests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requests.push(now);
  rateLimiter.set(key, requests);
  return true;
}

function getCacheKey(params: any): string {
  return JSON.stringify({
    workTitle: params.workTitle,
    writerName: params.writerName,
    iswc: params.iswc,
    isrc: params.isrc
  });
}

async function getMlcAccessToken(): Promise<string> {
  const mlcUsername = Deno.env.get('MLC_USERNAME');
  const mlcPassword = Deno.env.get('MLC_PASSWORD');

  if (!mlcUsername || !mlcPassword) {
    throw new Error('MLC credentials not configured');
  }

  console.log('Getting MLC access token...');
  
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

async function fetchWorksByMlcSongCode(accessToken: string, mlcSongCode: string): Promise<any[]> {
  console.log('Fetching comprehensive work data for mlcSongCode:', mlcSongCode);
  
  const workResponse = await fetch('https://public-api.themlc.com/works', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ mlcsongCode: mlcSongCode }])
  });

  if (!workResponse.ok) {
    const errorText = await workResponse.text();
    console.log('Work fetch failed:', workResponse.status, errorText);
    return [];
  }

  const works = await workResponse.json();
  console.log('Comprehensive work data response:', JSON.stringify(works, null, 2));
  
  return works || [];
}

async function fetchRecordingsByISRC(accessToken: string, isrc: string, workTitle?: string, artist?: string): Promise<any[]> {
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
      artist: artist || undefined
    })
  });

  if (!recordingResponse.ok) {
    const errorText = await recordingResponse.text();
    console.log('Recording search failed:', recordingResponse.status, errorText);
    return [];
  }

  const recordings = await recordingResponse.json();
  console.log('MLC recordings response:', JSON.stringify(recordings, null, 2));
  
  return recordings || [];
}

async function searchWorksByTitleAndWriter(accessToken: string, workTitle?: string, writerName?: string): Promise<any[]> {
  if (!workTitle && !writerName) return [];
  
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

  if (!songResponse.ok) {
    const errorText = await songResponse.text();
    console.log('Songcode search failed:', songResponse.status, errorText);
    return [];
  }

  const songs = await songResponse.json();
  console.log('MLC songcode response:', JSON.stringify(songs, null, 2));
  
  return songs || [];
}

function processEnhancedMLCData(works: any[], recordings: any[] = []) {
  if (!works || works.length === 0) {
    return {
      found: false,
      writers: [],
      publishers: [],
      metadata: {},
      works: [],
      recordings: [],
      message: 'No works found in MLC database'
    };
  }

  const work = works[0];
  console.log('Processing enhanced work data:', JSON.stringify(work, null, 2));
  
  // Enhanced writers processing with full MLC structure
  let writers = [];
  if (work.writers && Array.isArray(work.writers)) {
    writers = work.writers.map((writer: any) => ({
      writerFirstName: writer.writerFirstName || '',
      writerLastName: writer.writerLastName || '',
      writerIPI: writer.writerIPI || writer.ipi || '',
      role: writer.writerRoleCode || writer.role || 'songwriter',
      cae: writer.cae || '',
      share: writer.share || 0,
      // Computed for backward compatibility
      name: `${writer.writerFirstName || ''} ${writer.writerLastName || ''}`.trim()
    }));
  }

  // Enhanced publishers processing with administrators and collection shares
  let publishers = [];
  if (work.publishers && Array.isArray(work.publishers)) {
    publishers = work.publishers.map((publisher: any) => ({
      publisherName: publisher.publisherName || publisher.name || '',
      administrators: publisher.administrators || [],
      collectionShare: publisher.collectionShare || [],
      publisherIpiNumber: publisher.publisherIpiNumber || publisher.ipi || '',
      mlcPublisherNumber: publisher.mlcPublisherNumber || publisher.number || '',
      cae: publisher.cae || '',
      // Computed for backward compatibility
      name: publisher.publisherName || publisher.name || '',
      ipi: publisher.publisherIpiNumber || publisher.ipi || '',
      share: publisher.collectionShare?.[0] || publisher.share || 0
    }));
  }

  // Enhanced metadata with full MLC structure
  const metadata = {
    workTitle: work.primaryTitle || work.title || work.workTitle || '',
    iswc: work.iswc || '',
    mlcWorkId: work.membersSongId || work.workId || '',
    mlcSongCode: work.mlcSongCode || work.songCode || '',
    territory: 'USA',
    rightsType: 'mechanical',
    source: 'Enhanced MLC Public API',
    artists: work.artists || ''
  };

  // Process recordings with full structure
  const processedRecordings = recordings.map((recording: any) => ({
    artist: recording.artist || '',
    id: recording.id || '',
    isrc: recording.isrc || '',
    labels: recording.labels || '',
    mlcsongCode: recording.mlcsongCode || '',
    title: recording.title || ''
  }));

  // Process works with full structure
  const processedWorks = works.map((w: any) => ({
    artists: w.artists || '',
    iswc: w.iswc || '',
    primaryTitle: w.primaryTitle || w.title || '',
    publishers: w.publishers || [],
    writers: w.writers || [],
    recordings: processedRecordings.filter(r => r.mlcsongCode === (w.mlcSongCode || w.songCode))
  }));

  // Enhanced confidence calculation
  let confidence = 0.6;
  if (work.iswc) confidence += 0.15;
  if (writers.length > 0) confidence += 0.1;
  if (publishers.length > 0) confidence += 0.1;
  if (recordings.length > 0) confidence += 0.05;
  confidence = Math.min(1.0, confidence);

  return {
    found: true,
    writers,
    publishers,
    metadata,
    works: processedWorks,
    recordings: processedRecordings,
    confidence,
    source: 'Enhanced MLC Public API',
    totalMatches: works.length,
    verification_notes: `Found ${works.length} work(s) and ${recordings.length} recording(s) in MLC database`
  };
}

async function performEnhancedMLCLookup(params: any): Promise<any> {
  const { workTitle, writerName, publisherName, iswc, isrc, enhanced, includeRecordings } = params;
  
  // Check cache first
  const cacheKey = getCacheKey(params);
  const cached = requestCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('Returning cached result for:', cacheKey);
    return { ...cached.data, cached: true };
  }

  // Check rate limit
  if (!checkRateLimit('mlc-api')) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  const accessToken = await getMlcAccessToken();
  let allWorks: any[] = [];
  let allRecordings: any[] = [];

  // Strategy 1: ISRC search with enhanced recording data
  if (isrc && includeRecordings) {
    const recordings = await fetchRecordingsByISRC(accessToken, isrc, workTitle, writerName);
    allRecordings.push(...recordings);
    
    // For each recording, fetch comprehensive work data
    for (const recording of recordings) {
      if (recording.mlcsongCode) {
        const works = await fetchWorksByMlcSongCode(accessToken, recording.mlcsongCode);
        allWorks.push(...works);
      }
    }
  }

  // Strategy 2: Title/writer search with comprehensive work data
  if (!allWorks.length && (workTitle || writerName)) {
    const songs = await searchWorksByTitleAndWriter(accessToken, workTitle, writerName);
    
    // For each song found, fetch comprehensive work data
    for (const song of songs) {
      if (song.mlcSongCode) {
        const works = await fetchWorksByMlcSongCode(accessToken, song.mlcSongCode);
        allWorks.push(...works);
      }
    }
  }

  const result = processEnhancedMLCData(allWorks, allRecordings);
  
  // Cache the result
  requestCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Handle bulk lookups
    if (body.bulk && body.searches) {
      console.log('Processing bulk MLC lookup for', body.searches.length, 'searches');
      
      const results = [];
      const batchSize = 3; // Process in small batches to respect rate limits
      
      for (let i = 0; i < body.searches.length; i += batchSize) {
        const batch = body.searches.slice(i, i + batchSize);
        const batchPromises = batch.map((params: any) => 
          performEnhancedMLCLookup({
            ...params,
            enhanced: body.enhanced,
            includeRecordings: body.includeRecordings
          }).catch(error => ({
            found: false,
            error: error.message,
            writers: [],
            publishers: [],
            metadata: {},
            works: [],
            recordings: []
          }))
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < body.searches.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return json({
        success: true,
        results,
        totalProcessed: body.searches.length,
        source: 'Enhanced MLC Bulk Lookup'
      });
    }
    
    // Handle single lookup
    const result = await performEnhancedMLCLookup(body);
    return json(result);

  } catch (error) {
    console.error('Enhanced MLC lookup error:', error);
    return json({ 
      error: error.message || 'Unexpected error during enhanced MLC lookup',
      found: false,
      writers: [],
      publishers: [],
      metadata: {},
      works: [],
      recordings: []
    }, 500);
  }
});