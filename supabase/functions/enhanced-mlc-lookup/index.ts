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
    writers: Array.isArray(params.writers) ? params.writers.map((w: any) => ({
      f: w.writerFirstName || '',
      l: w.writerLastName || '',
      i: w.writerIPI || ''
    })) : undefined,
    writerName: params.writerName,
    artistName: params.artistName,
    iswc: params.iswc,
    isrc: params.isrc,
    searchType: params.searchType
  });
}

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  shouldRetry: (error: any) => boolean = () => true
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retriable error
      if (!shouldRetry(error)) {
        console.log(`Non-retriable error on attempt ${attempt + 1}, not retrying:`, error.message);
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        console.log(`Max retries (${maxRetries}) reached, throwing error`);
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
      const totalDelay = delay + jitter;
      
      console.log(`Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${Math.round(totalDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
}

// Determine if error should be retried
function isRetriableError(error: any): boolean {
  // Don't retry authentication errors (401, 403)
  if (error.status === 401 || error.status === 403) {
    console.log('Authentication error detected, not retriable');
    return false;
  }
  
  // Don't retry bad request errors (400)
  if (error.status === 400) {
    console.log('Bad request error detected, not retriable');
    return false;
  }
  
  // Retry on:
  // - Network errors
  // - Timeout errors
  // - Server errors (500-599)
  // - Rate limit errors (429)
  // - Service unavailable (503)
  if (
    error.status === 429 ||
    error.status === 503 ||
    (error.status >= 500 && error.status < 600) ||
    error.message?.includes('network') ||
    error.message?.includes('timeout') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ETIMEDOUT')
  ) {
    return true;
  }
  
  return false;
}

async function getMlcAccessToken(): Promise<{ accessToken: string; tokenType: string; authHeader: string }> {
  // Check if user provided their own OAuth token
  const mlcAccessToken = Deno.env.get('MLC_ACCESS_TOKEN');
  
  console.log('MLC_ACCESS_TOKEN present:', !!mlcAccessToken);
  console.log('MLC_ACCESS_TOKEN length:', mlcAccessToken?.length || 0);
  
  if (mlcAccessToken && mlcAccessToken.trim().length > 0) {
    const trimmedToken = mlcAccessToken.trim();
    console.log('✓ Using provided MLC access token (direct auth)');
    console.log('Token starts with:', trimmedToken.substring(0, 20) + '...');
    
    // Check if token is JSON (sometimes OAuth responses come as JSON objects)
    try {
      const parsed = JSON.parse(trimmedToken);
      if (parsed.accessToken || parsed.access_token) {
        const actualToken = parsed.accessToken || parsed.access_token;
        console.log('Extracted token from JSON object');
        const tokenType = 'Bearer';
        const authHeader = `${tokenType} ${actualToken}`;
        return { accessToken: actualToken, tokenType, authHeader };
      }
    } catch {
      // Not JSON, use as-is
    }
    
    const tokenType = 'Bearer';
    const authHeader = `${tokenType} ${trimmedToken}`;
    console.log('Auth header format:', authHeader.substring(0, 30) + '...');
    return { accessToken: trimmedToken, tokenType, authHeader };
  }

  // Fall back to username/password OAuth flow
  console.log('No MLC_ACCESS_TOKEN found, falling back to username/password OAuth');
  const mlcUsername = Deno.env.get('MLC_USERNAME');
  const mlcPassword = Deno.env.get('MLC_PASSWORD');

  if (!mlcUsername || !mlcPassword) {
    console.error('MLC credentials not configured - need either MLC_ACCESS_TOKEN or MLC_USERNAME + MLC_PASSWORD');
    throw new Error('MLC credentials not configured');
  }

  console.log('Getting MLC access token with username:', mlcUsername ? `${mlcUsername.substring(0, 3)}***` : 'undefined');

  const { accessToken, tokenType } = await retryWithBackoff(
    async () => {
      const authResponse = await fetch('https://public-api.themlc.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: mlcUsername,
          password: mlcPassword,
        }),
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error('MLC OAuth failed:', authResponse.status, errorText);
        const error: any = new Error(`MLC OAuth failed: ${authResponse.status} - ${errorText}`);
        error.status = authResponse.status;
        throw error;
      }

      const authData = await authResponse.json();
      console.log('MLC OAuth response (keys):', Object.keys(authData));
      const token = authData.idToken || authData.accessToken;
      const tokenType = 'Bearer';

      if (authData.error) {
        console.error('MLC OAuth error:', authData.error, authData.errorDescription);
        throw new Error(`MLC OAuth error: ${authData.error} - ${authData.errorDescription || ''}`);
      }

      if (!token) {
        console.error('No usable token (idToken/accessToken) in OAuth response:', authData);
        throw new Error('No token received from MLC');
      }

      return { accessToken: token as string, tokenType };
    },
    3, // maxRetries
    1000, // baseDelay
    isRetriableError
  );

  const authHeader = `${tokenType} ${accessToken}`;
  console.log('Successfully obtained MLC access token, auth header format:', `${tokenType} ${accessToken.substring(0, 10)}...`);
  return { accessToken, tokenType, authHeader };
}

// Helper to force username/password OAuth flow (bypasses MLC_ACCESS_TOKEN)
async function getMlcAccessTokenViaPassword(): Promise<{ accessToken: string; tokenType: string; authHeader: string }> {
  const mlcUsername = Deno.env.get('MLC_USERNAME');
  const mlcPassword = Deno.env.get('MLC_PASSWORD');

  if (!mlcUsername || !mlcPassword) {
    throw new Error('MLC username/password not configured');
  }

  console.log('Forcing OAuth password flow for user:', mlcUsername ? `${mlcUsername.substring(0,3)}***` : 'undefined');

  const { accessToken, tokenType } = await retryWithBackoff(
    async () => {
      const authResponse = await fetch('https://public-api.themlc.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: mlcUsername,
          password: mlcPassword,
        }),
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        const error: any = new Error(`MLC OAuth failed: ${authResponse.status} - ${errorText}`);
        error.status = authResponse.status;
        throw error;
      }

      const authData = await authResponse.json();
      const token = authData.idToken || authData.accessToken;
      const tokenType = 'Bearer';
      if (authData.error || !token) {
        throw new Error(`MLC OAuth error: ${authData.error || 'No token received'}`);
      }
      return { accessToken: token as string, tokenType };
    },
    2,
    800,
    isRetriableError
  );

  const authHeader = `${tokenType} ${accessToken}`;
  console.log('Obtained fresh OAuth token via password flow');
  return { accessToken, tokenType, authHeader };
}

// Wrapper: retry once with fresh OAuth token on 401 Unauthorized
async function callWithAuth<T>(initialAuthHeader: string, fn: (authHeader: string) => Promise<T>): Promise<T> {
  try {
    return await fn(initialAuthHeader);
  } catch (e: any) {
    if (e?.status === 401) {
      console.log('401 Unauthorized with provided token, attempting password-flow fallback');
      try {
        const fresh = await getMlcAccessTokenViaPassword();
        return await fn(fresh.authHeader);
      } catch (inner) {
        console.error('Fallback OAuth attempt failed:', inner);
        throw e; // keep original error semantics
      }
    }
    throw e;
  }
}

async function fetchWorksByMlcSongCode(authHeader: string, mlcSongCode: string): Promise<any[]> {
  console.log('Fetching comprehensive work data for mlcSongCode:', mlcSongCode);
  
  return await retryWithBackoff(
    async () => {
      const workResponse = await fetch('https://public-api.themlc.com/works', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ mlcsongCode: mlcSongCode }])
      });

      if (!workResponse.ok) {
        const errorText = await workResponse.text();
        console.log('Work fetch failed:', workResponse.status, errorText);
        const error: any = new Error(`MLC API error: ${workResponse.status}`);
        error.status = workResponse.status;
        throw error;
      }

      const works = await workResponse.json();
      console.log('Comprehensive work data response:', JSON.stringify(works, null, 2));
      
      return works || [];
    },
    3, // maxRetries
    1000, // baseDelay
    isRetriableError
  );
}

async function fetchRecordingsByISRC(authHeader: string, isrc: string, workTitle?: string, artist?: string): Promise<any[]> {
  console.log('Searching MLC recordings by ISRC:', isrc, 'title:', workTitle, 'artist:', artist);
  
  return await retryWithBackoff(
    async () => {
      const searchBody: any = { isrc: isrc };
      if (workTitle) searchBody.title = workTitle;
      if (artist) searchBody.artist = artist;
      
      console.log('Recording search request body:', JSON.stringify(searchBody, null, 2));
      
      const recordingResponse = await fetch('https://public-api.themlc.com/search/recordings', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody)
      });

      if (!recordingResponse.ok) {
        const errorText = await recordingResponse.text();
        console.log('Recording search failed:', recordingResponse.status, errorText);
        const error: any = new Error(`MLC API error: ${recordingResponse.status}`);
        error.status = recordingResponse.status;
        throw error;
      }

      const recordings = await recordingResponse.json();
      console.log('MLC recordings response:', recordings?.length || 0, 'recordings found');
      
      return recordings || [];
    },
    3, // maxRetries
    1000, // baseDelay
    isRetriableError
  );
}

// New: fallback recording search by title and/or artist (no ISRC required)
async function fetchRecordingsByTitleArtist(authHeader: string, workTitle?: string, artist?: string): Promise<any[]> {
  if (!workTitle && !artist) return [];
  console.log('Searching MLC recordings by title/artist:', { workTitle, artist });

  return await retryWithBackoff(
    async () => {
      const searchBody: any = {};
      if (workTitle) searchBody.title = workTitle;
      if (artist) searchBody.artist = artist;

      console.log('Recording title/artist request body:', JSON.stringify(searchBody, null, 2));

      console.log('Using auth header for recordings search:', authHeader.substring(0, 30) + '...');
      
      const recordingResponse = await fetch('https://public-api.themlc.com/search/recordings', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody)
      });

      if (!recordingResponse.ok) {
        const errorText = await recordingResponse.text();
        console.log('Recording title/artist search failed:', recordingResponse.status, errorText);
        const error: any = new Error(`MLC API error: ${recordingResponse.status}`);
        error.status = recordingResponse.status;
        throw error;
      }

      const recordings = await recordingResponse.json();
      console.log('MLC recordings (title/artist) response:', recordings?.length || 0, 'recordings found');
      return recordings || [];
    },
    3,
    1000,
    isRetriableError
  );
}

async function searchWorksByTitleAndWriters(
  authHeader: string,
  workTitle?: string,
  writers?: Array<{ writerFirstName?: string; writerLastName?: string; writerIPI?: string }> ,
  catalogDiscovery = false
): Promise<any[]> {
  if (!workTitle && (!writers || writers.length === 0)) return [];
  
  console.log('Searching MLC by songcode with title and writers:', { workTitle, writersCount: writers?.length || 0, catalogDiscovery });
  
  const searchBody: any = {};
  if (workTitle) searchBody.title = workTitle;
  if (writers && writers.length > 0) {
    // Map to MLC required fields only
    searchBody.writers = writers.map(w => ({
      writerFirstName: w.writerFirstName || '',
      writerLastName: w.writerLastName || '',
      writerIPI: w.writerIPI || undefined
    }));
  }

  // For catalog discovery, implement pagination to get all results
  let allSongs: any[] = [];
  let page = 1;
  const pageSize = 50; // MLC API default page size
  let hasMoreResults = true;

  while (hasMoreResults && (catalogDiscovery ? page <= 20 : page <= 1)) { // Limit to 20 pages (1000 songs max) for catalog discovery
    const paginatedSearchBody = {
      ...searchBody,
      page: page,
      pageSize: pageSize
    };

    console.log(`Songcode search page ${page}, body:`, JSON.stringify(paginatedSearchBody, null, 2));
    console.log('Using auth header for songcode search:', authHeader.substring(0, 30) + '...');

    const songs = await retryWithBackoff(
      async () => {
        const songResponse = await fetch('https://public-api.themlc.com/search/songcode', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paginatedSearchBody)
        });

        if (!songResponse.ok) {
          const errorText = await songResponse.text();
          console.log(`Songcode search failed on page ${page}:`, songResponse.status, errorText);
          const error: any = new Error(`MLC API error: ${songResponse.status}`);
          error.status = songResponse.status;
          throw error;
        }

        return await songResponse.json();
      },
      3, // maxRetries
      1000, // baseDelay
      isRetriableError
    ).catch(error => {
      console.log(`All retry attempts failed for page ${page}:`, error.message);
      // Surface auth errors to caller so UI can show a clear message
      if (error?.status === 401 || error?.status === 403) {
        throw error;
      }
      return null;
    });
    console.log(`MLC songcode response page ${page}:`, songs?.length || 0, 'songs');
    
    if (!songs || songs.length === 0) {
      hasMoreResults = false;
      break;
    }

    allSongs.push(...songs);
    
    // If we got less than pageSize results, we've reached the end
    if (songs.length < pageSize) {
      hasMoreResults = false;
      break;
    }

    page++;
    
    // Add small delay between requests to respect rate limits
    if (hasMoreResults) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`Total MLC songcode results: ${allSongs.length} songs across ${page - 1} pages`);
  return allSongs;
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
  const { workTitle, writerName, writers, artistName, publisherName, iswc, isrc, enhanced, includeRecordings, searchType } = params;
  const catalogDiscovery = searchType === 'catalog_discovery';
  
  console.log('=== Enhanced MLC Lookup Started ===');
  console.log('Search params:', { 
    workTitle, 
    writerName, 
    writersCount: Array.isArray(writers) ? writers.length : 0,
    artistName, 
    iswc, 
    isrc, 
    searchType,
    catalogDiscovery 
  });
  
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

  const { accessToken, tokenType, authHeader } = await getMlcAccessToken();
  console.log('Using auth header for API calls:', authHeader.substring(0, 20) + '...');
  let allWorks: any[] = [];
  let allRecordings: any[] = [];

  // Strategy 1: ISRC search with enhanced recording data (prioritize this method)
  if (isrc) {
    console.log('Strategy 1: Searching by ISRC with artist and title context');
    const recordings = await callWithAuth(authHeader, (hdr) => fetchRecordingsByISRC(hdr, isrc, workTitle, artistName));
    
    if (recordings.length > 0) {
      console.log(`Found ${recordings.length} recordings by ISRC`);
      allRecordings.push(...recordings);
      
      // For each recording, fetch comprehensive work data
      for (const recording of recordings) {
        if (recording.mlcsongCode) {
          const works = await fetchWorksByMlcSongCode(authHeader, recording.mlcsongCode);
          allWorks.push(...works);
        }
      }
    } else {
      console.log('No recordings found by ISRC, will try other strategies');
    }
  }

  // Strategy 1b: Recording search by title and/or artist to obtain mlcSongCode
  if (!allWorks.length && (workTitle || artistName)) {
    console.log('Strategy 1b: Searching recordings by title/artist to derive works');
    try {
      const recs = await callWithAuth(authHeader, (hdr) => fetchRecordingsByTitleArtist(hdr, workTitle, artistName));
      if (recs.length > 0) {
        console.log(`Found ${recs.length} recordings by title/artist`);
        allRecordings.push(...recs);
        for (const recording of recs) {
          if (recording.mlcsongCode) {
            const works = await callWithAuth(authHeader, (hdr) => fetchWorksByMlcSongCode(hdr, recording.mlcsongCode));
            allWorks.push(...works);
          }
        }
      }
    } catch (e) {
      console.log('Strategy 1b failed:', e?.message || e);
    }
  }

  // Strategy 2: Title + writers search with comprehensive work data
  if (!allWorks.length && (workTitle || (Array.isArray(writers) && writers.length > 0) || writerName)) {
    console.log('Strategy 2: Searching by title/writers');
    
    let songs: any[] = [];

    // Prefer structured writers array if provided
    if (Array.isArray(writers) && writers.length > 0) {
      console.log('Trying search with structured writers array');
      songs = await callWithAuth(authHeader, (hdr) => searchWorksByTitleAndWriters(hdr, workTitle, writers, catalogDiscovery));
    }

    // Fallback: split writerName string if no writers array or no results
    if (songs.length === 0 && writerName) {
      const nameParts = writerName.trim().split(/\s+/);
      const fallbackWriter = [{
        writerFirstName: nameParts.length >= 2 ? nameParts[0] : '',
        writerLastName: nameParts.length >= 2 ? nameParts.slice(1).join(' ') : nameParts[0]
      }];
      console.log('Trying search with writerName fallback:', fallbackWriter[0]);
      songs = await callWithAuth(authHeader, (hdr) => searchWorksByTitleAndWriters(hdr, workTitle, fallbackWriter, catalogDiscovery));
    }

    // Final fallback: title-only search
    if (songs.length === 0 && workTitle) {
      console.log('Trying title-only search');
      songs = await callWithAuth(authHeader, (hdr) => searchWorksByTitleAndWriters(hdr, workTitle, undefined, catalogDiscovery));
    }

    console.log(`Found ${songs.length} songs from MLC search, ${catalogDiscovery ? 'catalog discovery mode' : 'single lookup mode'}`);
    
    // For catalog discovery, process songs in batches to avoid overwhelming the API
    const batchSize = catalogDiscovery ? 10 : songs.length;
    
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(songs.length/batchSize)} with ${batch.length} songs`);
      
      // Process batch in parallel with some delay
      const batchPromises = batch.map(async (song, index) => {
        // Add small staggered delay within batch
        if (index > 0) await new Promise(resolve => setTimeout(resolve, index * 100));
        
        if (song.mlcSongCode) {
          try {
            const works = await callWithAuth(authHeader, (hdr) => fetchWorksByMlcSongCode(hdr, song.mlcSongCode));
            return works;
          } catch (error) {
            console.error(`Failed to fetch work data for song code ${song.mlcSongCode}:`, error);
            return [];
          }
        }
        return [];
      });
      
      const batchResults = await Promise.all(batchPromises);
      allWorks.push(...batchResults.flat());
      
      // Add delay between batches for catalog discovery
      if (catalogDiscovery && i + batchSize < songs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  const result = processEnhancedMLCData(allWorks, allRecordings);
  
  console.log('=== Enhanced MLC Lookup Complete ===');
  console.log('Result summary:', {
    found: result.found,
    worksCount: result.works?.length || 0,
    recordingsCount: result.recordings?.length || 0,
    writersCount: result.writers?.length || 0,
    publishersCount: result.publishers?.length || 0,
    confidence: result.confidence
  });
  
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

  } catch (error: any) {
    console.error('Enhanced MLC lookup error:', error);
    
    // Provide specific error messages for common issues
    let errorMessage = 'Unexpected error during MLC lookup';
    let statusCode = 500;
    
    if (error?.status === 401 || error?.status === 403) {
      errorMessage = 'MLC Authentication Failed: Invalid credentials or expired access token. Please verify your MLC_USERNAME, MLC_PASSWORD, or MLC_ACCESS_TOKEN in your Supabase secrets.';
      statusCode = 401;
      console.error('❌ MLC Authentication Error - Check credentials in Supabase secrets');
    } else if (error?.status === 429) {
      errorMessage = 'MLC Rate Limit Exceeded: Too many requests. Please wait a moment and try again.';
      statusCode = 429;
    } else if (error?.status === 400) {
      errorMessage = 'Invalid Request: The MLC API rejected the search parameters. Please check your input data.';
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      // Check for specific error patterns
      if (errorMessage.includes('credentials not configured')) {
        errorMessage = 'MLC credentials are not configured. Please add MLC_USERNAME and MLC_PASSWORD (or MLC_ACCESS_TOKEN) to your Supabase secrets.';
        statusCode = 503;
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        errorMessage = 'Network Error: Unable to reach MLC API. Please check your internet connection and try again.';
        statusCode = 503;
      }
    }
    
    return json({ 
      error: errorMessage,
      found: false,
      writers: [],
      publishers: [],
      metadata: {},
      works: [],
      recordings: [],
      errorCode: error?.status || statusCode,
      timestamp: new Date().toISOString()
    }, statusCode);
  }
});