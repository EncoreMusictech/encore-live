import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CWRWork {
  title: string;
  iswc?: string;
  writers: CWRWriter[];
  publishers: CWRPublisher[];
  recordings?: CWRRecording[];
}

interface CWRWriter {
  name: string;
  ipi?: string;
  ownership_percentage: number;
  role: string;
  controlled_status: string;
}

interface CWRPublisher {
  name: string;
  ipi?: string;
  ownership_percentage: number;
  role: string;
}

interface CWRRecording {
  isrc?: string;
  artist_name?: string;
  duration?: number;
  release_date?: string;
}

const generateCWRFile = (works: CWRWork[]): string => {
  const lines: string[] = [];
  
  // Add CWR header
  lines.push("HDR0000102.10ENCOREMUSIC                 20240101000000                                                                                                ");
  
  let transactionSeq = 1;
  
  works.forEach((work, workIndex) => {
    // New Work Registration (NWR) record
    const nwr = [
      'NWR',
      String(transactionSeq).padStart(8, '0'),
      work.title.substring(0, 60).padEnd(60),
      work.iswc || ''.padEnd(11),
      ''.padEnd(14), // Language code
      ''.padEnd(60), // Submitter work number
      'ORI', // Work type
      'U', // Musical work distribution category
      'Y', // Recorded indicator
      ''.padEnd(3), // Version type
      ''.padEnd(60), // Excerpt type
      ''.padEnd(5), // Composite type
      ''.padEnd(15), // Composite component count
      ''.padEnd(3), // Date publication of printed edition
      ''.padEnd(3), // Exceptional clause
      'N', // Opus/catalogue number
      ''.padEnd(5), // Catalogue number
      ''.padEnd(60), // Priority flag
    ].join('');
    lines.push(nwr);
    
    // Writer records (SWR)
    work.writers.forEach((writer) => {
      const swr = [
        'SWR',
        String(transactionSeq).padStart(8, '0'),
        writer.name.substring(0, 60).padEnd(60),
        writer.ipi || ''.padEnd(11),
        writer.controlled_status === 'C' ? 'Y' : 'N',
        String(writer.ownership_percentage * 100).padStart(5, '0'), // Convert to basis points
        ''.padEnd(60), // Designation
        writer.role === 'composer' ? 'CA' : 'A ', // Writer role
        ''.padEnd(60), // Work for hire
        ''.padEnd(3), // Revision level
        ''.padEnd(1), // First recording refusal
        ''.padEnd(60), // USA license
      ].join('');
      lines.push(swr);
    });
    
    // Publisher records (PWR)
    work.publishers.forEach((publisher) => {
      const pwr = [
        'PWR',
        String(transactionSeq).padStart(8, '0'),
        publisher.name.substring(0, 60).padEnd(60),
        publisher.ipi || ''.padEnd(11),
        'Y', // Controlled
        String(publisher.ownership_percentage * 100).padStart(5, '0'), // Convert to basis points
        ''.padEnd(60), // Designation
        'E ', // Publisher type
        ''.padEnd(60), // Tax ID
        ''.padEnd(3), // International standard agreement code
        ''.padEnd(60), // Agreement type
        ''.padEnd(8), // Agreement start date
        ''.padEnd(8), // Agreement end date
      ].join('');
      lines.push(pwr);
    });
    
    // Recording records (REC) if available
    if (work.recordings && work.recordings.length > 0) {
      work.recordings.forEach((recording) => {
        const rec = [
          'REC',
          String(transactionSeq).padStart(8, '0'),
          recording.isrc || ''.padEnd(12),
          recording.artist_name?.substring(0, 60).padEnd(60) || ''.padEnd(60),
          recording.duration ? String(recording.duration).padStart(6, '0') : ''.padEnd(6),
          recording.release_date?.replace(/-/g, '').substring(0, 8).padEnd(8) || ''.padEnd(8),
          ''.padEnd(60), // Record label
          ''.padEnd(60), // Catalogue number
          ''.padEnd(5), // Release format
        ].join('');
        lines.push(rec);
      });
    }
    
    transactionSeq++;
  });
  
  // Add trailer
  lines.push(`TRL000${String(lines.length + 1).padStart(8, '0')}01000000010`);
  
  return lines.join('\n');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { copyrightIds } = await req.json();

    // Fetch copyright data with related writers, publishers, and recordings
    const { data: copyrights, error: copyrightsError } = await supabase
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
      throw new Error(`Failed to fetch copyrights: ${copyrightsError.message}`);
    }

    // Transform data to CWR format
    const cwrWorks: CWRWork[] = copyrights.map(copyright => ({
      title: copyright.work_title,
      iswc: copyright.iswc,
      writers: copyright.copyright_writers.map((writer: any) => ({
        name: writer.writer_name,
        ipi: writer.ipi_number,
        ownership_percentage: writer.ownership_percentage,
        role: writer.writer_role,
        controlled_status: writer.controlled_status,
      })),
      publishers: copyright.copyright_publishers.map((publisher: any) => ({
        name: publisher.publisher_name,
        ipi: publisher.ipi_number,
        ownership_percentage: publisher.ownership_percentage,
        role: publisher.publisher_role,
      })),
      recordings: copyright.copyright_recordings.map((recording: any) => ({
        isrc: recording.isrc,
        artist_name: recording.artist_name,
        duration: recording.duration_seconds,
        release_date: recording.release_date,
      })),
    }));

    // Generate CWR file content
    const cwrContent = generateCWRFile(cwrWorks);

    // Log the export
    await supabase.from('copyright_exports').insert({
      user_id: user.id,
      export_type: 'bulk',
      export_format: 'cwr',
      record_count: copyrightIds.length,
      export_status: 'completed',
    });

    // Return the CWR file
    return new Response(cwrContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="export_${new Date().toISOString().split('T')[0]}.cwr"`,
      },
    });

  } catch (error) {
    console.error('Error in export-cwr function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate CWR export' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});