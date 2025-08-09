import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-assistant-secret',
};

// Env
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const sharedSecret = Deno.env.get('ASSISTANT_SHARED_SECRET');

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL env');
}
if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env');
}
if (!sharedSecret) {
  console.warn('ASSISTANT_SHARED_SECRET not set - requests will fail auth');
}

const supabase = createClient(supabaseUrl, serviceKey!);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function unauthorized(msg = 'Unauthorized') {
  return json({ error: msg }, 401);
}

async function verifySharedSecret(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const headerSecret = req.headers.get('x-assistant-secret') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  const provided = token || headerSecret;
  return provided && sharedSecret && provided === sharedSecret;
}

// Compute a rough completeness score [0..1]
function computeCompleteness(song: any): number {
  let score = 0.5;
  if (song.iswc) score += 0.2;
  const hasWriters = Array.isArray(song.writers) ? song.writers.length > 0 : Array.isArray(song.co_writers) ? song.co_writers.length > 0 : false;
  if (hasWriters) score += 0.1;
  const hasPublishers = Array.isArray(song.publishers) ? song.publishers.length > 0 : song.publishers && typeof song.publishers === 'object' && Object.keys(song.publishers).length > 0;
  if (hasPublishers) score += 0.1;
  if (song.popularity || song.spotify_track_id || (Array.isArray(song.spotify_artist_ids) && song.spotify_artist_ids.length)) score += 0.1;
  return Math.max(0, Math.min(1, score));
}

function toPublisherObject(input: any): Record<string, number> {
  if (!input) return {};
  if (Array.isArray(input)) {
    const obj: Record<string, number> = {};
    input.forEach((n: string) => { if (n) obj[n] = 0; });
    return obj;
  }
  if (typeof input === 'object') return input as Record<string, number>;
  return {};
}

function writersToNames(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((w) => (typeof w === 'string' ? w : w?.name)).filter(Boolean);
  }
  return [];
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Route parsing
  const url = new URL(req.url);
  const path = url.pathname.split('/').slice(3).join('/'); // after /functions/v1/<name>

  try {
    // Auth via shared secret
    const ok = await verifySharedSecret(req);
    if (!ok) {
      console.warn('Shared secret verification failed');
      return unauthorized('Invalid assistant secret');
    }

    if (req.method === 'GET' && (path === '' || path === 'requirements')) {
      return json({
        endpoints: {
          start: { method: 'POST', path: '/start' },
          submit: { method: 'POST', path: '/submit' },
          status: { method: 'GET', path: '/status?search_id=...&user_id=...' },
        },
        song_schema: {
          title: 'string (required)',
          artists: 'string[]',
          writers: '({name, ipi?}|string)[]',
          publishers: 'string[] | Record<string, number>',
          iswc: 'string',
          isrc: 'string',
          release_date: 'YYYY-MM-DD',
          spotify_track_id: 'string',
          spotify_artist_ids: 'string[]',
          popularity: 'number 0-100',
          sources: 'Array<{name: string; url?: string}>',
          confidence: 'number 0-1 or string low|medium|high',
          pro_registrations: 'Record<PRO, any>',
          splits: 'Record<WriterName, number>'
        },
        example: {
          title: 'Song Title',
          artists: ['Primary Artist'],
          writers: [{ name: 'Writer A', ipi: '00012345678' }, 'Writer B'],
          publishers: { 'Publisher One': 50, 'Publisher Two': 50 },
          iswc: 'T-123.456.789-0',
          isrc: 'US-ABC-23-00001',
          release_date: '2023-05-01',
          spotify_track_id: '5A1b2C3d4E5f',
          spotify_artist_ids: ['1Xyo4u8uXC1ZmMpatF05PJ'],
          popularity: 72,
          sources: [{ name: 'Spotify', url: 'https://open.spotify.com/track/...' }],
          confidence: 0.9,
          pro_registrations: { bmi: { verified: true } },
          splits: { 'Writer A': 50, 'Writer B': 50 },
          pipeline_estimates: [
            { estimate_type: 'performance', annual_estimate: 1200, confidence_level: 'medium' },
            { estimate_type: 'mechanical', annual_estimate: 400, confidence_level: 'low' },
            { estimate_type: 'total', annual_estimate: 1600, confidence_level: 'medium' }
          ]
        }
      });
    }

    if (req.method === 'POST' && path === 'start') {
      const body = await req.json();
      const { user_id, songwriter_name, search_parameters = {} } = body || {};

      if (!user_id || !songwriter_name) {
        return json({ error: 'user_id and songwriter_name are required' }, 400);
      }

      const { data: search, error } = await supabase
        .from('song_catalog_searches')
        .insert({
          user_id,
          songwriter_name,
          search_status: 'processing',
          search_parameters,
          ai_research_summary: { source: 'assistant', started_by: 'external_assistant' },
          webhook_status: 'skipped'
        })
        .select()
        .single();

      if (error) {
        console.error('Start insert error', error);
        return json({ error: error.message }, 500);
      }

      return json({ success: true, search_id: search.id, search });
    }

    if (req.method === 'POST' && path === 'submit') {
      const body = await req.json();
      const { user_id, search_id, songwriter_name, songs = [], pipeline_total } = body || {};

      if (!user_id || !search_id || !Array.isArray(songs)) {
        return json({ error: 'user_id, search_id, and songs[] are required' }, 400);
      }

      // Insert song metadata rows
      const rows: any[] = [];
      const nowIso = new Date().toISOString();
      for (const s of songs) {
        const title = s.title || s.song_title;
        if (!title) continue;

        const coWriters = writersToNames(s.writers) || s.co_writers || [];
        const publishersObj = toPublisherObject(s.publishers);
        const regGaps: string[] = [];
        if (!s.iswc) regGaps.push('missing_iswc');
        if (!coWriters.length) regGaps.push('incomplete_writer_information');

        rows.push({
          search_id,
          user_id,
          song_title: title,
          songwriter_name: s.songwriter_name || songwriter_name || '',
          co_writers: coWriters,
          publishers: publishersObj,
          pro_registrations: s.pro_registrations || {},
          iswc: s.iswc || null,
          estimated_splits: s.splits || {},
          registration_gaps: regGaps,
          metadata_completeness_score: computeCompleteness(s),
          verification_status: 'assistant_submitted',
          search_key: `${title}|${(s.songwriter_name || songwriter_name || '').trim()}|`,
          last_verified_at: nowIso,
          source_data: {
            artists: s.artists || [],
            isrc: s.isrc || null,
            release_date: s.release_date || null,
            spotify_track_id: s.spotify_track_id || null,
            spotify_artist_ids: s.spotify_artist_ids || [],
            popularity: s.popularity ?? null,
            sources: s.sources || [],
            confidence: s.confidence ?? null
          }
        });
      }

      let inserted: any[] = [];
      if (rows.length) {
        const { data, error } = await supabase
          .from('song_metadata_cache')
          .insert(rows)
          .select();
        if (error) {
          console.error('Insert song_metadata_cache error', error);
          return json({ error: error.message }, 500);
        }
        inserted = data || [];
      }

      // Insert pipeline estimates if provided per song
      const estimatesToInsert: any[] = [];
      for (let i = 0; i < inserted.length; i++) {
        const s = songs[i];
        const ins = inserted[i];
        if (!s?.pipeline_estimates || !Array.isArray(s.pipeline_estimates)) continue;
        for (const est of s.pipeline_estimates) {
          estimatesToInsert.push({
            song_metadata_id: ins.id,
            user_id,
            estimate_type: est.estimate_type || 'total',
            annual_estimate: est.annual_estimate ?? 0,
            confidence_level: est.confidence_level || 'low',
            calculation_method: est.calculation_method || 'assistant_submitted',
            factors_considered: est.factors_considered || {},
            missing_registrations_impact: est.missing_registrations_impact ?? 0,
            potential_upside: est.potential_upside ?? 0,
            source_data: { submitted_via: 'assistant' }
          });
        }
      }

      if (estimatesToInsert.length) {
        const { error } = await supabase
          .from('royalty_pipeline_estimates')
          .insert(estimatesToInsert);
        if (error) {
          console.error('Insert royalty_pipeline_estimates error', error);
          // don't fail entire submission
        }
      }

      // Update search aggregate
      const metaCompleteCount = inserted.filter((r) => (r.metadata_completeness_score ?? 0) >= 0.7).length;
      const { error: updErr } = await supabase
        .from('song_catalog_searches')
        .update({
          total_songs_found: (inserted.length),
          metadata_complete_count: metaCompleteCount,
          pipeline_estimate_total: pipeline_total ?? null,
          last_refreshed_at: nowIso,
          search_status: 'completed'
        })
        .eq('id', search_id);
      if (updErr) console.error('Update search totals error', updErr);

      return json({ success: true, inserted: inserted.length, meta_complete: metaCompleteCount });
    }

    if (req.method === 'GET' && path === 'status') {
      const search_id = url.searchParams.get('search_id');
      const user_id = url.searchParams.get('user_id');
      if (!search_id || !user_id) return json({ error: 'search_id and user_id are required' }, 400);

      const { data: search, error } = await supabase
        .from('song_catalog_searches')
        .select('*')
        .eq('id', search_id)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);

      const { count, error: cntErr } = await supabase
        .from('song_metadata_cache')
        .select('id', { count: 'exact', head: true })
        .eq('search_id', search_id)
        .eq('user_id', user_id);
      if (cntErr) return json({ error: cntErr.message }, 500);

      return json({ success: true, search, song_count: count ?? 0 });
    }

    return json({ error: 'Route not found' }, 404);
  } catch (e) {
    console.error('song-research-assistant error', e);
    return json({ error: (e as Error).message || 'Unexpected error' }, 500);
  }
});
