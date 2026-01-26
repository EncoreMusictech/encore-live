import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-assistant-secret',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sharedSecret = Deno.env.get('ASSISTANT_SHARED_SECRET') || '';
const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY') || '';

// INCREASED CAPS for comprehensive catalog discovery
const DEFAULT_MAX_SONGS = 150;
const MAX_SONGS_HARD_CAP = 500;
const WORK_DETAILS_HARD_CAP = 50;
const PROCESS_TIME_BUDGET_MS = 90_000; // Increased to 90 seconds
const FETCH_TIMEOUT_MS = 10_000;

const supabase = createClient(supabaseUrl, serviceKey);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Generate writer name variants for comprehensive searching
function generateNameVariants(name: string): string[] {
  const variants = new Set<string>();
  const normalized = name.trim();
  variants.add(normalized);
  
  // Common patterns: "Usher" -> "Usher Raymond", "Usher Raymond IV"
  const parts = normalized.split(/\s+/);
  
  // Add as-is
  variants.add(normalized.toLowerCase());
  variants.add(normalized.toUpperCase());
  
  // If single name (stage name), try common full name patterns
  if (parts.length === 1) {
    // For known artists, add full legal names
    const knownAliases: Record<string, string[]> = {
      'usher': ['usher raymond', 'usher raymond iv', 'usher terrence raymond', 'usher terrence raymond iv'],
      'beyonce': ['beyoncé knowles', 'beyonce knowles', 'beyoncé knowles-carter'],
      'rihanna': ['robyn fenty', 'robyn rihanna fenty'],
      'drake': ['aubrey graham', 'aubrey drake graham'],
      'eminem': ['marshall mathers', 'marshall bruce mathers iii'],
      'madonna': ['madonna ciccone', 'madonna louise ciccone'],
      'prince': ['prince rogers nelson'],
      'cher': ['cherilyn sarkisian'],
    };
    const lower = normalized.toLowerCase();
    if (knownAliases[lower]) {
      knownAliases[lower].forEach(v => variants.add(v));
    }
  }
  
  // If multi-part name, generate variations
  if (parts.length >= 2) {
    // Last, First format
    variants.add(`${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`);
    // First Last
    variants.add(parts.join(' '));
    // First initial + Last
    variants.add(`${parts[0][0]}. ${parts.slice(1).join(' ')}`);
  }
  
  // Remove empty strings and duplicates
  return Array.from(variants).filter(v => v.length > 0);
}

async function fetchJSON(url: string, retries = 3, timeoutMs = FETCH_TIMEOUT_MS): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EncoreMusicIP/1.0 (support@encore.local)',
          'Accept': 'application/json'
        }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
      return await resp.json();
    } catch (err) {
      const isLast = attempt === retries;
      console.log(`fetchJSON attempt ${attempt}/${retries} failed for ${url.substring(0, 80)}...`);
      if (isLast) throw err;
      await new Promise(r => setTimeout(r, 500 * attempt)); // backoff
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function findArtistMBID(writerName: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${writerName}`);
    const data = await fetchJSON(`https://musicbrainz.org/ws/2/artist?query=artist:${q}%20AND%20(type:person%20OR%20type:group)&fmt=json&limit=10`);
    const artists = data?.artists || [];
    if (!artists.length) {
      console.log(`MusicBrainz: No artists found for "${writerName}"`);
      return null;
    }
    // Only return exact name match (case-insensitive) - don't fall back to partial matches
    const normalized = writerName.toLowerCase().trim();
    const exact = artists.find((a: any) => {
      const artistName = (a.name || '').toLowerCase().trim();
      return artistName === normalized;
    });
    if (exact) {
      console.log(`MusicBrainz: Found exact match for "${writerName}": ${exact.name} (${exact.id})`);
      return exact.id;
    }
    // No exact match - don't return wrong artist
    console.log(`MusicBrainz: No exact match for "${writerName}". Found: ${artists.slice(0, 3).map((a: any) => a.name).join(', ')}`);
    return null;
  } catch (_e) {
    console.error(`MusicBrainz artist search error:`, _e);
    return null;
  }
}

async function fetchAllWorksByArtist(artistId: string, max = 500): Promise<any[]> {
  // MusicBrainz "work" browse by artist isn't reliable; prefer search using arid and paginate
  const results: any[] = [];
  const seen = new Set<string>();
  let offset = 0;
  const pageSize = 100;
  while (results.length < max) {
    const limit = Math.min(pageSize, max - results.length);
    try {
      const q = encodeURIComponent(`arid:${artistId}`);
      const data = await fetchJSON(`https://musicbrainz.org/ws/2/work?query=${q}&fmt=json&limit=${limit}&offset=${offset}`);
      const works = data?.works || [];
      for (const w of works) {
        if (w?.id && !seen.has(w.id)) {
          seen.add(w.id);
          results.push(w);
        }
      }
      const total = data?.['work-count'] ?? works.length;
      console.log(`MusicBrainz works: fetched ${results.length}/${total} (offset ${offset})`);
      if (!works.length || results.length >= total) break;
      offset += works.length;
      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 300));
    } catch (_e) {
      console.error('MusicBrainz pagination error:', _e);
      break;
    }
  }
  return results;
}

async function searchWorksByWriterName(writerName: string, limit = 200): Promise<any[]> {
  const results: any[] = [];
  const seen = new Set<string>();
  const queries = [
    `writer:"${writerName}"`,
    `artistname:"${writerName}"`,
    `artist:"${writerName}"`
  ];
  for (const base of queries) {
    let offset = 0;
    while (results.length < limit) {
      const page = Math.min(100, limit - results.length);
      try {
        const q = encodeURIComponent(base);
        const data = await fetchJSON(`https://musicbrainz.org/ws/2/work?query=${q}&fmt=json&limit=${page}&offset=${offset}`);
        const works = data?.works || [];
        for (const w of works) {
          if (w?.id && !seen.has(w.id)) {
            seen.add(w.id);
            results.push(w);
          }
        }
        const total = data?.['work-count'] ?? works.length;
        if (!works.length || (offset + works.length) >= total) break;
        offset += works.length;
        await new Promise(r => setTimeout(r, 200));
      } catch (_e) {
        break;
      }
    }
    if (results.length >= limit) break;
  }
  return results;
}

async function getWorkDetails(workId: string): Promise<any | null> {
  try {
    const data = await fetchJSON(`https://musicbrainz.org/ws/2/work/${workId}?inc=artist-rels+iswcs&fmt=json`);
    return data || null;
  } catch (_e) {
    return null;
  }
}

async function getArtistDetails(artistId: string): Promise<any | null> {
  try {
    const data = await fetchJSON(`https://musicbrainz.org/ws/2/artist/${artistId}?inc=url-rels+tags&fmt=json`);
    return data || null;
  } catch (_e) {
    return null;
  }
}

function extractWikipediaTitleFromRels(rels: any[] = []): string | null {
  const wikiRel = rels.find((r: any) => (r.type || '').toLowerCase() === 'wikipedia' && r.url?.resource);
  if (wikiRel?.url?.resource) {
    try {
      const url = new URL(wikiRel.url.resource);
      if (url.hostname.includes('wikipedia.org')) {
        const parts = url.pathname.split('/');
        return decodeURIComponent(parts[parts.length - 1]);
      }
    } catch (_e) { /* ignore */ }
  }
  return null;
}

async function fetchWikipediaSummary(title: string): Promise<string | null> {
  try {
    const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.extract || null;
  } catch (_e) {
    return null;
  }
}

async function callProAgent(title: string, writerName: string) {
  try {
    // Use internal invoke to call our pro-repertoire-agent
    const { data, error } = await supabase.functions.invoke('pro-repertoire-agent', {
      body: { workTitle: title, writerName },
      headers: sharedSecret ? { 'x-assistant-secret': sharedSecret } : undefined,
    });
    if (error) throw error;
    return data || null;
  } catch (_e) {
    return null;
  }
}

// MLC Integration via enhanced-mlc-lookup edge function
async function searchMlcViaEdgeFunction(writerVariants: string[], maxWorks = 500): Promise<any[]> {
  const allWorks: any[] = [];
  const seenSongCodes = new Set<string>();
  
  console.log(`Calling enhanced-mlc-lookup for writer variants: ${writerVariants.slice(0, 3).join(', ')}`);
  
  // Try each name variant until we get results
  for (const writerName of writerVariants.slice(0, 5)) {
    if (allWorks.length >= maxWorks) break;
    
    const parts = writerName.trim().split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 0) continue;
    
    // Build writers array for MLC lookup
    const writers = parts.length >= 2 
      ? [{ writerFirstName: parts[0], writerLastName: parts.slice(1).join(' ') }]
      : [{ writerFirstName: '', writerLastName: parts[0] }];
    
    try {
      console.log(`MLC lookup for: "${writerName}"`);
      
      const { data, error } = await supabase.functions.invoke('enhanced-mlc-lookup', {
        body: {
          writers,
          searchType: 'catalog_discovery',
          enhanced: true,
          includeRecordings: true
        }
      });
      
      if (error) {
        console.error(`MLC lookup error for "${writerName}":`, error.message);
        continue;
      }
      
      if (!data?.found) {
        console.log(`MLC: No results for "${writerName}"`);
        continue;
      }
      
      // Process works from the response
      const works = data.works || [];
      console.log(`MLC found ${works.length} works for "${writerName}"`);
      
      for (const work of works) {
        const songCode = work.mlcSongCode || work.mlcsongCode;
        if (songCode && seenSongCodes.has(songCode)) continue;
        if (songCode) seenSongCodes.add(songCode);
        
        allWorks.push({
          title: work.primaryTitle || work.title || work.workTitle,
          mlcSongCode: songCode,
          iswc: work.iswc,
          writers: work.writers || [],
          publishers: work.publishers || [],
          recordings: work.recordings || [],
          source: 'mlc'
        });
        
        if (allWorks.length >= maxWorks) break;
      }
      
      // If we got a good number of results, stop searching more variants
      if (allWorks.length >= 50) {
        console.log(`MLC: Found sufficient works (${allWorks.length}), stopping variant search`);
        break;
      }
      
    } catch (err) {
      console.error(`MLC edge function call failed for "${writerName}":`, err);
    }
  }
  
  console.log(`MLC total unique works found via edge function: ${allWorks.length}`);
  return allWorks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { searchId, writerName, userId, maxSongs = DEFAULT_MAX_SONGS } = await req.json();
    // userId is now optional for anonymous catalog discovery
    if (!searchId || !writerName) {
      return json({ error: 'searchId and writerName are required' }, 400);
    }

    const requestedMaxSongs = Number(maxSongs) || DEFAULT_MAX_SONGS;
    const effectiveMaxSongs = Math.min(MAX_SONGS_HARD_CAP, Math.max(1, requestedMaxSongs));
    
    // Generate name variants for comprehensive searching
    const nameVariants = generateNameVariants(writerName);
    console.log(`Searching with name variants: ${nameVariants.join(', ')}`);

    // Mark search as processing - handle both authenticated and anonymous searches
    const updateQuery = supabase
      .from('song_catalog_searches')
      .update({ search_status: 'processing', last_refreshed_at: new Date().toISOString() })
      .eq('id', searchId);
    
    // Add user filter only if userId is provided
    if (userId) {
      await updateQuery.eq('user_id', userId);
    } else {
      await updateQuery.is('user_id', null);
    }

    // Discover works from MusicBrainz
    const artistId = await findArtistMBID(writerName);
    let artistDetails: any = null;
    let primaryTerritory = 'Worldwide';
    let wikiTitle: string | null = null;
    let wikiSummary: string | null = null;
    if (artistId) {
      artistDetails = await getArtistDetails(artistId);
      primaryTerritory = artistDetails?.area?.name || artistDetails?.country || 'Worldwide';
      wikiTitle = extractWikipediaTitleFromRels(artistDetails?.relations || []);
      if (wikiTitle) {
        wikiSummary = await fetchWikipediaSummary(wikiTitle);
      }
    }

    let mbWorks: any[] = [];
    if (artistId) {
      mbWorks = await fetchAllWorksByArtist(artistId, Math.min(500, effectiveMaxSongs * 2));
    }
    if (mbWorks.length < 50) {
      // Try alternate name searches
      for (const variant of nameVariants.slice(0, 3)) {
        const additionalWorks = await searchWorksByWriterName(variant, 100);
        const existing = new Set(mbWorks.map(w => w.id));
        for (const w of additionalWorks) {
          if (!existing.has(w.id)) {
            mbWorks.push(w);
            existing.add(w.id);
          }
        }
        if (mbWorks.length >= 100) break;
      }
    }
    console.log(`MusicBrainz total works: ${mbWorks.length}`);

    // Fetch MLC works via the enhanced-mlc-lookup edge function
    let mlcWorks: any[] = [];
    try {
      mlcWorks = await searchMlcViaEdgeFunction(nameVariants, effectiveMaxSongs);
    } catch (err) {
      console.error('MLC lookup failed:', err);
    }
    console.log(`MLC total works: ${mlcWorks.length}`);

    // Supplement with PRO repertoires (ASCAP, BMI, SESAC) via Perplexity to catch missing works
    let proWorks: Array<{ title: string; iswc?: string; writers?: any[]; publishers?: any[]; source: 'ascap' | 'bmi' | 'sesac' }> = [];
    console.log('Perplexity key configured:', !!perplexityKey);
    if (perplexityKey) {
      try {
        const fetchProDomain = async (domain: 'ascap' | 'bmi' | 'sesac') => {
          const model = 'sonar';
          const site = domain === 'ascap' ? 'ascap.com' : (domain === 'bmi' ? 'bmi.com' : 'sesac.com');
          
          // Search with all name variants
          const writerVariantsStr = nameVariants.slice(0, 3).map(v => `"${v}"`).join(' OR ');
          
          // NOTE: We do NOT ask Perplexity for ISWCs - AI will hallucinate them.
          // ISWCs should ONLY come from verified sources: MLC API and MusicBrainz database.
          const system = `You extract structured data ONLY from the official ${domain.toUpperCase()} repertoire database at ${site}. 
CRITICAL: Only return works where any of the following names appears EXACTLY as a writer/composer: ${nameVariants.slice(0, 3).join(', ')}. Do NOT include works by similarly named writers.
Return STRICT JSON only. Shape: {"works":[{"title":"string","writers":[{"name":"string","ipi":"string?","share":number?}],"publishers":[{"name":"string","share":number?}]}]}. 
DO NOT include ISWC values - we will get those from authoritative databases.
If no works are found for this exact writer name, return {"works":[]}.
IMPORTANT: Return as many works as possible, up to 50 works.`;
          const body = {
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: `Search the ${domain.toUpperCase()} repertoire at ${site} for ALL works written by ${writerVariantsStr}. Only include works where this exact name appears as a credited writer. Return JSON with up to 50 works. If no works found for this exact name, return {"works":[]}` }
            ],
            temperature: 0.0,
            top_p: 0.9,
            max_tokens: 4000,
            search_domain_filter: [site],
          } as any;
          console.log(`Fetching ${domain.toUpperCase()} repertoire for "${writerName}"...`);
          const resp = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${perplexityKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (!resp.ok) {
            const errText = await resp.text();
            console.error(`${domain.toUpperCase()} Perplexity error (${resp.status}):`, errText.substring(0, 200));
            return [] as any[];
          }
          const data = await resp.json();
          const content = data?.choices?.[0]?.message?.content || '';
          console.log(`${domain.toUpperCase()} raw response length:`, content.length);
          let parsed: any = null;
          try {
            const match = content.match(/```json\s*([\s\S]*?)```/);
            parsed = JSON.parse(match ? match[1] : content);
          } catch (parseErr) {
            console.error(`${domain.toUpperCase()} JSON parse error:`, parseErr);
            parsed = null;
          }
          const works = Array.isArray(parsed?.works) ? parsed.works : [];
          console.log(`${domain.toUpperCase()} found ${works.length} works`);
          return works.map((w: any) => ({ ...w, source: domain }));
        };
        const [ascap, bmi, sesac] = await Promise.all([
          fetchProDomain('ascap'),
          fetchProDomain('bmi'),
          fetchProDomain('sesac'),
        ]);
        proWorks = [...ascap, ...bmi, ...sesac];
        console.log(`Total PRO works found: ASCAP=${ascap.length}, BMI=${bmi.length}, SESAC=${sesac.length}`);
      } catch (e) {
        console.error('PRO lookup error:', e);
      }
    } else {
      console.log('Skipping PRO lookup - no Perplexity API key');
    }

    // Build unified candidate list with MLC-first, then PRO, then MusicBrainz
    const candidates = new Map<string, { 
      id?: string; 
      title: string; 
      sources: Array<'musicbrainz' | 'ascap' | 'bmi' | 'sesac' | 'mlc'>; 
      iswc?: string; 
      mlcSongCode?: string;
      proDetails?: Record<string, any>;
      mlcDetails?: any;
    }>();

    // Seed with MLC works (most authoritative for mechanical)
    for (const w of mlcWorks) {
      const title = (w.title || '').trim();
      if (!title) continue;
      const key = w.iswc ? `iswc:${w.iswc}` : `title:${title.toLowerCase()}`;
      if (!candidates.has(key)) {
        candidates.set(key, { 
          title, 
          sources: ['mlc'], 
          iswc: w.iswc || undefined,
          mlcSongCode: w.mlcSongCode,
          mlcDetails: { writers: w.writers, publishers: w.publishers },
          proDetails: {}
        });
      }
    }

    // Add MusicBrainz discoveries
    for (const w of mbWorks) {
      const title = (w.title || '').trim();
      if (!title) continue;
      const mbIswc = (w.iswc || (w.iswcs && w.iswcs[0]));
      const key = mbIswc ? `iswc:${mbIswc}` : `title:${title.toLowerCase()}`;
      if (!candidates.has(key)) {
        candidates.set(key, { id: w.id, title, sources: ['musicbrainz'], iswc: mbIswc || undefined, proDetails: {} });
      } else {
        const existing = candidates.get(key)!;
        if (!existing.sources.includes('musicbrainz')) existing.sources.push('musicbrainz');
        if (!existing.iswc && mbIswc) existing.iswc = mbIswc;
        if (!existing.id && w.id) existing.id = w.id;
      }
    }

    // Merge in PRO results (ASCAP/BMI/SESAC) - but IGNORE their ISWCs (AI-generated, unreliable)
    for (const w of proWorks) {
      const title = (w.title || '').trim();
      if (!title) continue;
      const domain = w.source; // 'ascap' | 'bmi' | 'sesac'
      // Only use title-based key for PRO works - do NOT trust PRO ISWCs
      const keyTitle = `title:${title.toLowerCase()}`;
      const existing = candidates.get(keyTitle);
      if (!existing) {
        candidates.set(keyTitle, {
          title,
          sources: [domain],
          // Deliberately NOT setting iswc from PRO data - it's AI-generated
          proDetails: { [domain]: { writers: w.writers || [], publishers: w.publishers || [] } }
        });
      } else {
        if (!existing.sources.includes(domain)) existing.sources.push(domain);
        // Deliberately NOT merging iswc from PRO data
        existing.proDetails = existing.proDetails || {};
        (existing.proDetails as any)[domain] = { writers: w.writers || [], publishers: w.publishers || [] };
      }
    }

    console.log(`Total unique candidates after merging: ${candidates.size}`);

    // Keep compatibility with later code
    const byTitle = candidates as any;

    const selected = Array.from(byTitle.values())
      .sort((a: any, b: any) => {
        // Prioritize: MLC > PRO > MusicBrainz only
        const hasMlcA = a.sources?.includes('mlc') ? 1 : 0;
        const hasMlcB = b.sources?.includes('mlc') ? 1 : 0;
        if (hasMlcA !== hasMlcB) return hasMlcB - hasMlcA;
        
        const proCountA = Array.isArray(a.sources) ? a.sources.filter((s: string) => ['ascap', 'bmi', 'sesac'].includes(s)).length : 0;
        const proCountB = Array.isArray(b.sources) ? b.sources.filter((s: string) => ['ascap', 'bmi', 'sesac'].includes(s)).length : 0;
        if (proCountA !== proCountB) return proCountB - proCountA;
        
        const iswcA = a.iswc ? 1 : 0, iswcB = b.iswc ? 1 : 0;
        if (iswcA !== iswcB) return iswcB - iswcA;
        return 0;
      })
      .slice(0, effectiveMaxSongs);

    const rows: any[] = [];
    const startedAt = Date.now();
    let workDetailsCalls = 0;

    for (const w of selected) {
      // Hard stop to avoid request-level timeouts
      if (Date.now() - startedAt > PROCESS_TIME_BUDGET_MS) {
        console.log(`Time budget reached (${PROCESS_TIME_BUDGET_MS}ms). Returning partial results with ${rows.length} works.`);
        break;
      }

      // Light throttling (we still hit external APIs below)
      await new Promise((res) => setTimeout(res, 50));

      const work = w as any; // Type assertion for work object

      let title = (work.title || 'Untitled');
      let finalISWC: string | null = (work.iswc as string) || null;
      let coWritersMB: string[] = [];

      // Work details are expensive + prone to flake; cap how many we attempt per run.
      if (work.id && workDetailsCalls < WORK_DETAILS_HARD_CAP) {
        workDetailsCalls++;
        const details = await getWorkDetails(work.id);
        if (details) {
          title = details?.title || title;
          finalISWC = (details?.iswcs && details.iswcs[0]) || finalISWC;
          const rels = details?.relations || [];
          const writerRels = rels.filter((r: any) => ['writer', 'composer', 'lyricist', 'author'].includes((r.type || '').toLowerCase()));
          const extra = writerRels.map((r: any) => r.artist?.name).filter(Boolean);
          if (extra?.length) coWritersMB = extra;
        }
      }

      const proDetails = (work.proDetails || {}) as Record<string, any>;
      const mlcDetails = work.mlcDetails || null;
      const proOrder = ['ascap', 'bmi', 'sesac'];
      const chosen = proOrder.find((k) => !!proDetails[k]) || null;
      const chosenDetails = chosen ? proDetails[chosen] : null;

      // Co-writers: MLC > PRO > MusicBrainz
      let coWriters: string[] = [];
      if (mlcDetails?.writers?.length) {
        coWriters = mlcDetails.writers.map((x: any) => {
          const first = x.writerFirstName || '';
          const last = x.writerLastName || '';
          return `${first} ${last}`.trim() || x.name || '';
        }).filter(Boolean);
      } else if (chosenDetails?.writers?.length) {
        coWriters = chosenDetails.writers.map((x: any) => x?.name).filter(Boolean);
      } else {
        coWriters = coWritersMB;
      }

      // Publishers: MLC > PRO
      const publishersObj: Record<string, number> = {};
      if (mlcDetails?.publishers?.length) {
        for (const p of mlcDetails.publishers) {
          const name = p.publisherName || p.name;
          if (!name) continue;
          const share = Array.isArray(p.collectionShare) ? p.collectionShare[0] : (typeof p.share === 'number' ? p.share : 0);
          publishersObj[name] = share;
        }
      } else if (chosenDetails?.publishers?.length) {
        for (const p of chosenDetails.publishers) {
          if (!p?.name) continue;
          const share = typeof p.share === 'number' ? p.share : 0;
          publishersObj[p.name] = share;
        }
      }

      // NOTE: We do NOT use ISWCs from PRO Perplexity lookups or PRO agent - AI hallucinates them.
      // ISWCs should ONLY come from verified sources: MLC API and MusicBrainz database.
      // The finalISWC was already set from MLC or MusicBrainz above - do not override with PRO data.

      // Try PRO agent for writer/publisher verification only (NOT for ISWCs)
      let proData: any = null;
      if (sharedSecret && workDetailsCalls < WORK_DETAILS_HARD_CAP) {
        proData = await callProAgent(title, writerName);
        // Deliberately NOT using proData.iswc - AI-generated ISWCs are unreliable
      }

      // Estimated splits prefer MLC > PRO > agent
      let estimatedSplits: Record<string, number> = {};
      if (mlcDetails?.writers?.length) {
        for (const ww of mlcDetails.writers) {
          const name = `${ww.writerFirstName || ''} ${ww.writerLastName || ''}`.trim() || ww.name;
          if (name && typeof ww.share === 'number') {
            estimatedSplits[name] = ww.share;
          }
        }
      } else if (chosenDetails?.writers?.length) {
        estimatedSplits = chosenDetails.writers.reduce((acc: any, ww: any) => {
          if (ww?.name) acc[ww.name] = typeof ww.share === 'number' ? ww.share : 0;
          return acc;
        }, {});
      } else if (Array.isArray(proData?.writers)) {
        estimatedSplits = proData.writers.reduce((acc: any, ww: any) => {
          if (ww?.name) acc[ww.name] = typeof ww.share === 'number' ? ww.share : 0;
          return acc;
        }, {});
      }

      // PRO flags
      const proFlags = {
        ASCAP: !!proDetails.ascap || !!(proData?.sources?.ascap?.found ?? proData?.ascap),
        BMI: !!proDetails.bmi || !!(proData?.sources?.bmi?.found ?? proData?.bmi),
        SESAC: !!proDetails.sesac || !!(proData?.sources?.sesac?.found ?? proData?.sesac),
        MLC: work.sources?.includes('mlc') || !!work.mlcSongCode,
      };

      // Gap detection
      const registration_gaps: string[] = [];
      if (!finalISWC) registration_gaps.push('missing_iswc');

      // MB author present but no PRO registration
      const hasMB = Array.isArray(work.sources) && work.sources.includes('musicbrainz');
      const hasAnyPRO = proFlags.ASCAP || proFlags.BMI || proFlags.SESAC;
      const hasMLC = proFlags.MLC;
      if (hasMB && !hasAnyPRO) registration_gaps.push('unregistered_in_pros');
      if (hasMB && !hasMLC && !hasAnyPRO) registration_gaps.push('mlc_unregistered');

      // Conflicts across PRO sources
      const presentPROs = proOrder.filter((k) => !!proDetails[k]);
      if (presentPROs.length >= 2) {
        // writers conflict
        const sets = presentPROs.map((k) => new Set((proDetails[k].writers || []).map((x: any) => (x?.name || '').toLowerCase()).filter(Boolean)));
        const union = new Set<string>(); sets.forEach((s) => s.forEach((v) => union.add(v as string)));
        const allEqual = sets.every((s) => s.size === union.size && Array.from(s).every((v) => union.has(v as string)));
        if (!allEqual) registration_gaps.push('conflicting_writers');

        // splits conflict
        const shares: Record<string, Set<number>> = {};
        for (const k of presentPROs) {
          for (const ww of (proDetails[k].writers || [])) {
            const name = (ww?.name || '').toLowerCase(); if (!name) continue;
            const share = typeof ww?.share === 'number' ? ww.share : NaN;
            if (!shares[name]) shares[name] = new Set<number>();
            if (!Number.isNaN(share)) shares[name].add(share);
          }
        }
        const splitConflict = Object.values(shares).some((set) => set.size > 1);
        if (splitConflict) registration_gaps.push('conflicting_splits');

        // publishers conflict
        const pubSets = presentPROs.map((k) => new Set((proDetails[k].publishers || []).map((p: any) => (p?.name || '').toLowerCase()).filter(Boolean)));
        const pubUnion = new Set<string>(); pubSets.forEach((s) => s.forEach((v) => pubUnion.add(v as string)));
        const pubsAllEqual = pubSets.every((s) => s.size === pubUnion.size && Array.from(s).every((v) => pubUnion.has(v as string)));
        if (!pubsAllEqual) registration_gaps.push('conflicting_publishers');
      }

      // Higher metadata score for MLC-verified works
      let metadataScore = 0.5;
      if (hasMLC) metadataScore = 0.95;
      else if (finalISWC) metadataScore = 0.85;
      else if (hasAnyPRO) metadataScore = 0.7;
      
      const verification_status = hasMLC ? 'mlc_verified' : (hasAnyPRO ? 'pro_verified' : 'discovered');

      rows.push({
        search_id: searchId,
        user_id: userId,
        song_title: title || 'Untitled',
        songwriter_name: writerName,
        co_writers: coWriters || [],
        publishers: Object.keys(publishersObj).length ? publishersObj : (Array.isArray(proData?.publishers) ? proData.publishers.reduce((acc: any, p: any) => { if (p?.name) acc[p.name] = typeof p.share === 'number' ? p.share : 0; return acc; }, {}) : {}),
        pro_registrations: { ...proFlags, merged: { pro_details: proDetails, mlc_details: mlcDetails, agent: proData || null } },
        iswc: finalISWC,
        estimated_splits: estimatedSplits,
        registration_gaps,
        metadata_completeness_score: metadataScore,
        verification_status,
        last_verified_at: new Date().toISOString(),
        source_data: { 
          source: Array.isArray(work.sources) ? (work.sources[0] || 'merged') : 'merged', 
          sources: work.sources || [],
          work_id: work.id || null, 
          mlc_song_code: work.mlcSongCode || null,
          primary_territory: primaryTerritory 
        }
      });
    }

    let insertedCount = 0;
    if (rows.length) {
      const { data, error } = await supabase
        .from('song_metadata_cache')
        .insert(rows)
        .select('id');
      if (error) throw error;
      insertedCount = data?.length || 0;
    }

    const metaCompleteCount = rows.filter((r) => (r.metadata_completeness_score ?? 0) >= 0.7).length;
    const iswcCount = rows.filter((r) => !!r.iswc).length;
    const proVerifiedCount = rows.filter((r) => r.verification_status === 'pro_verified' || r.verification_status === 'mlc_verified').length;
    const mlcVerifiedCount = rows.filter((r) => r.verification_status === 'mlc_verified').length;
    const verificationRate = insertedCount ? Math.round((proVerifiedCount / insertedCount) * 100) : 0;
    const descriptor = verificationRate >= 50 ? 'strong' : verificationRate >= 20 ? 'moderate' : 'modest';

    const careerOverview = {
      summary: wikiSummary || `Songwriter profile for ${writerName}.`,
      primary_territory: primaryTerritory,
      source: wikiSummary ? 'wikipedia' : (artistId ? 'musicbrainz' : 'unknown')
    };

    const pipelineSummary = {
      summary: `We discovered ${insertedCount} songs for ${writerName}. ${mlcVerifiedCount} verified via MLC, ${metaCompleteCount} have strong metadata, and ${iswcCount} include ISWC codes. Registration checks matched ${proVerifiedCount} songs across PROs and MLC. Based on current data, near-term collections outlook appears ${descriptor}.`,
      counts: { 
        total: insertedCount, 
        meta_complete: metaCompleteCount, 
        iswc: iswcCount, 
        pro_verified: proVerifiedCount, 
        mlc_verified: mlcVerifiedCount,
        verification_rate: verificationRate,
        sources: {
          musicbrainz: mbWorks.length,
          mlc: mlcWorks.length,
          pro: proWorks.length
        }
      }
    };

    // Update search record - handle null userId for anonymous searches
    const finalUpdate = supabase
      .from('song_catalog_searches')
      .update({
        total_songs_found: insertedCount,
        metadata_complete_count: metaCompleteCount,
        pipeline_estimate_total: 0,
        last_refreshed_at: new Date().toISOString(),
        search_status: 'completed',
        ai_research_summary: { source: 'deterministic', discovered: insertedCount, career_overview: careerOverview, pipeline_summary: pipelineSummary }
      })
      .eq('id', searchId);
    
    if (userId) {
      await finalUpdate.eq('user_id', userId);
    } else {
      await finalUpdate.is('user_id', null);
    }

    console.log(`Discovery complete: ${insertedCount} works (MLC: ${mlcVerifiedCount}, PRO: ${proVerifiedCount - mlcVerifiedCount})`);

    return json({ 
      success: true, 
      discovered: insertedCount, 
      meta_complete: metaCompleteCount, 
      verification_rate: verificationRate,
      sources: {
        musicbrainz: mbWorks.length,
        mlc: mlcWorks.length,
        pro: proWorks.length,
        total_candidates: candidates.size
      }
    });
  } catch (e) {
    console.error('deterministic-catalog-discovery error', e);
    return json({ error: (e as Error).message || 'Unexpected error' }, 500);
  }
});
