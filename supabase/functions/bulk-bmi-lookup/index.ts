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

interface BulkBMIRequest {
  songs: Array<{
    id: string;
    songTitle: string;
    writerName: string;
    publisherName?: string;
  }>;
  batchSize?: number;
  delayMs?: number;
}

interface BMIEnhancedMetadata {
  bmi_verified: boolean;
  verification_confidence: number;
  pro_registrations: any;
  enhanced_publishers: any[];
  enhanced_writers: any[];
  registration_gaps: string[];
  metadata_completeness_score: number;
  bmi_raw_data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { songs, batchSize = 5, delayMs = 1000 }: BulkBMIRequest = await req.json();

    if (!songs || songs.length === 0) {
      throw new Error('No songs provided for lookup');
    }

    console.log(`Starting bulk BMI lookup for ${songs.length} songs`);

    const results = [];
    const batchedSongs = [];
    
    // Process songs in batches to avoid rate limiting
    for (let i = 0; i < songs.length; i += batchSize) {
      batchedSongs.push(songs.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batchedSongs.length; batchIndex++) {
      const batch = batchedSongs[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batchedSongs.length} with ${batch.length} songs`);

      const batchResults = await Promise.allSettled(
        batch.map(async (song) => {
          try {
            console.log(`Looking up BMI data for: ${song.songTitle} by ${song.writerName}`);

            // Call BMI lookup function
            const { data: bmiResponse, error: bmiError } = await supabase.functions.invoke('bmi-lookup', {
              body: { 
                workTitle: song.songTitle, 
                writerName: song.writerName,
                publisherName: song.publisherName
              }
            });

            if (bmiError) {
              console.error(`BMI lookup error for ${song.songTitle}:`, bmiError);
              return {
                songId: song.id,
                success: false,
                error: bmiError.message,
                enhanced_metadata: null
              };
            }

            // Process BMI response and create enhanced metadata
            const enhanced = processBMIResponse(song, bmiResponse);

            // Update song metadata cache with enhanced data
            const { error: updateError } = await supabase
              .from('song_metadata_cache')
              .update({
                verification_status: enhanced.bmi_verified ? 'bmi_verified' : 'bmi_checked',
                pro_registrations: enhanced.pro_registrations,
                publishers: enhanced.enhanced_publishers,
                co_writers: enhanced.enhanced_writers.map(w => w.name),
                estimated_splits: enhanced.enhanced_writers.reduce((acc, writer) => {
                  acc[writer.name] = writer.share || 0;
                  return acc;
                }, {}),
                registration_gaps: enhanced.registration_gaps,
                metadata_completeness_score: enhanced.metadata_completeness_score,
                source_data: {
                  ...((await supabase.from('song_metadata_cache').select('source_data').eq('id', song.id).single()).data?.source_data || {}),
                  bmi_data: enhanced.bmi_raw_data,
                  bmi_verified: enhanced.bmi_verified,
                  bmi_lookup_timestamp: new Date().toISOString()
                }
              })
              .eq('id', song.id);

            if (updateError) {
              console.error(`Failed to update metadata for ${song.songTitle}:`, updateError);
            }

            return {
              songId: song.id,
              success: true,
              enhanced_metadata: enhanced,
              bmi_found: bmiResponse?.found || false
            };

          } catch (error) {
            console.error(`Error processing ${song.songTitle}:`, error);
            return {
              songId: song.id,
              success: false,
              error: error.message,
              enhanced_metadata: null
            };
          }
        })
      );

      // Collect results from this batch
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            songId: 'unknown',
            success: false,
            error: result.reason?.message || 'Unknown error',
            enhanced_metadata: null
          });
        }
      }

      // Delay between batches to avoid overwhelming the BMI lookup
      if (batchIndex < batchedSongs.length - 1) {
        console.log(`Waiting ${delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const bmiFoundCount = results.filter(r => r.bmi_found).length;

    console.log(`Bulk BMI lookup completed: ${successCount}/${songs.length} successful, ${bmiFoundCount} BMI matches found`);

    return new Response(JSON.stringify({
      success: true,
      total_processed: songs.length,
      successful_lookups: successCount,
      bmi_matches_found: bmiFoundCount,
      results: results,
      summary: {
        total_songs: songs.length,
        bmi_verified: bmiFoundCount,
        verification_rate: Math.round((bmiFoundCount / songs.length) * 100)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-bmi-lookup function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processBMIResponse(song: any, bmiResponse: any): BMIEnhancedMetadata {
  const bmiFound = bmiResponse?.found || false;
  let completenessScore = 0.6; // Base score
  const registrationGaps = [];
  
  // Enhanced publishers from BMI data
  const enhancedPublishers = [];
  if (bmiResponse?.publishers?.length > 0) {
    enhancedPublishers.push(...bmiResponse.publishers);
    completenessScore += 0.2;
  } else {
    registrationGaps.push('no_publisher_information');
  }
  
  // Enhanced writers from BMI data
  const enhancedWriters = [];
  if (bmiResponse?.writers?.length > 0) {
    enhancedWriters.push(...bmiResponse.writers);
    completenessScore += 0.2;
  } else {
    registrationGaps.push('incomplete_writer_information');
    enhancedWriters.push({ name: song.writerName, share: 100 });
  }
  
  // Check for ISWC
  if (!bmiResponse?.iswc) {
    registrationGaps.push('missing_iswc');
  } else {
    completenessScore += 0.1;
  }
  
  // PRO registrations
  const proRegistrations: any = {};
  if (bmiFound) {
    proRegistrations.bmi = {
      verified: true,
      publishers: bmiResponse.publishers || [],
      writers: bmiResponse.writers || [],
      iswc: bmiResponse.iswc,
      lookup_date: new Date().toISOString()
    };
    completenessScore += 0.1;
  }
  
  // Calculate verification confidence
  const verificationConfidence = bmiFound ? 
    Math.min(0.95, 0.7 + (enhancedWriters.length * 0.1) + (enhancedPublishers.length * 0.05)) : 
    0.3;
  
  return {
    bmi_verified: bmiFound,
    verification_confidence: verificationConfidence,
    pro_registrations: proRegistrations,
    enhanced_publishers: enhancedPublishers,
    enhanced_writers: enhancedWriters,
    registration_gaps: registrationGaps,
    metadata_completeness_score: Math.min(1.0, completenessScore),
    bmi_raw_data: bmiResponse
  };
}