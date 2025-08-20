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

// Helper function to calculate registration gap score
function calculateRegistrationGapScore(mlcData: any, bmiData: any, songData: any): number {
  let score = 0;
  let maxScore = 0;

  // MLC Registration (40 points)
  maxScore += 40;
  if (mlcData?.found) {
    score += 20;
    if (mlcData.confidence > 0.8) score += 10;
    if (mlcData.iswc) score += 5;
    if (mlcData.publishers?.length > 0) score += 5;
  }

  // BMI Cross-verification (30 points)
  maxScore += 30;
  if (bmiData?.found) {
    score += 15;
    if (bmiData.writers?.length > 0) score += 8;
    if (bmiData.publishers?.length > 0) score += 7;
  }

  // Metadata completeness (30 points)
  maxScore += 30;
  if (songData.iswc) score += 15;
  if (songData.co_writers?.length > 0) score += 8;
  if (songData.publishers) score += 7;

  return Math.round((score / maxScore) * 100) / 100;
}

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

    const allowedEmail = 'info@encoremusic.tech';
    if ((user.email || '').toLowerCase() !== allowedEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Song Estimator is restricted' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    console.log(`Starting MLC-first research for songwriter: ${songwriterName}, session type: ${sessionType}`);

    // Create research session record
    const { data: session, error: sessionError } = await supabase
      .from('ai_research_sessions')
      .insert({
        search_id: searchId,
        user_id: user.id,
        session_type: sessionType,
        research_query: `MLC-first catalog discovery: ${songwriterName}`,
        session_status: 'processing'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create research session: ${sessionError.message}`);
    }

    const startTime = Date.now();

    // MLC-first catalog discovery approach
    if (sessionType === 'initial_search') {
      console.log('Starting MLC-first catalog discovery for:', songwriterName);
      
      // Step 1: Search MLC database first for comprehensive catalog
      let mlcCatalogData = null;
      let knownSongs = [];
      
      try {
        console.log('Searching MLC database for songwriter catalog...');
        const { data: mlcSearchData, error: mlcError } = await supabase.functions.invoke('enhanced-mlc-lookup', {
          body: {
            writerName: songwriterName,
            searchType: 'catalog_discovery',
            enhanced: true,
            includeRecordings: true
          }
        });

        if (!mlcError && mlcSearchData?.found) {
          mlcCatalogData = mlcSearchData;
          console.log(`MLC catalog search found ${mlcSearchData.works?.length || 0} works`);
          
          // Extract songs from MLC data as primary source
          if (mlcSearchData?.works && Array.isArray(mlcSearchData.works)) {
            knownSongs = mlcSearchData.works.map(work => ({
              title: work.primaryTitle || work.metadata?.workTitle || work.title,
              co_writers: work.writers?.map(w => w.name || `${w.writerFirstName} ${w.writerLastName}`.trim()) || [],
              publisher: work.publishers?.[0]?.name || work.publishers?.[0]?.publisherName || null,
              iswc: work.iswc || work.metadata?.iswc || null,
              mlc_work_id: work.metadata?.mlcWorkId || null,
              mlc_song_code: work.metadata?.mlcSongCode || null,
              source: 'mlc_primary'
            }));
            console.log(`Extracted ${knownSongs.length} songs from MLC data`);
          }
        } else {
          console.log('MLC catalog search failed or found no results:', mlcError || 'No data found');
        }
      } catch (mlcError) {
        console.error('MLC catalog search failed:', mlcError);
      }

      // If MLC didn't provide enough results, we should have gotten the full catalog
      // The MLC-first approach should be comprehensive, so fallback should be minimal
      if (knownSongs.length === 0) {
        console.log('No MLC results found, this may indicate an API issue or no registered works');
      }

      const totalSongs = knownSongs.length;
      console.log(`MLC catalog discovery found ${totalSongs} songs total`);

      // Step 2: Cross-verify with other PROs to identify registration gaps
      if (knownSongs.length > 0) {
        console.log('Starting PRO cross-verification to identify registration gaps...');
        
        const songMetadata = [];
        let bmiVerifiedCount = 0;
        let mlcVerifiedCount = 0;
        let registrationGaps = [];
      
        for (const song of knownSongs) {
          const songTitle = song.title;
          console.log(`Cross-verifying song: ${songTitle}`);
          
          // MLC data (already available from catalog search)
          const mlcData = {
            found: true,
            confidence: song.source === 'mlc_primary' ? 0.95 : 0.8,
            work_title: song.title,
            iswc: song.iswc,
            mlc_work_id: song.mlc_work_id,
            writers: song.co_writers.map(name => ({ name })),
            publishers: song.publisher ? [{ name: song.publisher }] : []
          };
          mlcVerifiedCount++;
          
          // Cross-verify with BMI to identify gaps
          let bmiData = null;
          try {
            console.log(`Cross-verifying with BMI: ${songTitle} by ${songwriterName}`);
            
            const { data: bmiResponse, error: bmiError } = await supabase.functions.invoke('enhanced-bmi-agent', {
              body: { 
                workTitle: songTitle, 
                writerName: songwriterName,
                artistName: song.co_writers?.[0]
              }
            });
          
            if (!bmiError && bmiResponse?.found) {
              bmiData = bmiResponse;
              bmiVerifiedCount++;
              console.log(`BMI cross-verification successful for: ${songTitle}`);
            } else {
              console.log(`No BMI registration found for: ${songTitle} - registration gap detected`);
              registrationGaps.push({ 
                song: songTitle, 
                gaps: ['missing_from_bmi'],
                impact: 'potential_uncollected_performance_royalties'
              });
            }
            
            // Small delay to avoid overwhelming BMI lookup
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (bmiError) {
            console.error(`BMI cross-verification failed for ${songTitle}:`, bmiError);
            registrationGaps.push({ 
              song: songTitle, 
              gaps: ['bmi_lookup_failed'],
              impact: 'verification_needed'
            });
          }

          // Detect specific registration discrepancies
          const detectedGaps = [];
          if (mlcData?.found && !bmiData?.found) {
            detectedGaps.push('missing_from_bmi');
          }
          if (!mlcData.iswc) {
            detectedGaps.push('missing_iswc');
          }
          if (!mlcData.publishers || mlcData.publishers.length === 0) {
            detectedGaps.push('missing_publisher_info');
          }
          if (bmiData?.found && mlcData?.found) {
            if (bmiData.writers?.length !== mlcData.writers?.length) {
              detectedGaps.push('writer_credit_mismatch');
            }
            if (bmiData.publishers?.length !== mlcData.publishers?.length) {
              detectedGaps.push('publisher_credit_mismatch');
            }
          }

          // Calculate registration completeness score
          const registrationScore = calculateRegistrationGapScore(mlcData, bmiData, song);
          
          // Determine verification status based on cross-verification
          let verificationStatus = 'mlc_verified';
          if (bmiData?.found) {
            verificationStatus = 'mlc_bmi_cross_verified';
          }

          songMetadata.push({
            search_id: searchId,
            user_id: user.id,
            song_title: songTitle,
            songwriter_name: songwriterName,
            co_writers: song.co_writers || [],
            publishers: song.publisher ? { [song.publisher]: 0 } : {},
            pro_registrations: {
              mlc: mlcData || { found: false },
              bmi: bmiData || { verified: false }
            },
            iswc: song.iswc || null,
            estimated_splits: {},
            registration_gaps: detectedGaps,
            metadata_completeness_score: registrationScore,
            verification_status: verificationStatus,
            search_key: `${songTitle}|${songwriterName}|mlc_first`,
            last_verified_at: new Date().toISOString(),
            source_data: {
              primary_source: 'mlc',
              catalog_discovery_method: 'mlc_first',
              mlc_lookup: mlcData,
              bmi_cross_verification: bmiData,
              registration_gap_analysis: detectedGaps,
              registration_completeness_score: registrationScore,
              discrepancies_detected: detectedGaps.length > 0
            }
          });
        }

        console.log(`Processed ${songMetadata.length} songs with MLC-first approach`);
        console.log(`MLC verified: ${mlcVerifiedCount}, BMI cross-verified: ${bmiVerifiedCount}`);
        console.log(`Registration gaps detected: ${registrationGaps.length}`);

        // Batch insert song metadata with gap analysis
        if (songMetadata.length > 0) {
          const { data: insertedSongs, error: insertError } = await supabase
            .from('song_metadata_cache')
            .insert(songMetadata)
            .select();

          if (insertError) {
            console.error('Failed to insert song metadata:', insertError);
          } else {
            console.log(`Successfully inserted ${insertedSongs?.length || 0} song records with gap analysis`);
          }
        }

        // Update catalog search with MLC-first results and gap analysis
        const { error: catalogUpdateError } = await supabase
          .from('song_catalog_searches')
          .update({
            total_songs_found: totalSongs,
            metadata_complete_count: songMetadata.filter(s => s.metadata_completeness_score >= 0.8).length,
            search_status: 'completed',
            last_refreshed_at: new Date().toISOString(),
            ai_research_summary: {
              approach: 'mlc_first_catalog_discovery',
              catalog_discovery_source: 'mlc_database',
              processing_summary: {
                total_processed: totalSongs,
                mlc_primary_sources: knownSongs.filter(s => s.source === 'mlc_primary').length,
                mlc_secondary_sources: knownSongs.filter(s => s.source === 'mlc_secondary').length,
                bmi_cross_verified: bmiVerifiedCount,
                mlc_verified: mlcVerifiedCount,
                registration_gaps_detected: registrationGaps.length,
                processing_time_seconds: Math.round((Date.now() - startTime) / 1000)
              },
              registration_gap_analysis: {
                gaps_by_song: registrationGaps,
                total_gaps: registrationGaps.reduce((sum, item) => sum + item.gaps.length, 0),
                most_common_gaps: registrationGaps.flatMap(item => item.gaps)
                  .reduce((acc, gap) => ({ ...acc, [gap]: (acc[gap] || 0) + 1 }), {}),
                recommendations: [
                  'Register missing works with BMI for performance royalty collection',
                  'Verify publisher credits match across MLC and BMI databases',
                  'Obtain ISWC codes for works missing international identifiers',
                  'Cross-check writer splits for accuracy across PRO databases'
                ]
              }
            }
          })
          .eq('id', searchId);

        if (catalogUpdateError) {
          console.error('Failed to update catalog search:', catalogUpdateError);
        }
      } else {
        console.log('No songs found in MLC database');
        // Update search with no results
        await supabase
          .from('song_catalog_searches')
          .update({
            search_status: 'completed',
            total_songs_found: 0,
            last_refreshed_at: new Date().toISOString(),
            ai_research_summary: {
              approach: 'mlc_first_catalog_discovery',
              result: 'no_catalog_found_in_mlc'
            }
          })
          .eq('id', searchId);
      }
    }

    // Update research session with completion
    const processingTime = Date.now() - startTime;
    const { error: updateError } = await supabase
      .from('ai_research_sessions')
      .update({
        ai_response: { approach: 'mlc_first_discovery', completed: true },
        findings_summary: `MLC-first catalog discovery completed for ${songwriterName}`,
        confidence_assessment: 9, // High confidence for MLC-based data
        processing_time_ms: processingTime,
        session_status: 'completed',
        sources_checked: ['MLC Database', 'BMI Cross-verification']
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update research session:', updateError);
    }

    console.log(`MLC-first research completed. Time: ${processingTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      approach: 'mlc_first_catalog_discovery',
      processingTime,
      summary: `MLC-first catalog discovery completed for ${songwriterName}`
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