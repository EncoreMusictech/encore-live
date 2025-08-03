import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { 
      songwriterName, 
      sessionType, 
      searchId,
      additionalContext = {}
    } = await req.json();

    console.log(`Starting AI research for songwriter: ${songwriterName}, session type: ${sessionType}`);

    // Create research session record
    const { data: session, error: sessionError } = await supabase
      .from('ai_research_sessions')
      .insert({
        search_id: searchId,
        user_id: user.id,
        session_type: sessionType,
        research_query: `Research songwriter: ${songwriterName}`,
        session_status: 'processing'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create research session: ${sessionError.message}`);
    }

    const startTime = Date.now();

    // Prepare AI prompt based on session type
    let systemPrompt = '';
    let userPrompt = '';

    switch (sessionType) {
      case 'initial_search':
        systemPrompt = `You are a music industry research specialist with expertise in songwriter catalogs, PRO registrations, and royalty collection. Your task is to research and analyze songwriter information to help estimate uncollected royalties.

Research the songwriter thoroughly and provide structured data about:
1. Career overview and active periods
2. Known catalog of songs with co-writers
3. PRO affiliations (ASCAP, BMI, SESAC, etc.)
4. Publisher relationships
5. Registration gaps and potential uncollected royalties
6. Estimated catalog value and pipeline income

Provide confidence scores for each finding and cite sources where possible.`;

        userPrompt = `Research songwriter "${songwriterName}" and provide a comprehensive analysis including:

1. Career Overview:
   - Active years
   - Primary genres
   - Notable collaborations
   - Estimated total songs written

2. Catalog Analysis:
   - List of known songs (at least 10-20 if available)
   - Co-writers for each song
   - Publisher information
   - ISWC codes where available

3. PRO Registration Status:
   - Current PRO affiliations
   - Registration completeness
   - Potential gaps in registration

4. Royalty Pipeline Assessment:
   - Estimated annual performance royalties
   - Mechanical royalty potential
   - Sync licensing opportunities
   - Uncollected royalty estimates

5. Confidence Assessment:
   - Data reliability score (1-10)
   - Sources used
   - Recommendations for further research

Format your response as structured JSON with clear sections for each category.`;
        break;

      case 'metadata_enhancement':
        systemPrompt = `You are a music metadata specialist focused on enhancing song-level data for royalty pipeline analysis. Analyze specific songs and provide detailed metadata.`;
        userPrompt = `Enhance metadata for songs by ${songwriterName}. Provide detailed information about:
- Song titles and alternate versions
- Complete writer and publisher credits
- ISWC/ISRC codes
- Commercial performance data
- Registration status across PROs
- Estimated royalty values

Additional context: ${JSON.stringify(additionalContext)}`;
        break;

      case 'pipeline_analysis':
        systemPrompt = `You are a royalty pipeline analyst specializing in estimating uncollected music royalties. Calculate potential income streams.`;
        userPrompt = `Analyze the royalty pipeline for ${songwriterName}'s catalog. Estimate:
- Annual performance royalty potential
- Mechanical royalty streams
- Sync licensing opportunities
- Registration gaps impact
- Total uncollected royalty estimate

Use context: ${JSON.stringify(additionalContext)}`;
        break;

      default:
        throw new Error(`Unknown session type: ${sessionType}`);
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    const tokensUsed = aiData.usage?.total_tokens || 0;
    const processingTime = Date.now() - startTime;

    // Parse AI response if it's JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      parsedResponse = { raw_response: aiResponse };
    }

    // Update research session with results
    const { error: updateError } = await supabase
      .from('ai_research_sessions')
      .update({
        ai_response: parsedResponse,
        findings_summary: typeof parsedResponse === 'object' ? 
          parsedResponse.summary || 'AI research completed' : 
          aiResponse.substring(0, 500),
        confidence_assessment: parsedResponse.confidence_score || 5,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime,
        session_status: 'completed',
        sources_checked: parsedResponse.sources || []
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update research session:', updateError);
    }

    console.log(`AI research completed. Tokens used: ${tokensUsed}, Time: ${processingTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      aiResponse: parsedResponse,
      tokensUsed,
      processingTime,
      summary: parsedResponse.summary || 'Research completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in song-estimator-ai function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});