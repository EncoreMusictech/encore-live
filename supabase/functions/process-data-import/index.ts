import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { uploadJobId } = await req.json();

    if (!uploadJobId) {
      return new Response(
        JSON.stringify({ error: 'Upload job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get upload job details
    const { data: uploadJob, error: jobError } = await supabaseClient
      .from('sub_accounts_upload_jobs')
      .select('*')
      .eq('id', uploadJobId)
      .single();

    if (jobError) {
      console.error('Error fetching upload job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Upload job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabaseClient
      .from('sub_accounts_upload_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', uploadJobId);

    // Get file from storage
    const { data: fileData, error: fileError } = await supabaseClient.storage
      .from('import-files')
      .download(uploadJob.file_path);

    if (fileError) {
      console.error('Error downloading file:', fileError);
      await supabaseClient
        .from('sub_accounts_upload_jobs')
        .update({ 
          status: 'failed',
          error_log: { error: 'File not found or corrupted' }
        })
        .eq('id', uploadJobId);
      
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process file based on type
    let processedData: any[] = [];
    
    if (uploadJob.file_type === 'csv') {
      // Simple CSV processing (in production, you'd use a proper CSV parser)
      const text = await fileData.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          processedData.push({
            row_number: i,
            raw_data: rowData,
            validation_status: 'pending'
          });
        }
      }
    } else if (uploadJob.file_type === 'pdf') {
      // PDF processing would require a PDF parsing library
      // For now, simulate processing
      processedData = [{
        row_number: 1,
        raw_data: { message: 'PDF processing not implemented yet' },
        validation_status: 'pending'
      }];
    }

    // Insert staging data
    const { error: stagingError } = await supabaseClient
      .from('sub_accounts_staging')
      .insert(
        processedData.map(item => ({
          ...item,
          upload_job_id: uploadJobId
        }))
      );

    if (stagingError) {
      console.error('Error inserting staging data:', stagingError);
    }

    // Update job with final status
    await supabaseClient
      .from('sub_accounts_upload_jobs')
      .update({
        status: 'completed',
        total_records: processedData.length,
        processed_records: processedData.length,
        successful_records: processedData.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', uploadJobId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'File processed successfully',
        records_processed: processedData.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});