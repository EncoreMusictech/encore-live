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

    console.log(`Starting MLC-exclusive research for songwriter: ${songwriterName}, session type: ${sessionType}`);

    // Create research session record
    const { data: session, error: sessionError } = await supabase
      .from('ai_research_sessions')
      .insert({
        search_id: searchId,
        user_id: user.id,
        session_type: sessionType,
        research_query: `MLC-exclusive catalog discovery: ${songwriterName}`,
        session_status: 'processing'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create research session: ${sessionError.message}`);
    }

    const startTime = Date.now();

// MLC-only catalog discovery approach
    if (sessionType === 'initial_search') {
      console.log('Starting MLC-only catalog discovery for:', songwriterName);
      
      // Step 1: Search MLC database exclusively for comprehensive catalog
      let mlcCatalogData = null;
      let knownSongs = [];
      
      try {
        console.log('Searching MLC database for songwriter catalog...');
        const { data: mlcSearchData, error: mlcError } = await supabase.functions.invoke('mlc-repertoire-lookup', {
          body: {
            writerName: songwriterName,
            workTitle: undefined // Search by writer name only for full catalog
          }
        });

        if (!mlcError && mlcSearchData?.found) {
          mlcCatalogData = mlcSearchData;
          console.log(`MLC catalog search found works for ${songwriterName}`);
          
          // Extract songs from MLC data as exclusive source
          if (mlcSearchData?.writers && Array.isArray(mlcSearchData.writers)) {
            knownSongs = [{
              title: mlcSearchData.metadata?.workTitle || 'Unknown Title',
              co_writers: mlcSearchData.writers.map(w => w.name).filter(name => name !== songwriterName) || [],
              publishers: mlcSearchData.publishers?.reduce((acc, pub) => ({ ...acc, [pub.name]: pub.share || 0 }), {}) || {},
              iswc: mlcSearchData.metadata?.iswc || null,
              mlc_work_id: mlcSearchData.metadata?.mlcWorkId || null,
              mlc_song_code: mlcSearchData.metadata?.mlcSongCode || null,
              source: 'mlc_exclusive',
              confidence: mlcSearchData.confidence || 0.8
            }];
            console.log(`Extracted ${knownSongs.length} songs from MLC data`);
          }
        } else {
          console.log('MLC catalog search failed or found no results:', mlcError || 'No data found');
        }
      } catch (mlcError) {
        console.error('MLC catalog search failed:', mlcError);
      }

      const totalSongs = knownSongs.length;
      console.log(`MLC-only catalog discovery found ${totalSongs} songs total`);

      // Step 2: Process MLC data exclusively (no cross-verification)
      if (knownSongs.length > 0) {
        console.log('Processing MLC-only data for songwriter catalog...');
        
        const songMetadata = [];
        let mlcVerifiedCount = 0;
      
        for (const song of knownSongs) {
          const songTitle = song.title;
          console.log(`Processing MLC song: ${songTitle}`);
          
          // MLC data (exclusive source)
          const mlcData = {
            found: true,
            confidence: song.confidence || 0.8,
            work_title: song.title,
            iswc: song.iswc,
            mlc_work_id: song.mlc_work_id,
            mlc_song_code: song.mlc_song_code,
            writers: [songwriterName, ...song.co_writers].map(name => ({ name })),
            publishers: Object.keys(song.publishers || {}).map(name => ({ name, share: song.publishers[name] }))
          };
          mlcVerifiedCount++;

          // Detect data completeness (MLC-only analysis)
          const detectedGaps = [];
          if (!mlcData.iswc) {
            detectedGaps.push('missing_iswc');
          }
          if (!mlcData.publishers || mlcData.publishers.length === 0) {
            detectedGaps.push('missing_publisher_info');
          }
          if (!mlcData.mlc_work_id) {
            detectedGaps.push('missing_mlc_work_id');
          }

          // Calculate MLC completeness score (0-1 scale)
          let completenessScore = 0.5; // Base score for MLC presence
          if (mlcData.iswc) completenessScore += 0.2;
          if (mlcData.publishers && mlcData.publishers.length > 0) completenessScore += 0.2;
          if (mlcData.mlc_work_id) completenessScore += 0.1;
          
          songMetadata.push({
            search_id: searchId,
            user_id: user.id,
            song_title: songTitle,
            songwriter_name: songwriterName,
            co_writers: song.co_writers || [],
            publishers: song.publishers || {},
            pro_registrations: {
              MLC: mlcData
            },
            iswc: song.iswc || null,
            estimated_splits: {},
            registration_gaps: detectedGaps,
            metadata_completeness_score: completenessScore,
            verification_status: 'mlc_exclusive',
            search_key: `${songTitle}|${songwriterName}|mlc_only`,
            last_verified_at: new Date().toISOString(),
            mlc_work_id: song.mlc_work_id,
            mlc_verification_status: 'verified',
            mlc_confidence_score: song.confidence || 0.8,
            mlc_writers: mlcData.writers,
            mlc_publishers: mlcData.publishers,
            mlc_metadata: {
              workTitle: song.title,
              iswc: song.iswc,
              mlcWorkId: song.mlc_work_id,
              mlcSongCode: song.mlc_song_code
            },
            source_data: {
              primary_source: 'mlc_exclusive',
              catalog_discovery_method: 'mlc_only',
              mlc_lookup: mlcData,
              data_completeness_analysis: detectedGaps,
              completeness_score: completenessScore,
              source: 'MLC Public API'
            }
          });
        }

        console.log(`Processed ${songMetadata.length} songs with MLC-only approach`);
        console.log(`MLC verified: ${mlcVerifiedCount}`);

        // Batch insert song metadata from MLC-only search
        if (songMetadata.length > 0) {
          const { data: insertedSongs, error: insertError } = await supabase
            .from('song_metadata_cache')
            .insert(songMetadata)
            .select();

          if (insertError) {
            console.error('Failed to insert song metadata:', insertError);
          } else {
            console.log(`Successfully inserted ${insertedSongs?.length || 0} song records from MLC`);
          }
        }

        // Update catalog search with MLC-only results
        const { error: catalogUpdateError } = await supabase
          .from('song_catalog_searches')
          .update({
            total_songs_found: totalSongs,
            metadata_complete_count: songMetadata.filter(s => s.metadata_completeness_score >= 0.8).length,
            search_status: 'completed',
            last_refreshed_at: new Date().toISOString(),
            ai_research_summary: {
              approach: 'mlc_exclusive_catalog_discovery',
              catalog_discovery_source: 'mlc_database_only',
              processing_summary: {
                total_processed: totalSongs,
                mlc_exclusive_sources: knownSongs.length,
                mlc_verified: mlcVerifiedCount,
                processing_time_seconds: Math.round((Date.now() - startTime) / 1000)
              },
              data_completeness_analysis: {
                songs_with_iswc: songMetadata.filter(s => s.iswc).length,
                songs_with_publishers: songMetadata.filter(s => Object.keys(s.publishers).length > 0).length,
                average_completeness_score: songMetadata.reduce((sum, s) => sum + s.metadata_completeness_score, 0) / songMetadata.length,
                recommendations: [
                  'MLC data used as exclusive source for mechanical royalty information',
                  'Consider registering with additional PROs for performance royalty collection',
                  'Verify publisher information is up to date in MLC database',
                  'Ensure ISWC codes are properly registered for international collection'
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
              approach: 'mlc_exclusive_catalog_discovery',
              result: 'no_catalog_found_in_mlc',
              message: 'No works found for this songwriter in MLC database'
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
        ai_response: { approach: 'mlc_exclusive_discovery', completed: true },
        findings_summary: `MLC-exclusive catalog discovery completed for ${songwriterName}`,
        confidence_assessment: 8, // High confidence for MLC-exclusive data
        processing_time_ms: processingTime,
        session_status: 'completed',
        sources_checked: ['MLC Database Only']
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update research session:', updateError);
    }

    console.log(`MLC-exclusive research completed. Time: ${processingTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      approach: 'mlc_exclusive_catalog_discovery',
      processingTime,
      summary: `MLC-exclusive catalog discovery completed for ${songwriterName}`
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