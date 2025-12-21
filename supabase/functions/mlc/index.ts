import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const BASE = "https://public-api.themlc.com";

type SearchWriter = { writerFirstName?: string; writerLastName?: string; writerIPI?: string };
type SearchWorkReq = { title?: string; writers?: SearchWriter[] };
type WorkQuery = { mlcsongCode: string };

async function getToken() {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: Deno.env.get("MLC_USERNAME"),
      password: Deno.env.get("MLC_PASSWORD"),
    }),
  });
  if (!res.ok) throw new Response(`MLC auth failed ${res.status}`, { status: 500 });
  const tok = await res.json();
  
  // CRITICAL: MLC requires idToken as Bearer token, NOT accessToken
  // Per MLC support: "Use the content of idToken in headers as: Bearer <idToken>"
  if (!tok.idToken) {
    console.error('No idToken in OAuth response. Available keys:', Object.keys(tok));
    throw new Response('MLC OAuth: No idToken received', { status: 500 });
  }
  
  console.log('✓ Using idToken as Bearer token (MLC requirement)');
  return `Bearer ${tok.idToken}`;
}

// Thin wrappers around MLC endpoints
async function mlcSearchSongcode(auth: string, body: SearchWorkReq) {
  const r = await fetch(`${BASE}/search/songcode`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Response(`songcode search ${r.status}`, { status: 502 });
  return r.json();
}

async function mlcGetWorks(auth: string, codes: string[]) {
  const r = await fetch(`${BASE}/works`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(codes.map(mlcsongCode => ({ mlcsongCode }) as WorkQuery)),
  });
  if (!r.ok) throw new Response(`works ${r.status}`, { status: 502 });
  return r.json();
}

async function mlcSearchRecordings(auth: string, q: { title?: string; artist?: string; isrc?: string }) {
  const r = await fetch(`${BASE}/search/recordings`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(q),
  });
  if (!r.ok) throw new Response(`recordings ${r.status}`, { status: 502 });
  return r.json();
}

// Util: basic retry for transient 5xx
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 400): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1))); }
  }
  throw lastErr;
}

// Router
serve(async (req) => {
  const url = new URL(req.url);
  // CORS
  if (req.method === "OPTIONS") return new Response(null, {
    headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST, OPTIONS" }
  });

  try {
    if (url.pathname.endsWith("/fetch-writer-catalog") && req.method === "POST") {
      const { firstName, lastName, ipi, title } = await req.json();
      console.log(`[MLC] Starting catalog search for: ${firstName} ${lastName}, IPI: ${ipi}, Title: ${title}`);

      const auth = await withRetry(getToken);
      
      // Multiple search strategies to maximize catalog discovery
      const searchStrategies = [];
      
      // Strategy 1: Full writer info with optional title
      if (firstName || lastName || ipi) {
        searchStrategies.push({
          name: "full_writer_search",
          body: {
            title: title,
            writers: [{ writerFirstName: firstName, writerLastName: lastName, writerIPI: ipi }].filter(w => w.writerFirstName || w.writerLastName || w.writerIPI)
          }
        });
      }
      
      // Strategy 2: First name only (broader search)
      if (firstName && !title) {
        searchStrategies.push({
          name: "first_name_only",
          body: {
            writers: [{ writerFirstName: firstName }]
          }
        });
      }
      
      // Strategy 3: Last name only (broader search)
      if (lastName && !title) {
        searchStrategies.push({
          name: "last_name_only", 
          body: {
            writers: [{ writerLastName: lastName }]
          }
        });
      }
      
      // Strategy 4: IPI only (if available)
      if (ipi && !title) {
        searchStrategies.push({
          name: "ipi_only",
          body: {
            writers: [{ writerIPI: ipi }]
          }
        });
      }

      console.log(`[MLC] Using ${searchStrategies.length} search strategies`);

      const allMatches = [];
      const allCodes = new Set<string>();

      // Execute all search strategies
      for (const strategy of searchStrategies) {
        try {
          console.log(`[MLC] Executing strategy: ${strategy.name}`);
          const matches = await withRetry(() => mlcSearchSongcode(auth, strategy.body));
          console.log(`[MLC] Strategy ${strategy.name} found ${matches.length} matches`);
          
          allMatches.push(...matches);
          matches.forEach((m: any) => {
            if (m.mlcSongCode) allCodes.add(m.mlcSongCode);
          });
        } catch (error) {
          console.log(`[MLC] Strategy ${strategy.name} failed:`, error);
        }
      }

      const codes = Array.from(allCodes);
      console.log(`[MLC] Total unique song codes found: ${codes.length}`);

      // Hydrate Work details in batches (MLC API might have limits)
      const batchSize = 50;
      const allWorks = [];
      
      for (let i = 0; i < codes.length; i += batchSize) {
        const batch = codes.slice(i, i + batchSize);
        console.log(`[MLC] Fetching work details for batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(codes.length/batchSize)} (${batch.length} works)`);
        
        try {
          const works = await withRetry(() => mlcGetWorks(auth, batch));
          allWorks.push(...works);
        } catch (error) {
          console.log(`[MLC] Failed to fetch work details for batch:`, error);
        }
      }

      console.log(`[MLC] Retrieved details for ${allWorks.length} works`);

      // Attach recordings (ISRCs) per work using title+artist
      const recsByCode = new Map<string, any[]>();
      let recordingCount = 0;
      
      for (const w of allWorks) {
        try {
          const recs = await withRetry(() => mlcSearchRecordings(auth, {
            title: w.primaryTitle,
            artist: w.artists || undefined
          }));
          recsByCode.set(w.mlcSongCode, recs);
          recordingCount += recs.length;
        } catch (error) {
          console.log(`[MLC] Failed to fetch recordings for work ${w.primaryTitle}:`, error);
          recsByCode.set(w.mlcSongCode, []);
        }
      }

      console.log(`[MLC] Retrieved ${recordingCount} total recordings`);

      // Normalized payload ready for UI + DB
      const result = allWorks.map((w: any) => ({
        mlc_song_code: w.mlcSongCode,
        work_title: w.primaryTitle,
        iswc: w.iswc,
        akas: (w.akas || []).map((a: any) => ({ id: a.akaId, title: a.akaTitle, type: a.akaTitleTypeCode })),
        artists: w.artists || null,
        writers: (w.writers || []).map((wr: any) => ({
          id: wr.writerId,
          first_name: wr.writerFirstName,
          last_name: wr.writerLastName,
          ipi: wr.writerIPI,
          role: wr.writerRoleCode,
        })),
        publishers: (w.publishers || []).map((p: any) => ({
          id: p.publisherId,
          name: p.publisherName,
          ipi: p.publisherIpiNumber,
          role: p.publisherRoleCode,
          mlc_publisher_number: p.mlcPublisherNumber,
          collection_share: p.collectionShare,
        })),
        recordings: (recsByCode.get(w.mlcSongCode) || []).map((r: any) => ({
          isrc: r.isrc,
          title: r.title,
          artist: r.artist,
          label: r.labels,
        })),
      }));

      console.log(`[MLC] Final result: ${result.length} works with complete data`);

      return new Response(JSON.stringify({ 
        summary: {
          total_matches: allMatches.length,
          unique_works: result.length,
          total_recordings: recordingCount,
          strategies_used: searchStrategies.length
        },
        matches: allMatches, 
        works: result 
      }), {
        headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
      });
    }

    return new Response("Not Found", { status: 404 });
  } catch (e) {
    const msg = e instanceof Response ? await e.text() : (e as Error)?.message || "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
    });
  }
});