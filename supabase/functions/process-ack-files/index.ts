import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AckFile {
  filename: string;
  content: string;
  size: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // In a real implementation, this would poll FTP endpoints for ACK files
    // For demo purposes, we'll process a simulated ACK file
    const mockAckFiles: AckFile[] = [
      {
        filename: 'ACK_CWR_20241223_001.txt',
        content: `HDR01MOCKPRO    20241223001
ACK01CW24000000120241223WORKID001  00Successfully registered
ACK01CW24000000220241223WORKID002  01Missing publisher information
TRL01000000002`,
        size: 150
      }
    ];

    const processedResults = [];

    for (const ackFile of mockAckFiles) {
      try {
        // Create ACK processing log
        const { data: ackLog, error: logError } = await supabaseClient
          .from('ack_processing_logs')
          .insert({
            user_id: user.id,
            ack_file_name: ackFile.filename,
            ack_file_content: ackFile.content,
            processing_status: 'pending'
          })
          .select()
          .single();

        if (logError) {
          console.error('Error creating ACK log:', logError);
          continue;
        }

        // Parse ACK file content
        const parseResult = parseAckFile(ackFile.content);
        
        let worksUpdated = 0;
        let errorsFound = 0;
        const processingErrors = [];

        // Process each ACK record
        for (const ackRecord of parseResult.records) {
          try {
            // Find and update corresponding copyright
            const { error: updateError } = await supabaseClient
              .from('copyrights')
              .update({
                registration_status: ackRecord.errorCode === '00' ? 'registered' : 'rejected',
                registration_notes: ackRecord.description
              })
              .eq('work_id', ackRecord.workId)
              .eq('user_id', user.id);

            if (updateError) {
              processingErrors.push({
                workId: ackRecord.workId,
                error: updateError.message
              });
              errorsFound++;
            } else {
              worksUpdated++;

              // Create registration status history entry
              await supabaseClient
                .from('registration_status_history')
                .insert({
                  user_id: user.id,
                  copyright_id: null, // Would need to look up by work_id
                  old_status: 'submitted',
                  new_status: ackRecord.errorCode === '00' ? 'registered' : 'rejected',
                  change_reason: `ACK file processing: ${ackRecord.description}`,
                  changed_by_user_id: user.id
                });

              // If there's an error, create notification
              if (ackRecord.errorCode !== '00') {
                await supabaseClient
                  .from('notifications')
                  .insert({
                    user_id: user.id,
                    title: 'CWR Registration Error',
                    message: `Work ${ackRecord.workId} registration failed: ${ackRecord.description}`,
                    type: 'error',
                    priority: 'high'
                  });
              }
            }
          } catch (recordError) {
            console.error(`Error processing ACK record ${ackRecord.workId}:`, recordError);
            processingErrors.push({
              workId: ackRecord.workId,
              error: (recordError as Error).message
            });
            errorsFound++;
          }
        }

        // Update ACK processing log
        await supabaseClient
          .from('ack_processing_logs')
          .update({
            parsed_data: parseResult,
            processing_status: processingErrors.length === 0 ? 'processed' : 'failed',
            works_updated: worksUpdated,
            errors_found: errorsFound,
            processing_errors: processingErrors,
            processed_at: new Date().toISOString()
          })
          .eq('id', ackLog.id);

        processedResults.push({
          filename: ackFile.filename,
          worksUpdated,
          errorsFound,
          success: processingErrors.length === 0
        });

      } catch (fileError) {
        console.error(`Error processing ACK file ${ackFile.filename}:`, fileError);
        processedResults.push({
          filename: ackFile.filename,
          worksUpdated: 0,
          errorsFound: 1,
          success: false,
          error: (fileError as Error).message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processedFiles: processedResults.length,
      totalWorksUpdated: processedResults.reduce((sum, r) => sum + r.worksUpdated, 0),
      totalErrors: processedResults.reduce((sum, r) => sum + r.errorsFound, 0),
      results: processedResults
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in process-ack-files:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Parse ACK file content
function parseAckFile(content: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const records = [];
  
  for (const line of lines) {
    if (line.startsWith('ACK01')) {
      // Parse ACK record: ACK01 + Transaction ID + Date + Work ID + Error Code + Description
      const workId = line.substring(25, 35).trim();
      const errorCode = line.substring(37, 39);
      const description = line.substring(39).trim();
      
      records.push({
        workId,
        errorCode,
        description,
        status: errorCode === '00' ? 'success' : 'error'
      });
    }
  }
  
  return {
    totalRecords: records.length,
    records,
    parsedAt: new Date().toISOString()
  };
}