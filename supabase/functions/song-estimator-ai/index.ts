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

CRITICAL: Format your response as structured JSON with this exact structure:
{
  "career_overview": { "active_years": "", "genres": [], "total_songs_estimate": 0 },
  "catalog_analysis": {
    "known_songs": [
      { "title": "Song Title", "co_writers": ["Writer Name"], "publisher": "Publisher Name", "iswc": "ISWC Code" }
    ]
  },
  "pro_registration": { "affiliations": [], "completeness": "high/medium/low" },
  "royalty_pipeline": { "total_estimate": 0, "annual_performance": 0, "mechanical": 0, "sync": 0 },
  "confidence_score": 8
}`;
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
      // Handle cases where AI wraps JSON in markdown code blocks
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json') && cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(7, -3).trim();
      } else if (cleanResponse.startsWith('```') && cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(3, -3).trim();
      }
      
      parsedResponse = JSON.parse(cleanResponse);
      console.log('Successfully parsed AI response as JSON');
      console.log('Parsed response structure:', Object.keys(parsedResponse));
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI response first 1000 chars:', aiResponse.substring(0, 1000));
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
      
      // Extract songs from the AI response with comprehensive parsing
      let knownSongs = [];
      
      // Try all possible variations of song data structure
      const possiblePaths = [
        parsedResponse.catalog_analysis?.known_songs,  // New expected format
        parsedResponse.CatalogAnalysis?.KnownSongs,    // Legacy format 1
        parsedResponse.catalog_analysis?.songs,        // Legacy format 2
        parsedResponse.known_songs,                    // Direct array
        parsedResponse.songs,                          // Simple array
        parsedResponse.CatalogAnalysis?.songs,         // Alternative format
        parsedResponse.catalog?.known_songs,           // Alternative format
        parsedResponse.catalog?.songs                  // Alternative format
      ];
      
      for (const path of possiblePaths) {
        if (Array.isArray(path) && path.length > 0) {
          knownSongs = path;
          console.log(`Found songs using path with ${knownSongs.length} songs`);
          console.log('First song structure:', JSON.stringify(path[0], null, 2));
          break;
        }
      }
      
      // If still no songs found, log the full response structure for debugging
      if (knownSongs.length === 0) {
        console.log('No songs found in any expected path. Full response structure:');
        console.log(JSON.stringify(parsedResponse, null, 2));
        console.log('Checking if response has raw_response:', !!parsedResponse.raw_response);
        
        // Try to parse raw_response if it exists
        if (parsedResponse.raw_response && typeof parsedResponse.raw_response === 'string') {
          try {
            let cleanRawResponse = parsedResponse.raw_response.trim();
            if (cleanRawResponse.startsWith('```json') && cleanRawResponse.endsWith('```')) {
              cleanRawResponse = cleanRawResponse.slice(7, -3).trim();
            } else if (cleanRawResponse.startsWith('```') && cleanRawResponse.endsWith('```')) {
              cleanRawResponse = cleanRawResponse.slice(3, -3).trim();
            }
            const reparsedResponse = JSON.parse(cleanRawResponse);
            console.log('Successfully reparsed raw_response');
            console.log('Reparsed structure:', Object.keys(reparsedResponse));
            
            // Retry song extraction with reparsed data
            const reparsedPaths = [
              reparsedResponse.catalog_analysis?.known_songs,
              reparsedResponse.CatalogAnalysis?.KnownSongs,
              reparsedResponse.catalog_analysis?.songs,
              reparsedResponse.known_songs,
              reparsedResponse.songs
            ];
            
            for (const path of reparsedPaths) {
              if (Array.isArray(path) && path.length > 0) {
                knownSongs = path;
                parsedResponse = reparsedResponse; // Update the main parsed response
                console.log(`Found songs after reparsing with ${knownSongs.length} songs`);
                break;
              }
            }
          } catch (reparseError) {
            console.error('Failed to reparse raw_response:', reparseError);
          }
        }
      }
      
      const totalSongs = knownSongs.length;
      console.log(`Final count: Found ${totalSongs} songs to process`);

      // Create song metadata entries with BMI lookups
      if (knownSongs.length > 0) {
        console.log('Starting BMI lookups for discovered songs...');
        
        const songMetadata = [];
        let bmiVerifiedCount = 0;
        
        for (const song of knownSongs) {
          const songTitle = song.Title || song.title || song.name;
          console.log(`Processing song: ${songTitle}`);
          
          // Perform BMI lookup for each song
          let bmiData = null;
          let verificationStatus = 'ai_generated';
          let completenessScore = 0.6; // Base score for AI-only data
          
          try {
            console.log(`Looking up BMI data for: ${songTitle} by ${songwriterName}`);
            
            const { data: bmiResponse, error: bmiError } = await supabase.functions.invoke('bmi-lookup', {
              body: { 
                workTitle: songTitle, 
                writerName: songwriterName 
              }
            });
            
            if (!bmiError && bmiResponse?.found) {
              bmiData = bmiResponse;
              verificationStatus = 'bmi_verified';
              completenessScore = 0.95; // High score for BMI-verified data
              bmiVerifiedCount++;
              console.log(`BMI verification successful for: ${songTitle}`);
            } else {
              console.log(`No BMI data found for: ${songTitle}`);
            }
            
            // Small delay to avoid overwhelming BMI lookup
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (bmiError) {
            console.error(`BMI lookup failed for ${songTitle}:`, bmiError);
          }
          
          // Merge AI and BMI data
          const mergedPublishers = [];
          const proRegistrations: any = {};
          const registrationGaps = [];
          
          if (bmiData?.publishers?.length > 0) {
            mergedPublishers.push(...bmiData.publishers);
            proRegistrations.bmi = {
              verified: true,
              publishers: bmiData.publishers,
              writers: bmiData.writers
            };
          } else {
            // Use AI-discovered publishers
            const aiPublishers = song.Publisher ? [song.Publisher] : (song.publishers || []);
            mergedPublishers.push(...aiPublishers);
            if (aiPublishers.length === 0) {
              registrationGaps.push('no_publisher_information');
            }
          }
          
          // Check for other registration gaps
          if (!bmiData?.iswc && !(song.ISWC || song.iswc)) {
            registrationGaps.push('missing_iswc');
          }
          if (!bmiData?.writers?.length && !(song.CoWriters || song.co_writers)?.length) {
            registrationGaps.push('incomplete_writer_information');
          }
          
          songMetadata.push({
            search_id: searchId,
            user_id: user.id,
            song_title: songTitle,
            songwriter_name: songwriterName,
            co_writers: bmiData?.writers?.map(w => w.name) || song.CoWriters || song.co_writers || [],
            publishers: mergedPublishers,
            pro_registrations: proRegistrations,
            iswc: bmiData?.iswc || song.ISWC || song.iswc,
            estimated_splits: bmiData?.writers?.reduce((acc, writer) => {
              acc[writer.name] = writer.share || 0;
              return acc;
            }, {}) || {},
            registration_gaps: registrationGaps,
            metadata_completeness_score: completenessScore,
            verification_status: verificationStatus,
            source_data: { 
              ai_session: session.id, 
              confidence: parsedResponse.ConfidenceAssessment?.DataReliabilityScore || parsedResponse.confidence_score || 7,
              ai_response: song,
              bmi_data: bmiData,
              bmi_verified: !!bmiData?.found
            }
          });
        }

        const { error: metadataError } = await supabase
          .from('song_metadata_cache')
          .insert(songMetadata);

        if (metadataError) {
          console.error('Error inserting song metadata:', metadataError);
        } else {
          console.log(`Successfully inserted ${songMetadata.length} song metadata records (${bmiVerifiedCount} BMI-verified)`);
        }
      }

      // Calculate pipeline estimate
      console.log('Calculating pipeline estimate...');
      const pipelineEstimate = parsedResponse.RoyaltyPipelineAssessment?.UncollectedRoyaltyEstimates || 
                              parsedResponse.royalty_pipeline?.total_estimate || 
                              0;
      
      console.log('Pipeline estimate raw value:', pipelineEstimate);
      console.log('Pipeline estimate type:', typeof pipelineEstimate);

      // Parse pipeline estimate if it's a string like "$500,000 - $1 million"
      let estimateValue = 0;
      if (typeof pipelineEstimate === 'string') {
        // Extract numbers from strings like "$500,000 - $1 million"
        const matches = pipelineEstimate.match(/\$?([0-9,]+)/g);
        if (matches && matches.length > 0) {
          // Take the first number found
          const numStr = matches[0].replace(/[$,]/g, '');
          estimateValue = parseInt(numStr) || 0;
          console.log('Parsed estimate value from string:', estimateValue);
        }
      } else if (typeof pipelineEstimate === 'number') {
        estimateValue = pipelineEstimate;
        console.log('Using numeric estimate value:', estimateValue);
      }
      
      console.log('Final estimate value:', estimateValue);

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