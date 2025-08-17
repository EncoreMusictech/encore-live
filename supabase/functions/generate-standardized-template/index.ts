import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface GenerateTemplateRequest {
  contractType: string;
  jurisdiction?: string;
  tone?: 'standard' | 'conservative' | 'aggressive' | 'friendly';
}

interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: any;
  category: 'parties' | 'financial' | 'terms' | 'schedule' | 'signatures';
  helpText?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { contractType, jurisdiction = 'US', tone = 'standard' }: GenerateTemplateRequest = await req.json();

    // Generate standardized contract content
    const contractContent = await generateContractContent(contractType, jurisdiction, tone);
    
    // Extract template fields from the generated content
    const templateFields = await extractTemplateFields(contractContent, contractType);

    return new Response(
      JSON.stringify({
        contractContent,
        templateFields,
        contractType,
        jurisdiction,
        tone
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating template:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate template' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateContractContent(contractType: string, jurisdiction: string, tone: string): Promise<string> {
  const systemPrompt = `You are a legal contract expert specializing in music industry agreements. Generate a complete, professional ${contractType} contract template that includes:

1. Proper legal language and structure
2. Industry-standard clauses and terms
3. Variable placeholders using {{variable_name}} format for customizable fields
4. Appropriate sections for the contract type
5. Professional formatting with numbered clauses
6. ${jurisdiction} jurisdiction considerations
7. ${tone} tone throughout

Contract types and their key components:
- publishing: songwriter/publisher agreements, royalty splits, copyright ownership, territories
- artist_recording: recording deals, advances, royalty rates, album commitments
- distribution: distribution rights, territory, revenue splits, marketing obligations
- sync: synchronization rights, usage terms, fees, territories, exclusivity
- producer: production services, points, credits, ownership rights

Use {{variable_name}} format for all customizable fields like names, dates, percentages, amounts, etc.
Make this a complete, professional contract that could be used in real business.`;

  const userPrompt = `Generate a comprehensive ${contractType} contract template with proper legal structure and industry-standard terms. Include all necessary sections and use {{variable_name}} placeholders for customizable fields.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function extractTemplateFields(contractContent: string, contractType: string): Promise<TemplateField[]> {
  const systemPrompt = `You are a contract analysis expert. Analyze the provided contract template and extract all {{variable_name}} placeholders to create form fields.

For each placeholder found, determine:
1. Field type (text, number, date, select, textarea, checkbox)
2. Whether it's required
3. Appropriate category (parties, financial, terms, schedule, signatures)
4. Helpful placeholder text
5. For select fields, provide realistic options
6. Validation rules if applicable
7. Help text to guide users

Categories:
- parties: Names, addresses, contact info, roles
- financial: Amounts, percentages, payment terms
- terms: Durations, territories, rights, restrictions  
- schedule: Dates, deadlines, milestones
- signatures: Signature fields, witness info

Return a JSON array of field objects with the structure:
{
  "id": "field_id",
  "name": "variable_name", 
  "label": "Display Label",
  "type": "field_type",
  "required": boolean,
  "placeholder": "placeholder text",
  "options": ["option1", "option2"] (for select fields),
  "category": "category_name",
  "helpText": "helpful guidance"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract template fields from this ${contractType} contract:\n\n${contractContent}` }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '[]';
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse extracted fields:', error);
    return [];
  }
}