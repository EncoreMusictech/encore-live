import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type AgreementSubtype = 'administration' | 'co_publishing' | 'exclusive_songwriter' | 'catalog_acquisition' | 'artist' | 'producer' | 'sync' | 'distribution';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, forceSubtype }: { contractId: string; forceSubtype?: AgreementSubtype } = await req.json();
    if (!contractId) throw new Error('contractId is required');

    // Load contract with related data
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`*, contract_interested_parties(*), contract_schedule_works(*)`)
      .eq('id', contractId)
      .maybeSingle();

    if (error) throw new Error(`DB error: ${error.message}`);
    if (!contract) throw new Error('Contract not found');

    const subtype: AgreementSubtype = forceSubtype || (contract.contract_data?.agreement_type as AgreementSubtype) || mapContractType(contract.contract_type);

    // Build clean payload for the model
    const payload = buildAgreementPayload(contract, subtype);

    // Try AI generation first
    let html = '';
    if (OPENAI_API_KEY) {
      try {
        html = await generateWithOpenAI(payload);
      } catch (aiErr) {
        console.error('OpenAI generation failed, falling back to deterministic template:', aiErr);
      }
    } else {
      console.log('OPENAI_API_KEY not set; using deterministic template.');
    }

    // Fallback deterministic generation
    if (!html || html.trim().length < 500) {
      html = deterministicTemplate(payload);
    }

    // Optionally persist a URL marker and status
    await supabase
      .from('contracts')
      .update({ generated_pdf_url: `agreement-${contractId}.html`, signature_status: 'ready_for_signature' })
      .eq('id', contractId);

    return new Response(
      JSON.stringify({ success: true, contractId, contractTitle: contract.title, subtype, pdfData: html, downloadUrl: `agreement-${contractId}.html` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('generate-agreement-pdf error:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function mapContractType(contractType: string): AgreementSubtype {
  switch (contractType) {
    case 'publishing':
      return 'administration';
    case 'artist':
      return 'artist';
    case 'producer':
      return 'producer';
    case 'sync':
      return 'sync';
    case 'distribution':
      return 'distribution';
    default:
      return 'administration';
  }
}

function buildAgreementPayload(contract: any, subtype: AgreementSubtype) {
  const cd = contract.contract_data || {};
  const ft = contract.financial_terms || {};
  const rs = contract.royalty_splits || {};
  const parties = (contract.contract_interested_parties || []).map((p: any) => ({
    name: p.name || p.party_name || '[Name]',
    role: p.party_type || 'party',
    email: p.email || null,
    address: p.address || null,
    controlled_status: p.controlled_status || null,
    performance_percentage: p.performance_percentage ?? null,
    mechanical_percentage: p.mechanical_percentage ?? null,
    synch_percentage: p.synch_percentage ?? null,
  }));

  const works = (contract.contract_schedule_works || []).map((w: any) => ({
    title: w.song_title || w.work_title || w.title || '[Title]',
    artist: w.artist_name || contract.counterparty_name || null,
    album: w.album_title || null,
    isrc: w.isrc || null,
    iswc: w.iswc || null,
    work_id: w.work_id || null,
  }));

  return {
    subtype,
    meta: {
      agreement_id: contract.agreement_id,
      title: contract.title,
      contract_type: contract.contract_type,
      version: contract.version,
      status: contract.contract_status,
    },
    dates: {
      start_date: contract.start_date || cd.effective_date || null,
      end_date: contract.end_date || cd.end_date || null,
    },
    terms: {
      territory: cd.territories || contract.territories || 'Worldwide',
      distribution_cycle: contract.distribution_cycle || 'quarterly',
      statement_delivery: contract.statement_delivery || 'combined',
      recoupment_status: contract.recoupment_status || 'unrecouped',
      governing_law: cd.governing_law || null,
      delivery_requirement: cd.delivery_requirement || cd.delivery_commitment || null,
      approval_rights: cd.approval_terms || null,
      exclusivity: cd.exclusivity ?? null,
      royalty_frequency: cd.royalty_frequency || contract.statement_delivery || 'quarterly',
    },
    money: {
      advance_amount: contract.advance_amount || ft.advance || cd.advance_amount || 0,
      commission_percentage: contract.commission_percentage || ft.commission_percentage || null,
      rate_reduction_percentage: contract.rate_reduction_percentage || ft.rate_reduction_percentage || null,
      minimum_payment_threshold: cd.minimum_payment_threshold || null,
      payment_terms_days: cd.payment_terms_days || null,
      acquisition_price: cd.acquisition_price || null,
    },
    splits: {
      publisher_share_percentage: rs.publisher_share_percentage || cd.publisher_share_percentage || null,
      writer_share_percentage: rs.writer_share_percentage || cd.writer_share_percentage || null,
      mechanical_split_percentage: rs.mechanical_split_percentage || cd.mechanical_split_percentage || null,
      sync_split_percentage: rs.sync_revenue_split_percentage || cd.sync_revenue_split_percentage || null,
    },
    parties,
    works,
    counterparty: {
      name: contract.counterparty_name,
      email: contract.recipient_email,
      address: contract.contact_address,
    },
  };
}

async function generateWithOpenAI(payload: any): Promise<string> {
  const model = 'gpt-4.1-2025-04-14';
  const system = `You are a senior music attorney and world-class legal drafter. Generate a professional, production-ready HTML agreement using semantic HTML with inline styles kept minimal. Use headings, sections, and tables. Include a signature block and Exhibits: Exhibit A (Parties) and Exhibit B (Schedule of Works). Tailor to the subtype and populate with provided data. Do NOT hallucinate unknown numbers—leave bracketed placeholders like [Commission %] where missing.`;

  const user = JSON.stringify(payload);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Draft a ${payload.subtype} agreement as HTML. Data:\n${user}` },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  let content = data.choices?.[0]?.message?.content || '';

  // Strip markdown code fences that models often add (```html ... ```)
  content = content.replace(/^\uFEFF/, '');
  // Remove up to three leading code-fence lines like ```html or ``` HTML
  for (let i = 0; i < 3; i++) {
    content = content.replace(/^\s*```\s*[a-zA-Z]*\s*\r?\n?/, '');
  }
  // In case a lone 'html' label is left after removal
  content = content.replace(/^\s*html\s*\r?\n/i, '');
  // Trim trailing closing fences
  content = content.replace(/\r?\n?\s*```+\s*$/i, '').replace(/```/g, '');
  content = content.trim();


  // If the model returned a full HTML document, use it as-is. Otherwise, wrap it.
  const isFullDoc = /<html[\s>]|<!doctype/i.test(content);
  return isFullDoc ? content : wrapHtml(content, payload.meta?.title || 'Agreement');
}

function deterministicTemplate(payload: any): string {
  const title = payload.meta?.title || 'Music Agreement';
  const subtype = payload.subtype || 'administration';
  const partiesRows = payload.parties.map((p: any) => `<tr><td>${escapeHtml(p.role)}</td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.email||'')}</td></tr>`).join('');
  const worksRows = payload.works.map((w: any, i: number) => `<tr><td>${i+1}</td><td>${escapeHtml(w.title)}</td><td>${escapeHtml(w.artist||'')}</td><td>${escapeHtml(w.isrc||'')}</td><td>${escapeHtml(w.iswc||'')}</td></tr>`).join('');

  const core = `
  <header>
    <h1>${escapeHtml(title)}</h1>
    <p><strong>Agreement Type:</strong> ${escapeHtml(subtype)}</p>
  </header>
  <main>
    <section>
      <h2>Principal Terms</h2>
      <ul>
        <li><strong>Start Date:</strong> ${escapeHtml(payload.dates?.start_date || '[Effective Date]')}</li>
        <li><strong>End Date:</strong> ${escapeHtml(payload.dates?.end_date || '[End Date]')}</li>
        <li><strong>Territory:</strong> ${escapeHtml(payload.terms?.territory || 'Worldwide')}</li>
        <li><strong>Royalty Frequency:</strong> ${escapeHtml(payload.terms?.royalty_frequency || 'Quarterly')}</li>
        <li><strong>Advance:</strong> ${payload.money?.advance_amount ?? 0}</li>
        <li><strong>Commission %:</strong> ${payload.money?.commission_percentage ?? '[Commission %]'}</li>
      </ul>
    </section>

    <section>
      <h2>Revenue Splits</h2>
      <ul>
        <li>Publisher Share: ${payload.splits?.publisher_share_percentage ?? '[%]'}</li>
        <li>Writer Share: ${payload.splits?.writer_share_percentage ?? '[%]'}</li>
        <li>Mechanical: ${payload.splits?.mechanical_split_percentage ?? '[%]'}</li>
        <li>Sync: ${payload.splits?.sync_split_percentage ?? '[%]'}</li>
      </ul>
    </section>

    <section>
      <h2>Exhibit A — Parties</h2>
      <table border="1" cellpadding="6" cellspacing="0" width="100%">
        <thead><tr><th>Role</th><th>Name</th><th>Email</th></tr></thead>
        <tbody>${partiesRows}</tbody>
      </table>
    </section>

    <section>
      <h2>Exhibit B — Schedule of Works</h2>
      <table border="1" cellpadding="6" cellspacing="0" width="100%">
        <thead><tr><th>#</th><th>Title</th><th>Artist</th><th>ISRC</th><th>ISWC</th></tr></thead>
        <tbody>${worksRows || '<tr><td colspan="5">[To Be Supplied]</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>Signatures</h2>
      <p>Signed by the parties as of the Effective Date.</p>
      <div style="display:flex;gap:40px;flex-wrap:wrap;margin-top:24px;">
        <div><div style="border-bottom:1px solid #999;width:260px;height:40px;"></div><div>Authorized Signatory</div></div>
        <div><div style="border-bottom:1px solid #999;width:260px;height:40px;"></div><div>Authorized Signatory</div></div>
      </div>
    </section>
  </main>`;

  return wrapHtml(core, title);
}

function wrapHtml(inner: string, title: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(title)}</title>
  <style>body{font-family:Inter,system-ui,Arial,sans-serif;line-height:1.5;padding:24px;color:#111} h1{font-size:24px;margin:0 0 8px} h2{font-size:18px;margin:20px 0 8px} header{margin-bottom:16px} table{border-collapse:collapse} th,td{border:1px solid #ccc}</style>
  </head><body>${inner}</body></html>`;
}

function escapeHtml(str: string){
  return String(str ?? '').replace(/[&<>"]+/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s] as string));
}
