import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ReportSection = 'executive' | 'technical' | 'market';

interface GenerateReportRequest {
  section: ReportSection;
  valuation: any; // ValuationResult shape from frontend
  minWords?: number;
  queries?: string[];
}

function summarizeValuationForPrompt(v: any) {
  try {
    return {
      artist_name: v?.artist_name,
      spotify: v?.spotify_data,
      totals: {
        streams: v?.total_streams,
        monthly_listeners: v?.monthly_listeners,
      },
      valuations: v?.valuations,
      fair_market_value: v?.fair_market_value,
      metrics: {
        ltm_revenue: v?.ltm_revenue,
        discount_rate: v?.discount_rate,
        dcf_valuation: v?.dcf_valuation,
        multiple_valuation: v?.multiple_valuation,
        risk_adjusted_value: v?.risk_adjusted_value,
        confidence_score: v?.confidence_score,
        catalog_age_years: v?.catalog_age_years,
        revenue_diversification_score: v?.revenue_diversification_score,
      },
      industry_benchmarks: v?.industry_benchmarks,
      comparable_artists: (v?.comparable_artists || []).slice(0, 10),
      forecasts_base: (v?.forecasts?.base || []).slice(0, 10),
      top_tracks: (v?.top_tracks || []).slice(0, 10),
      methodology: v?.valuation_methodology_v2 || v?.valuation_methodology,
      genre: v?.genre,
      popularity_score: v?.popularity_score,
    };
  } catch (_) {
    return v;
  }
}

function buildSystemPrompt(section: ReportSection, minWords: number) {
  const base = `You are a senior music IP valuation analyst. Your task is to write a deeply sourced, professional, long-form report (minimum ${minWords} words) as clean HTML (no <html> or <body> tags). Use web research to corroborate figures and include properly formatted reference links.

Critical requirements:
- Output VALID HTML only (use <h2>, <h3>, <p>, <ul>, <li>, <table> when appropriate). No markdown.
- Include a dedicated <h2>References</h2> section with clickable source URLs.
- Explain methodology and data provenance so a reader can reproduce calculations.
- Do not fabricate stats. If uncertain, state limitations.
`;
  if (section === 'executive') return base + 'Audience: board-level investors. Focus on valuation range, key drivers, risks, upside, and next actions.';
  if (section === 'technical') return base + 'Audience: technical diligence. Focus on assumptions, DCF steps, decay curves, discounting, comparables construction, and sensitivity.';
  return base + 'Audience: market/BD. Focus on positioning, comps, territory/genre dynamics, platform economics, and forecast factors.';
}

function buildUserPrompt(section: ReportSection, valuation: any, queries: string[] | undefined) {
  const summary = summarizeValuationForPrompt(valuation);
  const q = queries && queries.length ? queries : [
    `music catalog valuation multiples ${summary?.industry_benchmarks?.genre || summary?.genre || ''}`.trim(),
    `${summary?.artist_name} spotify followers`,
    `streaming payout rates by platform 2024`,
    `music IP discount rate ranges 2024`,
  ];
  return `Context data (JSON):\n${JSON.stringify(summary, null, 2)}\n\nResearch goals:\n- Validate genre multiples and risk factors\n- Validate Spotify popularity/followers and peer comps\n- Summarize current market conditions affecting pricing\n- Explain step-by-step how each figure is produced\n\nSearch focus keywords:\n- ${q.join('\n- ')}\n\nInstructions:\n- Produce a comprehensive ${section} report with clear sections and tables when helpful.\n- Minimum length: 2500 words.\n- Include a final References section with direct URLs.`;
}

async function callPerplexity(systemPrompt: string, userPrompt: string) {
  const resp = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 4000,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: 'year',
      frequency_penalty: 1,
      presence_penalty: 0,
    }),
  });
  if (!resp.ok) throw new Error(`Perplexity API error: ${resp.status}`);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return content;
}

async function callOpenAI(systemPrompt: string, userPrompt: string) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt + '\nNote: You do not have browsing. Do not invent citations; include a Limitations section explaining this.' },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 4000,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status}`);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GenerateReportRequest = await req.json();
    const { section, valuation, minWords = 2500, queries } = body || {};

    if (!section || !valuation) {
      return new Response(JSON.stringify({ error: 'Missing section or valuation data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPrompt(section, minWords);
    const userPrompt = buildUserPrompt(section, valuation, queries);

    let html: string = '';
    if (perplexityApiKey) {
      try {
        console.log('generate-report: using Perplexity');
        html = await callPerplexity(systemPrompt, userPrompt);
      } catch (e) {
        console.error('Perplexity call failed, falling back to OpenAI:', e);
        if (openAIApiKey) {
          html = await callOpenAI(systemPrompt, userPrompt);
        } else {
          throw e;
        }
      }
    } else if (openAIApiKey) {
      console.log('generate-report: using OpenAI');
      html = await callOpenAI(systemPrompt, userPrompt);
    } else {
      return new Response(JSON.stringify({ error: 'No AI keys configured. Please set PERPLEXITY_API_KEY or OPENAI_API_KEY.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!html || typeof html !== 'string') {
      html = '<p>AI generation returned empty content. Please try again.</p>';
    }
    // Ensure we return HTML fragment only
    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-report function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate report' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
