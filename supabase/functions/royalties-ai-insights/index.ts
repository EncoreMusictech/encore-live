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
    const { analyticsData, filters } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare data summary for AI analysis
    const dataSummary = {
      totalRevenue: analyticsData.total,
      totalCount: analyticsData.count,
      averagePerRoyalty: analyticsData.count > 0 ? analyticsData.total / analyticsData.count : 0,
      quarterlyTrends: analyticsData.quarterly,
      controlledDistribution: analyticsData.controlled,
      topSongs: analyticsData.topSongs.slice(0, 5),
      appliedFilters: filters
    };

    const prompt = `
    Analyze the following royalty data and provide strategic insights:

    Revenue Summary:
    - Total Revenue: $${dataSummary.totalRevenue.toLocaleString()}
    - Total Royalties: ${dataSummary.totalCount}
    - Average per Royalty: $${dataSummary.averagePerRoyalty.toFixed(2)}

    Quarterly Performance:
    ${dataSummary.quarterlyTrends.map((q: any) => `- ${q.quarter}: $${q.amount.toLocaleString()}`).join('\n')}

    Controlled Status Distribution:
    ${dataSummary.controlledDistribution.map((c: any) => `- ${c.name}: $${c.value.toLocaleString()}`).join('\n')}

    Top Performing Songs:
    ${dataSummary.topSongs.map((s: any, i: number) => `${i + 1}. ${s.song}: $${s.amount.toLocaleString()}`).join('\n')}

    Applied Filters: ${Object.entries(dataSummary.appliedFilters).filter(([k, v]) => v !== 'all').map(([k, v]) => `${k}: ${v}`).join(', ') || 'None'}

    Please provide:
    1. Key performance trends and patterns
    2. Revenue optimization opportunities
    3. Portfolio diversification insights
    4. Seasonal patterns or anomalies
    5. Strategic recommendations for maximizing royalty income

    Keep the analysis concise but actionable, focusing on business insights rather than just data description.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a music industry financial analyst specializing in royalty performance and revenue optimization. Provide clear, actionable insights based on royalty data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    console.log('Generated AI insights for royalty analytics');

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in royalties-ai-insights function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'Failed to generate insights'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});