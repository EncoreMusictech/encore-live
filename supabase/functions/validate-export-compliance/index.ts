import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  copyrightIds: string[];
  exportType: 'cwr' | 'ddex';
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

    const { copyrightIds, exportType }: ValidationRequest = await req.json();

    // Get copyrights with related data
    const { data: copyrights, error: copyrightsError } = await supabaseClient
      .from('copyrights')
      .select(`
        *,
        copyright_writers(*),
        copyright_publishers(*),
        copyright_recordings(*)
      `)
      .in('id', copyrightIds)
      .eq('user_id', user.id);

    if (copyrightsError) {
      console.error('Error fetching copyrights:', copyrightsError);
      return new Response('Error fetching copyrights', { status: 500, headers: corsHeaders });
    }

    // Get sender code information
    const { data: senderCodes, error: senderError } = await supabaseClient
      .from('cwr_sender_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved');

    const hasSenderCode = senderCodes && senderCodes.length > 0;

    // Validate each copyright
    const validationResults = [];
    const blockingIssues = [];
    const warningIssues = [];
    let totalScore = 0;

    for (const copyright of copyrights || []) {
      const issues = [];
      let copyrightScore = 100;

      // Critical validations (blocking)
      if (!copyright.song_title?.trim()) {
        issues.push({ type: 'blocking', field: 'song_title', message: 'Song title is required' });
        copyrightScore -= 25;
      }

      if (!copyright.copyright_writers || copyright.copyright_writers.length === 0) {
        issues.push({ type: 'blocking', field: 'writers', message: 'At least one writer is required' });
        copyrightScore -= 25;
      }

      if (!hasSenderCode) {
        issues.push({ type: 'blocking', field: 'sender_code', message: 'Approved sender code is required for export' });
        copyrightScore -= 30;
      }

      // Writer-specific validations
      if (copyright.copyright_writers) {
        const totalWriterShare = copyright.copyright_writers.reduce((sum: number, w: any) => sum + (w.ownership_percentage || 0), 0);
        if (totalWriterShare !== 100) {
          issues.push({ type: 'blocking', field: 'writer_shares', message: `Writer shares total ${totalWriterShare}% (must equal 100%)` });
          copyrightScore -= 20;
        }

        // Check for missing writer details
        for (const writer of copyright.copyright_writers) {
          if (!writer.writer_name?.trim()) {
            issues.push({ type: 'warning', field: 'writer_name', message: 'Writer name is missing' });
            copyrightScore -= 5;
          }
          if (!writer.ipi_cae_number?.trim()) {
            issues.push({ type: 'warning', field: 'writer_ipi', message: 'Writer IPI/CAE number is missing' });
            copyrightScore -= 5;
          }
        }
      }

      // Publisher-specific validations
      if (copyright.copyright_publishers && copyright.copyright_publishers.length > 0) {
        const totalPublisherShare = copyright.copyright_publishers.reduce((sum: number, p: any) => sum + (p.ownership_percentage || 0), 0);
        if (totalPublisherShare > 100) {
          issues.push({ type: 'blocking', field: 'publisher_shares', message: `Publisher shares total ${totalPublisherShare}% (cannot exceed 100%)` });
          copyrightScore -= 20;
        }
      }

      // DDEX-specific validations
      if (exportType === 'ddex') {
        if (!copyright.copyright_recordings || copyright.copyright_recordings.length === 0) {
          issues.push({ type: 'warning', field: 'recordings', message: 'DDEX export benefits from recording information' });
          copyrightScore -= 10;
        }
        
        if (copyright.copyright_recordings) {
          for (const recording of copyright.copyright_recordings) {
            if (!recording.isrc?.trim()) {
              issues.push({ type: 'warning', field: 'isrc', message: 'ISRC is recommended for DDEX export' });
              copyrightScore -= 5;
            }
          }
        }
      }

      // CWR-specific validations
      if (exportType === 'cwr') {
        if (!copyright.iswc?.trim()) {
          issues.push({ type: 'warning', field: 'iswc', message: 'ISWC is recommended for CWR export' });
          copyrightScore -= 5;
        }
      }

      // Collect issues by type
      const copyrightBlockingIssues = issues.filter(i => i.type === 'blocking');
      const copyrightWarningIssues = issues.filter(i => i.type === 'warning');

      blockingIssues.push(...copyrightBlockingIssues.map(i => ({ ...i, copyrightId: copyright.id, songTitle: copyright.song_title })));
      warningIssues.push(...copyrightWarningIssues.map(i => ({ ...i, copyrightId: copyright.id, songTitle: copyright.song_title })));

      validationResults.push({
        copyrightId: copyright.id,
        songTitle: copyright.song_title,
        score: Math.max(0, copyrightScore),
        canExport: copyrightBlockingIssues.length === 0,
        blockingIssues: copyrightBlockingIssues,
        warningIssues: copyrightWarningIssues,
        totalIssues: issues.length
      });

      totalScore += Math.max(0, copyrightScore);
    }

    const overallScore = copyrights?.length ? totalScore / copyrights.length : 0;
    const canExport = blockingIssues.length === 0;

    // Save validation results
    const { data: validationRecord, error: saveError } = await supabaseClient
      .from('export_validation_results')
      .insert({
        user_id: user.id,
        copyright_ids: copyrightIds,
        validation_type: exportType,
        overall_score: overallScore,
        validation_results: validationResults,
        blocking_issues: blockingIssues,
        warning_issues: warningIssues,
        can_export: canExport
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving validation results:', saveError);
    }

    return new Response(JSON.stringify({
      validationId: validationRecord?.id,
      overallScore,
      canExport,
      totalCopyrights: copyrights?.length || 0,
      blockingIssuesCount: blockingIssues.length,
      warningIssuesCount: warningIssues.length,
      blockingIssues,
      warningIssues,
      copyrightResults: validationResults,
      recommendations: generateRecommendations(blockingIssues, warningIssues, exportType)
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in validate-export-compliance:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

function generateRecommendations(blockingIssues: any[], warningIssues: any[], exportType: string) {
  const recommendations = [];

  if (blockingIssues.some(i => i.field === 'sender_code')) {
    recommendations.push('Apply for and obtain an approved sender code before attempting export');
  }

  if (blockingIssues.some(i => i.field === 'song_title')) {
    recommendations.push('Ensure all works have complete song titles');
  }

  if (blockingIssues.some(i => i.field === 'writers')) {
    recommendations.push('All works must have at least one writer assigned');
  }

  if (blockingIssues.some(i => i.field.includes('shares'))) {
    recommendations.push('Review and correct ownership percentage splits');
  }

  if (exportType === 'ddex' && warningIssues.some(i => i.field === 'isrc')) {
    recommendations.push('Add ISRC codes to recordings for better DDEX compliance');
  }

  if (exportType === 'cwr' && warningIssues.some(i => i.field === 'iswc')) {
    recommendations.push('Add ISWC codes to works for better CWR compliance');
  }

  if (warningIssues.some(i => i.field.includes('ipi'))) {
    recommendations.push('Complete writer IPI/CAE numbers for full metadata compliance');
  }

  return recommendations;
}