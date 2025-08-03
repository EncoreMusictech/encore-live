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

    // Process and update song catalog search for initial_search
    if (sessionType === 'initial_search') {
      console.log('Processing initial search results...');
      
      // Extract songs from the AI response
      const knownSongs = parsedResponse.CatalogAnalysis?.KnownSongs || 
                        parsedResponse.catalog_analysis?.songs || 
                        parsedResponse.known_songs || [];
      
      const totalSongs = knownSongs.length;
      console.log(`Found ${totalSongs} songs to process`);

      // Create song metadata entries
      if (knownSongs.length > 0) {
        const songMetadata = knownSongs.map((song: any) => ({
          search_id: searchId,
          user_id: user.id,
          song_title: song.Title || song.title || song.name,
          songwriter_name: songwriterName,
          co_writers: song.CoWriters || song.co_writers || [],
          publishers: song.Publisher ? [song.Publisher] : (song.publishers || []),
          pro_registrations: {},
          iswc: song.ISWC || song.iswc,
          estimated_splits: {},
          registration_gaps: [],
          metadata_completeness_score: 0.8, // Default high score for AI-generated data
          verification_status: 'ai_generated',
          source_data: { 
            ai_session: session.id, 
            confidence: parsedResponse.ConfidenceAssessment?.DataReliabilityScore || parsedResponse.confidence_score || 7,
            ai_response: song
          }
        }));

        const { error: metadataError } = await supabase
          .from('song_metadata_cache')
          .insert(songMetadata);

        if (metadataError) {
          console.error('Error inserting song metadata:', metadataError);
        } else {
          console.log(`Successfully inserted ${songMetadata.length} song metadata records`);
        }
      }

      // Calculate pipeline estimate
      const pipelineEstimate = parsedResponse.RoyaltyPipelineAssessment?.UncollectedRoyaltyEstimates || 
                              parsedResponse.royalty_pipeline?.total_estimate || 
                              0;

      // Parse pipeline estimate if it's a string like "$500,000 - $1 million"
      let estimateValue = 0;
      if (typeof pipelineEstimate === 'string') {
        // Extract numbers from strings like "$500,000 - $1 million"
        const matches = pipelineEstimate.match(/\$?([0-9,]+)/g);
        if (matches && matches.length > 0) {
          // Take the first number found
          const numStr = matches[0].replace(/[$,]/g, '');
          estimateValue = parseInt(numStr) || 0;
        }
      } else if (typeof pipelineEstimate === 'number') {
        estimateValue = pipelineEstimate;
      }

      // Update the song catalog search record
      const { error: searchUpdateError } = await supabase
        .from('song_catalog_searches')
        .update({
          search_status: 'completed',
          total_songs_found: totalSongs,
          metadata_complete_count: Math.floor(totalSongs * 0.8), // Assume 80% completeness for AI data
          pipeline_estimate_total: estimateValue,
          last_refreshed_at: new Date().toISOString(),
          ai_research_summary: parsedResponse
        })
        .eq('id', searchId);

      if (searchUpdateError) {
        console.error('Error updating song catalog search:', searchUpdateError);
      } else {
        console.log('Successfully updated song catalog search record');
      }
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