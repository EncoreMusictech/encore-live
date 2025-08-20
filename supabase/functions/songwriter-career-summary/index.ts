import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { songwriterName, additionalContext } = await req.json();

    if (!songwriterName) {
      return new Response(
        JSON.stringify({ error: 'Songwriter name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating career summary for songwriter: ${songwriterName}`);

    const prompt = `You are a music industry expert. Provide a concise career summary for the songwriter "${songwriterName}". Include:

1. **Career Overview**: Brief background and career span
2. **Notable Achievements**: Major hits, awards, and recognition
3. **Collaborations**: Key artists they've worked with
4. **Musical Style**: Genres and songwriting characteristics

${additionalContext ? `Additional context: ${additionalContext}` : ''}

IMPORTANT: Keep the response under 150 words total. Be concise and focus on the most important career highlights. If the songwriter is not well-known, provide a brief explanation in under 150 words.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable music industry analyst specializing in songwriter careers and achievements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const careerSummary = data.choices[0].message.content;

    console.log(`Successfully generated career summary for ${songwriterName}`);

    return new Response(
      JSON.stringify({ 
        songwriterName,
        careerSummary,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in songwriter-career-summary function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate career summary',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});