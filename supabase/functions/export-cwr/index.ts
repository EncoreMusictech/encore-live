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

const generateCWRFile = (works: CWRWork[], headerConfig?: any): string => {
  const lines: string[] = [];
  let recordCount = 0;
  
  // Generate proper CWR 2.1 header with current timestamp
  const now = new Date();
  const creationDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const creationTime = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const transmissionSequence = '00000001';
  
  // CWR 2.1 Header Record (HDR) - Fixed width format
  const header = [
    'HDR',                                    // Record Type (3)
    transmissionSequence,                     // Transaction Sequence # (8)
    '02.10',                                 // CWR Version (5)
    'ENCMUSIC'.padEnd(9),                    // Sender ID (9) - left aligned, max 9 chars
    'SO',                                    // Sender Type (2)
    creationDate,                            // Creation Date (8) YYYYMMDD
    creationTime,                            // Creation Time (6) HHMMSS
    'ENCORE MUSIC PUBLISHING'.padEnd(45),    // Sender Name (45)
    'EDI'.padEnd(45),                        // EDI Standard (45)
    'ASCII'.padEnd(5),                       // Character Set (5)
    ''.padEnd(11),                           // Character Set Version (11)
    ''.padEnd(60)                            // Filler (60)
  ].join('');
  
  lines.push(header);
  recordCount++;
  
  let transactionSeq = 2; // Start from 2 after header
  
  // If no works provided, create a placeholder work for demo
  const worksToProcess = works.length > 0 ? works : [{
    title: 'Sample Musical Work',
    iswc: 'T0123456789',
    writers: [{
      name: 'John Doe',
      ipi: '12345678901',
      ownership_percentage: 50,
      role: 'composer',
      controlled_status: 'C'
    }],
    publishers: [{
      name: 'Encore Music Publishing',
      ipi: '98765432109',
      ownership_percentage: 50,
      role: 'original_publisher'
    }],
    recordings: [{
      isrc: 'USENC2400001',
      artist_name: 'Sample Artist',
      duration: 180,
      release_date: '2024-01-01'
    }]
  }];
  
  worksToProcess.forEach((work, workIndex) => {
    // New Work Registration (NWR) record - CWR 2.1 format
    const submitterWorkNumber = `ENC${String(workIndex + 1).padStart(8, '0')}`;
    const nwr = [
      'NWR',                                          // Record Type (3)
      String(transactionSeq).padStart(8, '0'),       // Transaction Sequence (8)
      work.title.substring(0, 60).padEnd(60),        // Work Title (60)
      work.iswc ? work.iswc.replace(/-/g, '').padEnd(11) : ''.padEnd(11), // ISWC (11)
      'EN'.padEnd(14),                               // Language Code (14)
      submitterWorkNumber.padEnd(14),                // Submitter Work Number (14)
      'ORI',                                         // Work Type (3)
      'U',                                           // Musical Work Distribution Category (1)
      work.recordings && work.recordings.length > 0 ? 'Y' : 'N', // Recorded Indicator (1)
      ''.padEnd(3),                                  // Version Type (3)
      ''.padEnd(60),                                 // Excerpt Type (60)
      ''.padEnd(5),                                  // Composite Type (5)
      ''.padEnd(15),                                 // Composite Component Count (15)
      ''.padEnd(8),                                  // Date Publication First (8)
      ''.padEnd(3),                                  // Exceptional Clause (3)
      ''.padEnd(60),                                 // Grand Rights Indicator (60)
      ''.padEnd(5),                                  // Catalogue Number (5)
      ''.padEnd(60)                                  // Priority Flag (60)
    ].join('');
    lines.push(nwr);
    recordCount++;
    
    // Writer records (SWR) - CWR 2.1 format
    work.writers.forEach((writer, writerIndex) => {
      const writerSequence = String(transactionSeq + writerIndex + 1).padStart(8, '0');
      const nameParts = writer.name.split(' ');
      const firstName = (nameParts[0] || '').substring(0, 30).padEnd(30);
      const lastName = (nameParts.slice(1).join(' ') || '').substring(0, 45).padEnd(45);
      
      const swr = [
        'SWR',                                        // Record Type (3)
        writerSequence,                               // Transaction Sequence (8)
        writer.controlled_status === 'C' ? 'Y' : 'N', // Controlled Indicator (1)
        firstName,                                    // Writer First Name (30)
        lastName,                                     // Writer Last Name (45)
        writer.ipi ? writer.ipi.replace(/\D/g, '').padStart(11, '0') : ''.padEnd(11), // IPI Number (11)
        ''.padEnd(1),                                 // Writer Unknown Indicator (1)
        getWriterRole(writer.role).padEnd(2),         // Writer Designation (2)
        ''.padEnd(60),                                // Work for Hire Indicator (60)
        String(Math.round(writer.ownership_percentage)).padStart(5, '0'), // Writer Share (5) - percentage as whole number
        ''.padEnd(3),                                 // Revision Level (3)
        ''.padEnd(1),                                 // First Recording Refusal (1)
        ''.padEnd(60)                                 // USA License Indicator (60)
      ].join('');
      lines.push(swr);
      recordCount++;
    });
    
    // Publisher records (PWR) - CWR 2.1 format
    work.publishers.forEach((publisher, publisherIndex) => {
      const publisherSequence = String(transactionSeq + work.writers.length + publisherIndex + 1).padStart(8, '0');
      
      const pwr = [
        'PWR',                                        // Record Type (3)
        publisherSequence,                            // Transaction Sequence (8)
        publisher.name.substring(0, 45).padEnd(45),   // Publisher Name (45)
        publisher.ipi ? publisher.ipi.replace(/\D/g, '').padStart(11, '0') : ''.padEnd(11), // IPI Number (11)
        ''.padEnd(1),                                 // Publisher Unknown Indicator (1)
        getPublisherType(publisher.role).padEnd(2),   // Publisher Type (2)
        ''.padEnd(60),                                // Tax ID (60)
        String(Math.round(publisher.ownership_percentage)).padStart(5, '0'), // Publisher Share (5) - percentage as whole number
        ''.padEnd(3),                                 // International Standard Agreement Code (3)
        ''.padEnd(60),                                // Agreement Type (60)
        ''.padEnd(8),                                 // Agreement Start Date (8)
        ''.padEnd(8),                                 // Agreement End Date (8)
        ''.padEnd(60)                                 // Filler (60)
      ].join('');
      lines.push(pwr);
      recordCount++;
    });
    
    // Territory records (TER) - Add for worldwide rights
    const territorySequence = String(transactionSeq + work.writers.length + work.publishers.length + 1).padStart(8, '0');
    const ter = [
      'TER',                                          // Record Type (3)
      territorySequence,                              // Transaction Sequence (8)
      'I',                                           // Inclusion/Exclusion (1)
      'WW',                                          // Territory Code (2)
      ''.padEnd(60)                                  // Filler (60)
    ].join('');
    lines.push(ter);
    recordCount++;

    // Recording records (REC) if available - CWR 2.1 format
    if (work.recordings && work.recordings.length > 0) {
      work.recordings.forEach((recording, recordingIndex) => {
        const recordingSequence = String(transactionSeq + work.writers.length + work.publishers.length + recordingIndex + 2).padStart(8, '0');
        
        const rec = [
          'REC',                                      // Record Type (3)
          recordingSequence,                          // Transaction Sequence (8)
          recording.isrc ? recording.isrc.replace(/-/g, '').padEnd(12) : ''.padEnd(12), // ISRC (12)
          recording.artist_name?.substring(0, 60).padEnd(60) || ''.padEnd(60), // Recording Artist (60)
          recording.duration ? String(recording.duration).padStart(6, '0') : ''.padEnd(6), // Duration (6)
          recording.release_date?.replace(/-/g, '').substring(0, 8).padEnd(8) || ''.padEnd(8), // Release Date (8)
          ''.padEnd(60),                              // Record Label (60)
          ''.padEnd(60),                              // Catalogue Number (60)
          ''.padEnd(5),                               // Release Format (5)
          ''.padEnd(60)                               // Filler (60)
        ].join('');
        lines.push(rec);
        recordCount++;
      });
    }
    
    transactionSeq += work.writers.length + work.publishers.length + 2 + (work.recordings?.length || 0);
  });
  
  // Add CWR 2.1 Group Trailer (GRT)
  const grt = [
    'GRT',                                            // Record Type (3)
    String(transactionSeq).padStart(8, '0'),         // Transaction Sequence (8)
    '0001',                                          // Group ID (4)
    String(worksToProcess.length).padStart(5, '0'),  // Transaction Count (5) - number of works
    String(recordCount).padStart(8, '0'),            // Record Count (8) - actual records excluding HDR
    ''.padEnd(60)                                    // Filler (60)
  ].join('');
  lines.push(grt);
  recordCount++;
  
  // Add CWR 2.1 Transmission Trailer (TRL)
  const trl = [
    'TRL',                                            // Record Type (3)
    String(transactionSeq + 1).padStart(8, '0'),     // Transaction Sequence (8)
    '0001',                                          // Group Count (4) - number of groups
    String(worksToProcess.length).padStart(8, '0'),  // Transaction Count (8) - number of works
    String(recordCount + 1).padStart(8, '0'),        // Record Count (8) - total records including HDR + GRT
    ''.padEnd(60)                                    // Filler (60)
  ].join('');
  lines.push(trl);
  
  return lines.join('\r\n'); // CWR standard uses CRLF line endings
};

// Territory mapping for CWR compliance
const getCWRTerritoryCode = (uiCode: string): string => {
  const territoryMap: Record<string, string> = {
    'WORLD': '2136',
    'US': '840',
    'CA': '124',
    'GB': '826',
    'FR': '250',
    'DE': '276',
    'JP': '392',
    'AU': '036'
  };
  return territoryMap[uiCode] || '2136'; // Default to worldwide
};

// Helper functions for CWR field mappings
const getWriterRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    'composer': 'CA',
    'lyricist': 'A',
    'author': 'A',
    'arranger': 'AR',
    'translator': 'TR',
    'adapter': 'AD'
  };
  return roleMap[role?.toLowerCase()] || 'A';
};

const getPublisherType = (role: string): string => {
  const typeMap: Record<string, string> = {
    'original_publisher': 'E',
    'sub_publisher': 'ES',
    'administrator': 'PA',
    'co_publisher': 'SE'
  };
  return typeMap[role?.toLowerCase()] || 'E';
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