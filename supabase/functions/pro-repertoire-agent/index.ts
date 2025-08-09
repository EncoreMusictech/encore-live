import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-assistant-secret',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const sharedSecret = Deno.env.get('ASSISTANT_SHARED_SECRET');
const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

const supabase = createClient(supabaseUrl, serviceKey || '');

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
  return !!sharedSecret && provided === sharedSecret;
}

async function callEnhancedBMI(params: { workTitle: string; writerName?: string; artistName?: string; publisherName?: string }) {
  const { data, error } = await supabase.functions.invoke('enhanced-bmi-agent', { body: params });
  if (error) throw new Error(`enhanced-bmi-agent error: ${error.message}`);
  return data || null;
}

async function callASCAP(params: { workTitle?: string; writerName?: string; publisherName?: string }) {
  const { data, error } = await supabase.functions.invoke('ascap-lookup', { body: params });
  if (error) throw new Error(`ascap-lookup error: ${error.message}`);
  return data || null;
}

async function searchSESACViaPerplexity(params: { workTitle?: string; writerName?: string; artistName?: string }) {
  if (!perplexityKey) return { found: false, writers: [], publishers: [], note: 'PERPLEXITY_API_KEY not set' };
  const query = `Search the SESAC repertory for ${params.workTitle ? `work: "${params.workTitle}" ` : ''}${params.writerName ? `writer: "${params.writerName}" ` : ''}${params.artistName ? `artist: "${params.artistName}" ` : ''}. Extract writers (names+IPI if shown), publishers, and ISWC. Return structured JSON.`;
  const resp = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${perplexityKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        { role: 'system', content: 'Extract exact repertoire metadata from SESAC. Return JSON only with fields: writers[], publishers[], iswc? and keep percentages when available.' },
        { role: 'user', content: query }
      ],
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 1000,
      search_domain_filter: ['sesac.com'],
      search_recency_filter: 'year'
    })
  });
  if (!resp.ok) {
    const msg = await resp.text();
    return { found: false, writers: [], publishers: [], error: `Perplexity SESAC error: ${resp.status} ${msg}` };
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  // naive parse: try to find JSON
  let parsed: any = {};
  try {
    const match = content.match(/```json\s*([\s\S]*?)```/);
    parsed = JSON.parse(match ? match[1] : content);
  } catch(_e) {
    parsed = { raw: content };
  }
  return { ...parsed, source: 'sesac' };
}

function normalizePeople(list: any[]): Array<{ name: string; ipi?: string; share?: number; role?: string }> {
  if (!Array.isArray(list)) return [];
  return list.map((w: any) => ({
    name: typeof w === 'string' ? w : (w.name || ''),
    ipi: w.ipi || w.ipi_cae || undefined,
    share: typeof w.share === 'number' ? w.share : (typeof w.percentage === 'number' ? w.percentage : undefined),
    role: w.role || undefined,
  })).filter(w => w.name);
}

function normalizePublishers(list: any[] | Record<string, number>): Array<{ name: string; share?: number; ipi?: string }> {
  if (!list) return [] as any;
  if (Array.isArray(list)) return list.map((p: any) => ({ name: typeof p === 'string' ? p : (p.name || ''), share: p.share, ipi: p.ipi || p.ipi_cae })).filter(p => p.name);
  return Object.entries(list).map(([name, share]) => ({ name, share: typeof share === 'number' ? share : undefined }));
}

function pickISWC(candidates: string[]): { iswc?: string; confidence: number; rationale: string } {
  const clean = candidates.filter(Boolean);
  if (clean.length === 0) return { confidence: 0, rationale: 'no iswc found' } as any;
  const freq: Record<string, number> = {};
  clean.forEach((x) => freq[x] = (freq[x] || 0) + 1);
  const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
  const [chosen, votes] = sorted[0];
  const confidence = votes >= 2 ? 0.95 : 0.7;
  return { iswc: chosen, confidence, rationale: votes >= 2 ? 'multi-source consensus' : 'single-source' };
}

function mergePeople(priorityLists: Array<Array<{ name: string; ipi?: string; share?: number; role?: string }>>): Array<{ name: string; ipi?: string; share?: number; role?: string }>{
  const map = new Map<string, { name: string; ipi?: string; share?: number; role?: string }>();
  for (const list of priorityLists) {
    for (const p of list) {
      const key = p.name.toLowerCase();
      if (!map.has(key)) map.set(key, { ...p });
      else {
        const cur = map.get(key)!;
        map.set(key, {
          name: cur.name,
          ipi: cur.ipi || p.ipi,
          share: typeof cur.share === 'number' ? cur.share : p.share,
          role: cur.role || p.role
        });
      }
    }
  }
  return Array.from(map.values());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const path = url.pathname.split('/').slice(3).join('/');

  try {
    const ok = await verifySharedSecret(req);
    if (!ok) return unauthorized('Invalid assistant secret');

    if (req.method === 'GET' && (path === '' || path === 'requirements')) {
      return json({
        endpoints: { search: { method: 'POST', path: '/search' } },
        request: { workTitle: 'string (recommended)', writerName: 'string (recommended)', artistName: 'string (optional)' },
        response: {
          iswc: 'string?',
          writers: 'Array<{name, ipi?, share?, role?}>',
          publishers: 'Array<{name, share?, ipi?}>',
          confidence: '0..1 overall',
          sources: 'Array of source attributions with per-source confidence',
          verification_notes: 'string'
        }
      });
    }

    if (req.method === 'POST' && path === 'search') {
      const body = await req.json();
      const { workTitle, writerName, artistName } = body || {};
      if (!workTitle && !writerName) return json({ error: 'workTitle or writerName required' }, 400);

      // Call sources in parallel
      const [bmi, ascap, sesac] = await Promise.allSettled([
        callEnhancedBMI({ workTitle: workTitle || writerName, writerName, artistName }),
        callASCAP({ workTitle, writerName }),
        searchSESACViaPerplexity({ workTitle, writerName, artistName })
      ]);

      const bmiData: any = bmi.status === 'fulfilled' ? bmi.value : null;
      const ascapData: any = ascap.status === 'fulfilled' ? ascap.value : null;
      const sesacData: any = sesac.status === 'fulfilled' ? sesac.value : null;

      const bmiWriters = normalizePeople(bmiData?.writers || []);
      const ascapWriters = normalizePeople(ascapData?.writers || []);
      const sesacWriters = normalizePeople(sesacData?.writers || []);

      const bmiPubs = normalizePublishers(bmiData?.publishers || []);
      const ascapPubs = normalizePublishers(ascapData?.publishers || []);
      const sesacPubs = normalizePublishers(sesacData?.publishers || []);

      const iswcPick = pickISWC([bmiData?.iswc, ascapData?.iswc, sesacData?.iswc].filter(Boolean) as string[]);

      // Priority merge: BMI > ASCAP > SESAC
      const writers = mergePeople([bmiWriters, ascapWriters, sesacWriters]);
      const publishers = mergePeople([bmiPubs as any, ascapPubs as any, sesacPubs as any]) as any;

      // Overall confidence heuristic
      let confidence = 0.5;
      if (iswcPick.confidence >= 0.9) confidence += 0.2;
      if (writers.length > 0) confidence += 0.1;
      if (publishers.length > 0) confidence += 0.1;
      confidence = Math.min(1, confidence);

      const sources = [
        { source: 'BMI', found: !!bmiData?.found, iswc: bmiData?.iswc, count_writers: bmiWriters.length, count_publishers: bmiPubs.length },
        { source: 'ASCAP', found: !!ascapData?.found, iswc: ascapData?.iswc, count_writers: ascapWriters.length, count_publishers: ascapPubs.length },
        { source: 'SESAC', found: !!sesacData?.found, iswc: sesacData?.iswc, count_writers: sesacWriters.length, count_publishers: sesacPubs.length }
      ];

      const result = {
        found: writers.length > 0 || publishers.length > 0 || !!iswcPick.iswc,
        iswc: iswcPick.iswc,
        writers,
        publishers,
        confidence,
        sources,
        verification_notes: iswcPick.rationale
      };

      return json(result);
    }

    return json({ error: 'Route not found' }, 404);
  } catch (e) {
    console.error('pro-repertoire-agent error', e);
    return json({ error: (e as Error).message || 'Unexpected error' }, 500);
  }
});
