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
  let recordSequenceNumber = 1; // Start from 1 for proper CWR 2.1 sequencing
  
  // Generate proper CWR 2.1 header with current timestamp
  const now = new Date();
  const creationDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const creationTime = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const transmissionSequence = '00000001';
  
  // CWR 2.1 Header Record (HDR) - 201 character fixed width
  const hdrRecordType = 'HDR';                                           // 3 chars
  const hdrSequence = String(recordSequenceNumber).padStart(8, '0');    // 8 chars
  const cwrVersion = '02.10';                                            // 5 chars
  const senderID = 'ENCMUSIC'.padEnd(9);                                 // 9 chars - left aligned
  const senderType = 'SO';                                               // 2 chars
  const hdrCreationDate = creationDate;                                  // 8 chars YYYYMMDD
  const hdrCreationTime = creationTime;                                  // 6 chars HHMMSS
  const senderName = 'ENCORE MUSIC PUBLISHING'.padEnd(45);              // 45 chars - left aligned
  const ediStandard = 'EDI'.padEnd(45);                                  // 45 chars - left aligned
  const characterSet = 'ASCII'.padEnd(5);                                // 5 chars - left aligned
  const charSetVersion = ''.padEnd(11);                                  // 11 chars
  const hdrFiller = ''.padEnd(60);                                       // 60 chars
  
  const header = hdrRecordType + hdrSequence + cwrVersion + senderID + senderType + 
                 hdrCreationDate + hdrCreationTime + senderName + ediStandard + 
                 characterSet + charSetVersion + hdrFiller;
  
  lines.push(header);
  recordSequenceNumber++;
  
  let groupTransactionCount = 0; // Count transactions (works) in this group
  
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
    groupTransactionCount++; // Increment transaction count for this work
    
    // New Work Registration (NWR) record - CWR 2.1 format (318 chars)
    const submitterWorkNumber = `ENC${String(workIndex + 1).padStart(8, '0')}`;
    
    const nwrRecordType = 'NWR';                                               // 3 chars
    const nwrSequence = String(recordSequenceNumber).padStart(8, '0');        // 8 chars
    const workTitle = work.title.substring(0, 60).padEnd(60);                 // 60 chars - left aligned
    const iswc = work.iswc ? work.iswc.replace(/-/g, '').substring(0, 11).padEnd(11) : ''.padEnd(11); // 11 chars
    const languageCode = 'EN'.padEnd(14);                                     // 14 chars - left aligned
    const submitterWorkNum = submitterWorkNumber.substring(0, 14).padEnd(14); // 14 chars - left aligned
    const workType = 'ORI';                                                   // 3 chars - original work
    const musicWorkDistCat = 'U';                                             // 1 char - undefined
    const recordedIndicator = work.recordings && work.recordings.length > 0 ? 'Y' : 'N'; // 1 char
    const versionType = ''.padEnd(3);                                         // 3 chars
    const excerptType = ''.padEnd(60);                                        // 60 chars
    const compositeType = ''.padEnd(5);                                       // 5 chars
    const compositeComponentCount = ''.padEnd(15);                            // 15 chars
    const datePublicationFirst = ''.padEnd(8);                               // 8 chars
    const exceptionalClause = ''.padEnd(3);                                  // 3 chars
    const grandRightsIndicator = ''.padEnd(60);                              // 60 chars
    const catalogueNumber = ''.padEnd(5);                                    // 5 chars
    const nwrFiller = ''.padEnd(60);                                         // 60 chars
    
    const nwr = nwrRecordType + nwrSequence + workTitle + iswc + languageCode + 
                submitterWorkNum + workType + musicWorkDistCat + recordedIndicator + 
                versionType + excerptType + compositeType + compositeComponentCount + 
                datePublicationFirst + exceptionalClause + grandRightsIndicator + 
                catalogueNumber + nwrFiller;
    
    lines.push(nwr);
    recordSequenceNumber++;
    
    // Writer records (SWR) - CWR 2.1 format (238 chars)
    work.writers.forEach((writer, writerIndex) => {
      const nameParts = writer.name.split(' ');
      const firstName = (nameParts[0] || '').substring(0, 30).padEnd(30);     // 30 chars - left aligned
      const lastName = (nameParts.slice(1).join(' ') || '').substring(0, 45).padEnd(45); // 45 chars - left aligned
      const writerIPI = writer.ipi ? writer.ipi.replace(/\D/g, '').substring(0, 11).padStart(11, '0') : '00000000000'; // 11 chars - right aligned, zero padded
      
      const swrRecordType = 'SWR';                                           // 3 chars
      const swrSequence = String(recordSequenceNumber).padStart(8, '0');     // 8 chars
      const controlledIndicator = writer.controlled_status === 'C' ? 'Y' : 'N'; // 1 char
      const writerFirstName = firstName;                                     // 30 chars
      const writerLastName = lastName;                                       // 45 chars
      const ipiNumber = writerIPI;                                           // 11 chars
      const writerUnknown = ' ';                                             // 1 char
      const writerDesignation = getWriterRole(writer.role);                  // 2 chars
      const workForHire = ' ';                                               // 1 char
      const writerShare = String(Math.round(writer.ownership_percentage * 100)).padStart(5, '0'); // 5 chars - right aligned, zero padded (percentage * 100)
      const revisionLevel = '   ';                                           // 3 chars
      const firstRecordingRefusal = ' ';                                     // 1 char
      const swrFiller = ''.padEnd(127);                                      // 127 chars
      
      const swr = swrRecordType + swrSequence + controlledIndicator + writerFirstName + 
                  writerLastName + ipiNumber + writerUnknown + writerDesignation + 
                  workForHire + writerShare + revisionLevel + firstRecordingRefusal + swrFiller;
      
      lines.push(swr);
      recordSequenceNumber++;
    });
    
    // Publisher records (PWR) - CWR 2.1 format (288 chars)
    work.publishers.forEach((publisher, publisherIndex) => {
      const publisherName = publisher.name.substring(0, 45).padEnd(45);      // 45 chars - left aligned
      const publisherIPI = publisher.ipi ? publisher.ipi.replace(/\D/g, '').substring(0, 11).padStart(11, '0') : '00000000000'; // 11 chars - right aligned, zero padded
      
      const pwrRecordType = 'PWR';                                           // 3 chars
      const pwrSequence = String(recordSequenceNumber).padStart(8, '0');     // 8 chars
      const pubName = publisherName;                                         // 45 chars
      const pubIPI = publisherIPI;                                           // 11 chars
      const publisherUnknown = ' ';                                          // 1 char
      const publisherType = getPublisherType(publisher.role);                // 2 chars
      const taxID = ''.padEnd(60);                                           // 60 chars
      const publisherShare = String(Math.round(publisher.ownership_percentage * 100)).padStart(5, '0'); // 5 chars - right aligned, zero padded (percentage * 100)
      const agreementCode = '   ';                                           // 3 chars
      const agreementType = ''.padEnd(60);                                   // 60 chars
      const agreementStartDate = '        ';                                 // 8 chars
      const agreementEndDate = '        ';                                   // 8 chars
      const pwrFiller = ''.padEnd(64);                                       // 64 chars
      
      const pwr = pwrRecordType + pwrSequence + pubName + pubIPI + publisherUnknown + 
                  publisherType + taxID + publisherShare + agreementCode + 
                  agreementType + agreementStartDate + agreementEndDate + pwrFiller;
      
      lines.push(pwr);
      recordSequenceNumber++;
    });
    
    // Territory records (TER) - CWR 2.1 format (14 chars)
    const terRecordType = 'TER';                                             // 3 chars
    const terSequence = String(recordSequenceNumber).padStart(8, '0');       // 8 chars
    const inclusionExclusion = 'I';                                          // 1 char - inclusion
    const territoryCode = '2136';                                            // 4 chars - worldwide territory code (numeric, right aligned with leading zeros)
    
    const ter = terRecordType + terSequence + inclusionExclusion + territoryCode;
    
    lines.push(ter);
    recordSequenceNumber++;

    // Recording records (REC) if available - CWR 2.1 format (318 chars)
    if (work.recordings && work.recordings.length > 0) {
      work.recordings.forEach((recording, recordingIndex) => {
        const recRecordType = 'REC';                                         // 3 chars
        const recSequence = String(recordSequenceNumber).padStart(8, '0');   // 8 chars
        const recISRC = recording.isrc ? recording.isrc.replace(/-/g, '').substring(0, 12).padEnd(12) : ''.padEnd(12); // 12 chars - left aligned
        const recordingArtist = (recording.artist_name || '').substring(0, 60).padEnd(60); // 60 chars - left aligned
        const recDuration = recording.duration ? String(recording.duration).padStart(6, '0') : '000000'; // 6 chars - right aligned, zero padded
        const releaseDate = recording.release_date ? recording.release_date.replace(/-/g, '').substring(0, 8) : '00000000'; // 8 chars
        const recordLabel = ''.padEnd(60);                                   // 60 chars
        const catNumber = ''.padEnd(60);                                     // 60 chars
        const releaseFormat = ''.padEnd(5);                                  // 5 chars
        const recFiller = ''.padEnd(96);                                     // 96 chars
        
        const rec = recRecordType + recSequence + recISRC + recordingArtist + 
                    recDuration + releaseDate + recordLabel + catNumber + 
                    releaseFormat + recFiller;
        
        lines.push(rec);
        recordSequenceNumber++;
      });
    }
  });
  
  // Calculate accurate totals for GRT and TRL
  const totalRecordsInGroup = recordSequenceNumber - 2; // Excluding HDR and the GRT record itself
  const totalTransactions = groupTransactionCount; // Number of works processed
  
  // Add CWR 2.1 Group Trailer (GRT) - 88 character fixed width
  const grtRecordType = 'GRT';                                               // 3 chars
  const grtSequence = String(recordSequenceNumber).padStart(8, '0');        // 8 chars
  const groupID = '0001'.padStart(4, '0');                                   // 4 chars - right aligned, zero padded
  const transactionCount = String(totalTransactions).padStart(5, '0');      // 5 chars - right aligned, zero padded
  const recordCountInGroup = String(totalRecordsInGroup).padStart(8, '0');  // 8 chars - right aligned, zero padded
  const grtFiller = ''.padEnd(60);                                           // 60 chars
  
  const grt = grtRecordType + grtSequence + groupID + transactionCount + 
              recordCountInGroup + grtFiller;
  
  lines.push(grt);
  recordSequenceNumber++;
  
  // Calculate accurate totals for TRL
  const totalRecordsInTransmission = recordSequenceNumber - 1; // Excluding the TRL record itself
  
  // Add CWR 2.1 Transmission Trailer (TRL) - 88 character fixed width
  const trlRecordType = 'TRL';                                               // 3 chars
  const trlSequence = String(recordSequenceNumber).padStart(8, '0');        // 8 chars
  const groupCount = '0001'.padStart(4, '0');                                // 4 chars - right aligned, zero padded (number of groups)
  const totalTransactionCount = String(totalTransactions).padStart(8, '0'); // 8 chars - right aligned, zero padded
  const totalRecordCount = String(totalRecordsInTransmission).padStart(8, '0'); // 8 chars - right aligned, zero padded
  const trlFiller = ''.padEnd(57);                                           // 57 chars
  
  const trl = trlRecordType + trlSequence + groupCount + totalTransactionCount + 
              totalRecordCount + trlFiller;
  
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