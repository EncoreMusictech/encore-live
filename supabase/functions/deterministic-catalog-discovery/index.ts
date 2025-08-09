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

const supabase = createClient(supabaseUrl, serviceKey);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchJSON(url: string) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'EncoreMusicIP/1.0 (support@encore.local)',
      'Accept': 'application/json'
    }
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return await resp.json();
}

async function findArtistMBID(writerName: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${writerName}`);
    const data = await fetchJSON(`https://musicbrainz.org/ws/2/artist?query=artist:${q}%20AND%20(type:person%20OR%20type:group)&fmt=json&limit=5`);
    const artists = data?.artists || [];
    if (!artists.length) return null;
    // pick closest name match
    const exact = artists.find((a: any) => (a.name || '').toLowerCase() === writerName.toLowerCase());
    return (exact || artists[0])?.id || null;
  } catch (_e) {
    return null;
  }
}

async function fetchAllWorksByArtist(artistId: string, max = 200): Promise<any[]> {
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
      if (!works.length || results.length >= total) break;
      offset += works.length;
    } catch (_e) {
      break;
    }
  }
  return results;
}

async function searchWorksByWriterName(writerName: string, limit = 50): Promise<any[]> {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { searchId, writerName, userId, maxSongs = 20 } = await req.json();
    if (!searchId || !writerName || !userId) {
      return json({ error: 'searchId, writerName, and userId are required' }, 400);
    }

    // Mark search as processing
    await supabase
      .from('song_catalog_searches')
      .update({ search_status: 'processing', last_refreshed_at: new Date().toISOString() })
      .eq('id', searchId)
      .eq('user_id', userId);

    // Discover works
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
    let works: any[] = [];
    if (artistId) {
      works = await fetchAllWorksByArtist(artistId, Math.min(1000, maxSongs));
    }
    if (!works.length) {
      works = await searchWorksByWriterName(writerName, Math.min(1000, maxSongs));
    }

    // Supplement with ASCAP Songview (via Perplexity) to catch missing works
    let ascapWorks: Array<{ title: string; iswc?: string; writers?: any[]; publishers?: any[] }> = [];
    if (perplexityKey) {
      try {
        const resp = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${perplexityKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-large-128k-online',
            messages: [
              { role: 'system', content: 'You extract structured data from ASCAP Songview (repertory.ascap.com). Return STRICT JSON. No prose. Shape: {"works":[{"title":"string","iswc":"string?","writers":[{"name":"string","ipi":"string?","share":number?}],"publishers":[{"name":"string","share":number?}]}]}. Prefer official capitalization. Return up to 300 unique works for the writer provided.' },
              { role: 'user', content: `List all works for writer \"${writerName}\" using ASCAP Songview. Include ISWC when shown and writers/publishers with percentages if listed. Output JSON only.` }
            ],
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 2000,
            search_domain_filter: ['ascap.com'],
            search_recency_filter: 'year'
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          const content = data?.choices?.[0]?.message?.content || '';
          let parsed: any = null;
          try {
            const match = content.match(/```json\s*([\s\S]*?)```/);
            parsed = JSON.parse(match ? match[1] : content);
          } catch(_e) {
            parsed = null;
          }
          if (parsed?.works && Array.isArray(parsed.works)) {
            ascapWorks = parsed.works.slice(0, maxSongs * 2);
          }
        }
      } catch(_e) { /* ignore */ }
    }

    // Build unified candidate list
    const byTitle = new Map<string, { id?: string; title: string; source: 'musicbrainz' | 'ascap'; iswc?: string; writers?: any[]; publishers?: any[] }>();
    for (const w of works) {
      const title = (w.title || '').trim();
      if (!title) continue;
      const key = title.toLowerCase();
      if (!byTitle.has(key)) byTitle.set(key, { id: w.id, title, source: 'musicbrainz', iswc: (w.iswc || (w.iswcs && w.iswcs[0])) });
    }
    for (const w of ascapWorks) {
      const title = (w.title || '').trim();
      if (!title) continue;
      const key = title.toLowerCase();
      if (!byTitle.has(key)) byTitle.set(key, { title, source: 'ascap', iswc: w.iswc, writers: w.writers, publishers: w.publishers });
    }

    const selected = Array.from(byTitle.values()).slice(0, maxSongs);
    const rows: any[] = [];

for (const w of selected) {
      // Respect rate limits
      await new Promise((res) => setTimeout(res, 300));

      let title = (w.title || 'Untitled');
      let iswc: string | null = (w.iswc as string) || null;
      let coWriters: string[] = Array.isArray(w.writers) ? w.writers.map((x: any) => x?.name).filter(Boolean) : [];

      if (w.id) {
        const details = await getWorkDetails(w.id);
        if (details) {
          title = details?.title || title;
          iswc = (details?.iswcs && details.iswcs[0]) || iswc;
          const rels = details?.relations || [];
          const writerRels = rels.filter((r: any) => ['writer', 'composer', 'lyricist'].includes(r.type));
          const extra = writerRels.map((r: any) => r.artist?.name).filter(Boolean);
          if (extra?.length) coWriters = extra;
        }
      }

      // Try PRO agent for authoritative verification
      let proData: any = null;
      if (sharedSecret) {
        proData = await callProAgent(title, writerName);
      }

      const publishers = Array.isArray(proData?.publishers)
        ? proData.publishers.reduce((acc: any, p: any) => { if (p?.name) acc[p.name] = typeof p.share === 'number' ? p.share : 0; return acc; }, {})
        : {};
      const finalISWC = proData?.iswc || iswc || null;
      const estimatedSplits = Array.isArray(proData?.writers)
        ? proData.writers.reduce((acc: any, w: any) => { if (w?.name) acc[w.name] = typeof w.share === 'number' ? w.share : 0; return acc; }, {})
        : {};
      const proFlags = {
        ASCAP: !!(proData?.sources?.ascap?.found ?? proData?.ascap?.found ?? proData?.ascap),
        BMI:   !!(proData?.sources?.bmi?.found   ?? proData?.bmi?.found   ?? proData?.bmi),
        SESAC: !!(proData?.sources?.sesac?.found ?? proData?.sesac?.found ?? proData?.sesac),
      };

      rows.push({
        search_id: searchId,
        user_id: userId,
        song_title: title || 'Untitled',
        songwriter_name: writerName,
        co_writers: proData?.writers?.map((w: any) => w.name).filter(Boolean) || coWriters || [],
        publishers,
        pro_registrations: proData ? { ...proFlags, merged: proData } : {},
        iswc: finalISWC,
        estimated_splits: estimatedSplits,
        registration_gaps: finalISWC ? [] : ['missing_iswc'],
        metadata_completeness_score: finalISWC ? 0.85 : 0.6,
        verification_status: proData ? 'pro_verified' : 'discovered',
        last_verified_at: new Date().toISOString(),
        source_data: { source: w.source, work_id: w.id || null, primary_territory: primaryTerritory }
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
    const proVerifiedCount = rows.filter((r) => r.verification_status === 'pro_verified').length;
    const verificationRate = insertedCount ? Math.round((proVerifiedCount / insertedCount) * 100) : 0;
    const descriptor = verificationRate >= 50 ? 'strong' : verificationRate >= 20 ? 'moderate' : 'modest';

    const careerOverview = {
      summary: wikiSummary || `Songwriter profile for ${writerName}.`,
      primary_territory: primaryTerritory,
      source: wikiSummary ? 'wikipedia' : (artistId ? 'musicbrainz' : 'unknown')
    };

    const pipelineSummary = {
      summary: `We discovered ${insertedCount} songs for ${writerName}. ${metaCompleteCount} have strong metadata and ${iswcCount} include ISWC codes. Registration checks matched ${proVerifiedCount} songs across PROs. Based on current data, near-term collections outlook appears ${descriptor}.`,
      counts: { total: insertedCount, meta_complete: metaCompleteCount, iswc: iswcCount, pro_verified: proVerifiedCount, verification_rate: verificationRate }
    };

    await supabase
      .from('song_catalog_searches')
      .update({
        total_songs_found: insertedCount,
        metadata_complete_count: metaCompleteCount,
        pipeline_estimate_total: 0,
        last_refreshed_at: new Date().toISOString(),
        search_status: 'completed',
        ai_research_summary: { source: 'deterministic', discovered: insertedCount, career_overview: careerOverview, pipeline_summary: pipelineSummary }
      })
      .eq('id', searchId)
      .eq('user_id', userId);

    return json({ success: true, discovered: insertedCount, meta_complete: metaCompleteCount, verification_rate: verificationRate });
  } catch (e) {
    console.error('deterministic-catalog-discovery error', e);
    return json({ error: (e as Error).message || 'Unexpected error' }, 500);
  }
});