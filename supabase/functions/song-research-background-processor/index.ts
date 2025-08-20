import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface ResearchJob {
  id: string;
  user_id: string;
  search_id: string;
  job_type: 'bulk_mlc_lookup' | 'bulk_bmi_verification' | 'comprehensive_research';
  job_data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  results?: any;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// Create research job queue table if it doesn't exist
async function ensureJobQueueTable() {
  try {
    await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS research_job_queue (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL,
          search_id uuid NOT NULL,
          job_type text NOT NULL,
          job_data jsonb NOT NULL DEFAULT '{}',
          status text NOT NULL DEFAULT 'pending',
          progress_percentage integer NOT NULL DEFAULT 0,
          results jsonb,
          error_message text,
          created_at timestamp with time zone NOT NULL DEFAULT now(),
          started_at timestamp with time zone,
          completed_at timestamp with time zone,
          estimated_completion_time interval,
          priority integer NOT NULL DEFAULT 5
        );
        
        CREATE INDEX IF NOT EXISTS idx_research_jobs_status ON research_job_queue(status);
        CREATE INDEX IF NOT EXISTS idx_research_jobs_user ON research_job_queue(user_id);
        CREATE INDEX IF NOT EXISTS idx_research_jobs_search ON research_job_queue(search_id);
      `
    });
  } catch (error) {
    console.log('Job queue table setup note:', error.message);
  }
}

async function processMLCBulkLookup(job: ResearchJob) {
  const { songs, batchSize = 5 } = job.job_data;
  const results = [];
  let processed = 0;
  
  console.log(`Starting bulk MLC lookup for ${songs.length} songs`);

  // Update job status to processing
  await supabase
    .from('research_job_queue')
    .update({ 
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', job.id);

  try {
    // Process in batches
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      
      // Prepare MLC lookup parameters for batch
      const mlcSearches = batch.map((song: any) => ({
        workTitle: song.song_title || song.songTitle,
        writerName: song.songwriter_name || song.writerName,
        isrc: song.isrc,
        iswc: song.iswc
      }));

      // Call enhanced MLC lookup
      const { data: mlcResults, error } = await supabase.functions.invoke('enhanced-mlc-lookup', {
        body: {
          bulk: true,
          searches: mlcSearches,
          enhanced: true,
          includeRecordings: true
        }
      });

      if (error) {
        console.error('MLC lookup batch error:', error);
        // Continue with other batches instead of failing entirely
        results.push(...batch.map((song: any) => ({
          songId: song.id,
          songTitle: song.song_title || song.songTitle,
          success: false,
          error: error.message
        })));
      } else {
        // Process results and update database
        for (let j = 0; j < batch.length; j++) {
          const song = batch[j];
          const mlcResult = mlcResults.results?.[j];
          
          if (mlcResult?.found) {
            // Update song metadata with MLC data
            const updateData = {
              mlc_verification_status: 'verified',
              mlc_confidence_score: mlcResult.confidence,
              mlc_writers: mlcResult.writers,
              mlc_publishers: mlcResult.publishers,
              mlc_metadata: mlcResult.metadata,
              mlc_work_id: mlcResult.metadata?.mlcWorkId,
              data_quality_score: Math.max(
                song.metadata_completeness_score || 0,
                mlcResult.confidence || 0
              ),
              last_mlc_lookup_at: new Date().toISOString()
            };

            await supabase
              .from('song_metadata_cache')
              .update(updateData)
              .eq('id', song.id);

            results.push({
              songId: song.id,
              songTitle: song.song_title || song.songTitle,
              success: true,
              mlcData: mlcResult
            });
          } else {
            results.push({
              songId: song.id,
              songTitle: song.song_title || song.songTitle,
              success: false,
              error: 'No MLC data found'
            });
          }
        }
      }

      processed += batch.length;
      const progressPercentage = Math.round((processed / songs.length) * 100);
      
      // Update progress
      await supabase
        .from('research_job_queue')
        .update({ progress_percentage: progressPercentage })
        .eq('id', job.id);

      // Add delay between batches to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Mark job as completed
    await supabase
      .from('research_job_queue')
      .update({
        status: 'completed',
        progress_percentage: 100,
        results: {
          totalProcessed: processed,
          successCount: results.filter(r => r.success).length,
          results: results
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`Bulk MLC lookup completed: ${results.filter(r => r.success).length}/${processed} successful`);
    
    return {
      success: true,
      totalProcessed: processed,
      successCount: results.filter(r => r.success).length,
      results: results
    };

  } catch (error) {
    console.error('Bulk MLC processing error:', error);
    
    // Mark job as failed
    await supabase
      .from('research_job_queue')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    throw error;
  }
}

async function processBMIBulkVerification(job: ResearchJob) {
  const { songs, batchSize = 3 } = job.job_data;
  const results = [];
  let processed = 0;
  
  console.log(`Starting bulk BMI verification for ${songs.length} songs`);

  // Update job status to processing
  await supabase
    .from('research_job_queue')
    .update({ 
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', job.id);

  try {
    // Process in smaller batches for BMI (more rate limited)
    for (let i = 0; i < songs.length; i += batchSize) {
      const batch = songs.slice(i, i + batchSize);
      
      // Process BMI lookups for batch
      const bmiPromises = batch.map(async (song: any) => {
        try {
          const { data: bmiResult, error } = await supabase.functions.invoke('enhanced-bmi-agent', {
            body: {
              workTitle: song.song_title || song.songTitle,
              writerName: song.songwriter_name || song.writerName
            }
          });

          if (error) throw error;

          if (bmiResult?.found) {
            // Update song metadata with BMI data
            const updateData = {
              verification_status: song.mlc_verification_status === 'verified' ? 'bmi_mlc_verified' : 'bmi_verified',
              metadata_completeness_score: 0.95,
              pro_registrations: {
                ...song.pro_registrations,
                bmi: {
                  verified: true,
                  publishers: bmiResult.publishers || [],
                  writers: bmiResult.writers || [],
                  iswc: bmiResult.iswc,
                  lookup_date: new Date().toISOString()
                }
              },
              last_verified_at: new Date().toISOString()
            };

            await supabase
              .from('song_metadata_cache')
              .update(updateData)
              .eq('id', song.id);

            return {
              songId: song.id,
              songTitle: song.song_title || song.songTitle,
              success: true,
              bmiData: bmiResult
            };
          } else {
            return {
              songId: song.id,
              songTitle: song.song_title || song.songTitle,
              success: false,
              error: 'No BMI data found'
            };
          }
        } catch (error) {
          return {
            songId: song.id,
            songTitle: song.song_title || song.songTitle,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(bmiPromises);
      results.push(...batchResults);

      processed += batch.length;
      const progressPercentage = Math.round((processed / songs.length) * 100);
      
      // Update progress
      await supabase
        .from('research_job_queue')
        .update({ progress_percentage: progressPercentage })
        .eq('id', job.id);

      // Add delay between BMI batches (longer due to stricter rate limits)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Mark job as completed
    await supabase
      .from('research_job_queue')
      .update({
        status: 'completed',
        progress_percentage: 100,
        results: {
          totalProcessed: processed,
          successCount: results.filter(r => r.success).length,
          results: results
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`Bulk BMI verification completed: ${results.filter(r => r.success).length}/${processed} successful`);
    
    return {
      success: true,
      totalProcessed: processed,
      successCount: results.filter(r => r.success).length,
      results: results
    };

  } catch (error) {
    console.error('Bulk BMI processing error:', error);
    
    // Mark job as failed
    await supabase
      .from('research_job_queue')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    throw error;
  }
}

async function getNextPendingJob(): Promise<ResearchJob | null> {
  const { data, error } = await supabase
    .from('research_job_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as ResearchJob;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await ensureJobQueueTable();
    
    const body = await req.json();

    // Handle job creation
    if (body.action === 'create_job') {
      const { user_id, search_id, job_type, job_data, priority = 5 } = body;
      
      const { data, error } = await supabase
        .from('research_job_queue')
        .insert({
          user_id,
          search_id,
          job_type,
          job_data,
          priority
        })
        .select()
        .single();

      if (error) throw error;

      return json({
        success: true,
        job_id: data.id,
        message: 'Background job created successfully'
      });
    }

    // Handle job status check
    if (body.action === 'check_status') {
      const { job_id } = body;
      
      const { data, error } = await supabase
        .from('research_job_queue')
        .select('*')
        .eq('id', job_id)
        .single();

      if (error) throw error;

      return json({
        success: true,
        job: data
      });
    }

    // Handle job processing (called by cron or worker)
    if (body.action === 'process_jobs') {
      const job = await getNextPendingJob();
      
      if (!job) {
        return json({
          success: true,
          message: 'No pending jobs to process'
        });
      }

      console.log('Processing job:', job.id, 'type:', job.job_type);

      let result;
      switch (job.job_type) {
        case 'bulk_mlc_lookup':
          result = await processMLCBulkLookup(job);
          break;
        case 'bulk_bmi_verification':
          result = await processBMIBulkVerification(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      return json({
        success: true,
        job_id: job.id,
        result
      });
    }

    return json({ error: 'Invalid action' }, 400);

  } catch (error) {
    console.error('Background processor error:', error);
    return json({ 
      error: error.message || 'Background processing failed'
    }, 500);
  }
});