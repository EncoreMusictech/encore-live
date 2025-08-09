import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface GenerateBody {
  fieldId?: string;
  fieldLabel?: string;
  fieldType?: string;
  contractType?: string;
  currentClause?: string;
  values?: Record<string, any>; // current preview values to ground the clause
  tone?: 'standard' | 'conservative' | 'aggressive' | 'friendly';
  jurisdiction?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing OPENAI_API_KEY secret' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await req.json()) as GenerateBody;

    const systemPrompt = `You are an expert music-industry contract drafter. Generate a concise, enforceable contract clause for the specified field. 
Rules:
- Return ONLY the clause text, no preface or labels.
- Use professional legal tone and clear obligations.
- If helpful, include variables using double curly tokens like {{artist_name}}; do not invent unknown tokens.
- Keep it 1-4 sentences unless inherently longer is needed.
- Do not include signatures or headings.`;

    const userContext = {
      field: {
        id: body.fieldId,
        label: body.fieldLabel,
        type: body.fieldType,
      },
      contractType: body.contractType,
      tone: body.tone ?? 'standard',
      jurisdiction: body.jurisdiction ?? 'global',
      currentClause: body.currentClause ?? '',
      values: body.values ?? {},
    };

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Draft a clause for the field "${userContext.field.label ?? userContext.field.id}" in a ${userContext.contractType} agreement.
Tone: ${userContext.tone}. Jurisdiction: ${userContext.jurisdiction}.
Current clause (if any): ${userContext.currentClause || 'none'}
Known field values (may include token names like {{artist_name}} if not yet provided):\n${JSON.stringify(userContext.values, null, 2)}
Generate only the clause text.`,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      return new Response(
        JSON.stringify({ error: 'OpenAI API error', details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const suggestion: string = data.choices?.[0]?.message?.content?.trim() ?? '';

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('generate-contract-clause error:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
