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
  return `${tok.tokenType || "Bearer"} ${tok.accessToken}`;
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

      const auth = await withRetry(getToken);
      const searchBody: SearchWorkReq = {
        title: title, // optional: limit by a known work title
        writers: [{ writerFirstName: firstName, writerLastName: lastName, writerIPI: ipi }].filter(Boolean),
      };

      const matches = await withRetry(() => mlcSearchSongcode(auth, searchBody)); // [{ mlcSongCode, workTitle, iswc, writers: [...] }]
      const codes = [...new Set(matches.map((m: any) => m.mlcSongCode).filter(Boolean))];

      // Hydrate Work details (writers/publishers/ISWC/AKAs/artists)
      const works = codes.length ? await withRetry(() => mlcGetWorks(auth, codes)) : [];

      // Attach recordings (ISRCs) per work using title+artist (fallback if artist missing: title only)
      const recsByCode = new Map<string, any[]>();
      for (const w of works) {
        const recs = await withRetry(() => mlcSearchRecordings(auth, {
          title: w.primaryTitle,
          artist: w.artists || undefined
        }));
        recsByCode.set(w.mlcSongCode, recs);
      }

      // Normalized payload ready for UI + DB
      const result = works.map((w: any) => ({
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

      return new Response(JSON.stringify({ matches, works: result }), {
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