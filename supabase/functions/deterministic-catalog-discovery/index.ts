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

    // Supplement with PRO repertoires (ASCAP, BMI, SESAC) via Perplexity to catch missing works
    let proWorks: Array<{ title: string; iswc?: string; writers?: any[]; publishers?: any[]; source: 'ascap'|'bmi'|'sesac' }> = [];
    if (perplexityKey) {
      try {
        const fetchProDomain = async (domain: 'ascap'|'bmi'|'sesac') => {
          const model = 'llama-3.1-sonar-large-128k-online';
          const site = domain === 'ascap' ? 'ascap.com' : (domain === 'bmi' ? 'bmi.com' : 'sesac.com');
          const system = `You extract structured data from official ${domain.toUpperCase()} repertoire. Return STRICT JSON only. Shape: {"works":[{"title":"string","iswc":"string?","writers":[{"name":"string","ipi":"string?","share":number?}],"publishers":[{"name":"string","share":number?}]}]}. Prefer official capitalization. Return up to 300 unique works for the writer provided.`;
          const body = {
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: `List all works for writer "${writerName}" from the official ${domain.toUpperCase()} repertoire. Include ISWC when shown and writers/publishers with percentages if listed. Output JSON only.` }
            ],
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 2000,
            search_domain_filter: [site],
            search_recency_filter: 'year'
          } as any;
          const resp = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${perplexityKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (!resp.ok) return [] as any[];
          const data = await resp.json();
          const content = data?.choices?.[0]?.message?.content || '';
          let parsed: any = null;
          try {
            const match = content.match(/```json\s*([\s\S]*?)```/);
            parsed = JSON.parse(match ? match[1] : content);
          } catch { parsed = null; }
          const works = Array.isArray(parsed?.works) ? parsed.works : [];
          return works.map((w: any) => ({ ...w, source: domain })).slice(0, maxSongs * 2);
        };
        const [ascap, bmi, sesac] = await Promise.all([
          fetchProDomain('ascap'),
          fetchProDomain('bmi'),
          fetchProDomain('sesac'),
        ]);
        proWorks = [...ascap, ...bmi, ...sesac];
      } catch(_e) { /* ignore */ }
    }

    // Build unified candidate list with PRO-first merging
    const candidates = new Map<string, { id?: string; title: string; sources: Array<'musicbrainz'|'ascap'|'bmi'|'sesac'>; iswc?: string; proDetails?: Record<string, any> }>();

    // Seed with MusicBrainz discoveries
    for (const w of works) {
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
      }
    }

    // Merge in PRO results (ASCAP/BMI/SESAC)
    for (const w of proWorks) {
      const title = (w.title || '').trim();
      if (!title) continue;
      const domain = w.source; // 'ascap' | 'bmi' | 'sesac'
      const keyIswc = w.iswc ? `iswc:${w.iswc}` : null;
      const keyTitle = `title:${title.toLowerCase()}`;
      const key = keyIswc && candidates.has(keyIswc) ? keyIswc : (keyIswc || keyTitle);
      const existing = candidates.get(key);
      if (!existing) {
        candidates.set(key, {
          title,
          sources: [domain],
          iswc: w.iswc || undefined,
          proDetails: { [domain]: { writers: w.writers || [], publishers: w.publishers || [], iswc: w.iswc || null } }
        });
      } else {
        if (!existing.sources.includes(domain)) existing.sources.push(domain);
        if (!existing.iswc && w.iswc) existing.iswc = w.iswc;
        existing.proDetails = existing.proDetails || {};
        (existing.proDetails as any)[domain] = { writers: w.writers || [], publishers: w.publishers || [], iswc: w.iswc || null };
      }
    }

    // Keep compatibility with later code
    const byTitle = candidates as any;

    const selected = Array.from(byTitle.values())
      .sort((a: any, b: any) => {
        const proCountA = Array.isArray(a.sources) ? a.sources.filter((s: string) => s !== 'musicbrainz').length : 0;
        const proCountB = Array.isArray(b.sources) ? b.sources.filter((s: string) => s !== 'musicbrainz').length : 0;
        if (proCountA !== proCountB) return proCountB - proCountA;
        const iswcA = a.iswc ? 1 : 0, iswcB = b.iswc ? 1 : 0;
        if (iswcA !== iswcB) return iswcB - iswcA;
        return 0;
      })
      .slice(0, maxSongs);
    const rows: any[] = [];

    for (const w of selected) {
      // Respect rate limits
      await new Promise((res) => setTimeout(res, 300));

      let title = (w.title || 'Untitled');
      let finalISWC: string | null = (w.iswc as string) || null;
      let coWritersMB: string[] = [];

      if (w.id) {
        const details = await getWorkDetails(w.id);
        if (details) {
          title = details?.title || title;
          finalISWC = (details?.iswcs && details.iswcs[0]) || finalISWC;
          const rels = details?.relations || [];
          const writerRels = rels.filter((r: any) => ['writer', 'composer', 'lyricist', 'author'].includes((r.type || '').toLowerCase()));
          const extra = writerRels.map((r: any) => r.artist?.name).filter(Boolean);
          if (extra?.length) coWritersMB = extra;
        }
      }

      const proDetails = (w.proDetails || {}) as Record<string, any>;
      const proOrder = ['ascap','bmi','sesac'];
      const chosen = proOrder.find((k) => !!proDetails[k]) || null;
      const chosenDetails = chosen ? proDetails[chosen] : null;

      // Co-writers and publishers from PRO first, fallback to MB
      const coWritersPRO: string[] = chosenDetails?.writers?.map((x: any) => x?.name).filter(Boolean) || [];
      const coWriters = (coWritersPRO.length ? coWritersPRO : coWritersMB);

      const publishersObj: Record<string, number> = {};
      if (chosenDetails?.publishers?.length) {
        for (const p of chosenDetails.publishers) {
          if (!p?.name) continue;
          const share = typeof p.share === 'number' ? p.share : 0;
          publishersObj[p.name] = share;
        }
      }

      if (!finalISWC) {
        // try to take ISWC from any PRO source
        for (const k of proOrder) {
          const v = proDetails[k]?.iswc;
          if (v && !finalISWC) { finalISWC = v; break; }
        }
      }

      // Try PRO agent for authoritative verification (optional)
      let proData: any = null;
      if (sharedSecret) {
        proData = await callProAgent(title, writerName);
        if (proData?.iswc && !finalISWC) finalISWC = proData.iswc;
      }

      // Estimated splits prefer chosen PRO details, fallback to agent
      let estimatedSplits: Record<string, number> = {};
      const fromChosenSplits = Array.isArray(chosenDetails?.writers) ? chosenDetails.writers : null;
      if (fromChosenSplits) {
        estimatedSplits = fromChosenSplits.reduce((acc: any, ww: any) => {
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
        BMI:   !!proDetails.bmi   || !!(proData?.sources?.bmi?.found   ?? proData?.bmi),
        SESAC: !!proDetails.sesac || !!(proData?.sources?.sesac?.found ?? proData?.sesac),
      };

      // Gap detection
      const registration_gaps: string[] = [];
      if (!finalISWC) registration_gaps.push('missing_iswc');

      // MB author present but no PRO registration
      const hasMB = Array.isArray(w.sources) && w.sources.includes('musicbrainz');
      const hasAnyPRO = proFlags.ASCAP || proFlags.BMI || proFlags.SESAC;
      if (hasMB && !hasAnyPRO) registration_gaps.push('unregistered_in_pros');

      // Conflicts across PRO sources
      const presentPROs = proOrder.filter((k) => !!proDetails[k]);
      if (presentPROs.length >= 2) {
        // writers conflict
        const sets = presentPROs.map((k) => new Set((proDetails[k].writers || []).map((x: any) => (x?.name || '').toLowerCase()).filter(Boolean)));
        const union = new Set<string>(); sets.forEach((s) => s.forEach((v) => union.add(v)));
        const allEqual = sets.every((s) => s.size === union.size && Array.from(s).every((v) => union.has(v)));
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
        const pubUnion = new Set<string>(); pubSets.forEach((s) => s.forEach((v) => pubUnion.add(v)));
        const pubsAllEqual = pubSets.every((s) => s.size === pubUnion.size && Array.from(s).every((v) => pubUnion.has(v)));
        if (!pubsAllEqual) registration_gaps.push('conflicting_publishers');
      }

      const metadataScore = finalISWC ? 0.9 : 0.6;
      const verification_status = hasAnyPRO ? 'pro_verified' : 'discovered';

      rows.push({
        search_id: searchId,
        user_id: userId,
        song_title: title || 'Untitled',
        songwriter_name: writerName,
        co_writers: coWriters || [],
        publishers: Object.keys(publishersObj).length ? publishersObj : (Array.isArray(proData?.publishers) ? proData.publishers.reduce((acc: any, p: any) => { if (p?.name) acc[p.name] = typeof p.share === 'number' ? p.share : 0; return acc; }, {}) : {}),
        pro_registrations: { ...proFlags, merged: { pro_details: proDetails, agent: proData || null } },
        iswc: finalISWC,
        estimated_splits,
        registration_gaps,
        metadata_completeness_score: metadataScore,
        verification_status,
        last_verified_at: new Date().toISOString(),
        source_data: { source: Array.isArray(w.sources) ? (w.sources[0] || 'merged') : 'merged', work_id: w.id || null, primary_territory: primaryTerritory }
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