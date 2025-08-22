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
  const system = `You are a senior music attorney and world-class legal drafter.
  Requirements:
  - Produce clean, production-ready HTML (semantic tags; minimal inline styles)
  - Include Exhibits: A (Parties) and B (Schedule of Works)
  - Do NOT include any Version or Status metadata anywhere
  - Title the signature section exactly: "Signatures" (not "Signature Block")
  - Do NOT draw boxes/borders around the signatures; just two signature lines
  - Never hallucinate numbers; when unknown, use [Placeholder]
  `;

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

  // Normalize output
  content = content.replace(/Signature\s*Block/gi, 'Signatures');
  // Remove Version/Status lines
  content = content.replace(/(?:Version|Status)\s*:\s*[^<\n\r]+/gi, '');

  // If the model returned a full HTML document, use it as-is. Otherwise, wrap it.
  const isFullDoc = /<html[\s>]|<!doctype/i.test(content);
  return isFullDoc ? content : wrapHtml(content, payload.meta?.title || 'Agreement');
}

function deterministicTemplate(payload: any): string {
  const title = 'Publishing Administration Agreement';
  
  // Extract data from payload with fallbacks
  const writer = payload.parties.find((p: any) => p.role === 'writer' || p.role === 'individual') || payload.parties[0] || {};
  const publisher = payload.parties.find((p: any) => p.role === 'publisher' || p.role === 'company') || payload.parties[1] || {};
  
  const effective_date = payload.dates?.start_date || '[Effective Date]';
  const writer_legal_name = writer.name || '[Writer Legal Name]';
  const ipi_cae = writer.ipi_cae || '[IPI/CAE Number]';
  const pro_affiliation = writer.pro_affiliation || '[PRO Affiliation]';
  const company_address = writer.address || '[Writer Address]';
  const publisher_name = publisher.name || '[Publisher Name]';
  const publisher_address = publisher.address || '[Publisher Address]';
  const company_representative_name = publisher.representative_name || '[Representative Name]';
  const company_representative_title = publisher.representative_title || '[Representative Title]';
  const term_years = payload.terms?.term_years || '[Term Years]';
  const option_periods_count = payload.terms?.option_periods_count || '[Option Periods]';
  const territory = payload.terms?.territory || 'Worldwide';
  const advance_amount = payload.money?.advance_amount || '0';
  const admin_fee_percent = payload.money?.commission_percentage || '[Admin Fee %]';
  const payment_method = payload.terms?.payment_method || '[Payment Method]';
  const accounting_frequency = payload.terms?.royalty_frequency || 'quarterly';
  const invoice_due_days = payload.terms?.payment_terms_days || '30';
  const governing_law = payload.terms?.governing_law || '[Governing Law]';
  const jurisdiction = payload.terms?.jurisdiction || '[Jurisdiction]';
  
  // Generate works table
  const worksRows = payload.works.map((w: any) => 
    `<tr>
      <td>${escapeHtml(w.title)}</td>
      <td>${escapeHtml(w.iswc || '[ISWC]')}</td>
      <td>${escapeHtml(w.writers || '[Writers]')}</td>
      <td>${escapeHtml(w.publishers || '[Publishers]')}</td>
    </tr>`
  ).join('');

  const core = `
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Publishing Administration Agreement</h1>
  </header>
  
  <main style="line-height: 1.6;">
    <p>This Publishing Administration Agreement ("Agreement") is made and entered into as of <strong>${escapeHtml(effective_date)}</strong> (the "Effective Date"), by and between:</p>
    
    <p><strong>${escapeHtml(writer_legal_name)}</strong> ("Writer"), IPI/CAE: <strong>${escapeHtml(ipi_cae)}</strong>, PRO: <strong>${escapeHtml(pro_affiliation)}</strong>, located at ${escapeHtml(company_address)},</p>
    
    <p>and</p>
    
    <p><strong>${escapeHtml(publisher_name)}</strong>, at ${escapeHtml(publisher_address)} ("Administrator"), represented by <strong>${escapeHtml(company_representative_name)}</strong>, <strong>${escapeHtml(company_representative_title)}</strong>.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">1. TERM</h2>
    <p>The term of this Agreement shall commence on the Effective Date and continue for <strong>${escapeHtml(term_years)}</strong> year(s), unless earlier terminated in accordance with this Agreement (the "Term").</p>
    <p>Administrator shall have <strong>${escapeHtml(option_periods_count)}</strong> option(s) to extend the Term for additional periods upon written notice.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">2. GRANT OF RIGHTS</h2>
    <p>Writer hereby grants to Administrator the sole and exclusive right to administer and exploit the musical compositions listed in Schedule A and any additional compositions created during the Term (the "Compositions") throughout the <strong>${escapeHtml(territory)}</strong>.</p>
    <p>Administrator shall have the right to:</p>
    <ul>
      <li>License and collect royalties from performances, reproductions, and uses of the Compositions;</li>
      <li>Enter into subpublishing agreements;</li>
      <li>Print, publish, and distribute sheet music;</li>
      <li>Synchronize Compositions with audiovisual works (subject to Writer's approval for sensitive uses such as political, religious, or explicit content);</li>
      <li>Use Writer's approved name, likeness, and biographical information in connection with exploitation of the Compositions.</li>
    </ul>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">3. ADVANCES</h2>
    <p>Administrator shall pay Writer an advance of <strong>$${escapeHtml(advance_amount)}</strong> (the "Advance"), recoupable from royalties earned under this Agreement.</p>
    <p>Any additional advances, if made, shall also be fully recoupable from Writer's royalties.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">4. ADMINISTRATION FEE; ROYALTIES</h2>
    <p>Administrator shall collect all gross income derived from the Compositions ("Gross Receipts"). After deducting the Administration Fee and recoupable amounts, Administrator shall pay Writer the balance of Net Income.</p>
    <p>Administration Fee: <strong>${escapeHtml(admin_fee_percent)}%</strong>.</p>
    <p>Payment Method: <strong>${escapeHtml(payment_method)}</strong>.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">5. PERFORMING RIGHTS</h2>
    <p>The performing rights in each Composition shall be licensed and collected by the appropriate performing rights societies (e.g., <strong>${escapeHtml(pro_affiliation)}</strong>). Administrator shall receive the publisher's share, and Writer shall receive the writer's share directly.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">6. ACCOUNTING</h2>
    <p>Administrator shall render royalty statements to Writer on a <strong>${escapeHtml(accounting_frequency)}</strong> basis within <strong>${escapeHtml(invoice_due_days)}</strong> days after the end of each accounting period.</p>
    <p>Payments shall accompany each statement, subject to recoupment and reserves.</p>
    <p>Writer shall have the right, at Writer's expense, to audit Administrator's books not more than once per year, with at least <strong>${escapeHtml(invoice_due_days)}</strong> days' prior notice.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">7. WARRANTIES AND REPRESENTATIONS</h2>
    <p>Writer represents and warrants that:</p>
    <ul>
      <li>Writer owns or controls the rights to the Compositions;</li>
      <li>The Compositions do not infringe upon any other works;</li>
      <li>Writer has full authority to enter into this Agreement.</li>
    </ul>
    <p>Administrator represents and warrants that it has the authority to enter into this Agreement.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">8. INDEMNITY</h2>
    <p>Each party agrees to indemnify and hold harmless the other from claims, damages, and expenses arising from any breach of this Agreement.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">9. TERMINATION</h2>
    <p>Upon expiration or termination of the Term:</p>
    <ul>
      <li>Administrator shall continue to collect royalties during the <strong>${escapeHtml(term_years)}</strong> year(s) Rights Period.</li>
      <li>After the Rights Period, Administrator may collect royalties for an additional <strong>${escapeHtml(option_periods_count)}</strong> year(s) Collection Period solely to cover licenses already granted.</li>
    </ul>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">10. MISCELLANEOUS</h2>
    <p><strong>Notices:</strong> All notices shall be sent to the addresses set forth above.</p>
    <p><strong>Entire Agreement:</strong> This Agreement constitutes the entire understanding between the parties.</p>
    <p><strong>Governing Law:</strong> This Agreement shall be governed by the laws of <strong>${escapeHtml(governing_law)}</strong>.</p>
    <p><strong>Dispute Resolution:</strong> Any disputes shall be resolved in the courts of <strong>${escapeHtml(jurisdiction)}</strong>.</p>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">SIGNATURES</h2>
    <div style="margin: 30px 0;">
      <p><strong>Writer:</strong></p>
      <div style="margin: 20px 0;">
        <div style="border-bottom: 1px solid #999; width: 300px; height: 40px; display: inline-block;"></div>
      </div>
      <p>Name: <strong>${escapeHtml(writer_legal_name)}</strong></p>
    </div>
    
    <div style="margin: 30px 0;">
      <p><strong>Administrator:</strong></p>
      <div style="margin: 20px 0;">
        <div style="border-bottom: 1px solid #999; width: 300px; height: 40px; display: inline-block;"></div>
      </div>
      <p>Name: <strong>${escapeHtml(company_representative_name)}</strong></p>
      <p>Title: <strong>${escapeHtml(company_representative_title)}</strong></p>
    </div>
    
    <h2 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0;">SCHEDULE A – COMPOSITIONS</h2>
    <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="border: 1px solid #ccc; padding: 8px;">Title</th>
          <th style="border: 1px solid #ccc; padding: 8px;">ISWC</th>
          <th style="border: 1px solid #ccc; padding: 8px;">Writers</th>
          <th style="border: 1px solid #ccc; padding: 8px;">Publishers</th>
        </tr>
      </thead>
      <tbody>
        ${worksRows || '<tr><td colspan="4" style="border: 1px solid #ccc; padding: 8px; text-align: center;">[To Be Supplied]</td></tr>'}
      </tbody>
    </table>
  </main>`;

  return wrapHtml(core, title);
}

function wrapHtml(inner: string, title: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(title)}</title>
  <style>body{font-family:Inter,system-ui,Arial,sans-serif;line-height:1.5;padding:24px;color:#111} h1{font-size:24px;margin:0 0 8px} h2{font-size:18px;margin:20px 0 8px} header{margin-bottom:16px} table{border-collapse:collapse} th,td{border:1px solid #ccc} [class*="signature"],[id*="signature"]{border:none!important;box-shadow:none!important;outline:none!important}</style>
  </head><body>${inner}</body></html>`;
}

function escapeHtml(str: string){
  return String(str ?? '').replace(/[&<>"]+/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s] as string));
}
