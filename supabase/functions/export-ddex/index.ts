import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DDEXWork {
  title: string;
  iswc?: string;
  language?: string;
  contributors: DDEXContributor[];
  recordings?: DDEXRecording[];
}

interface DDEXContributor {
  name: string;
  ipi?: string;
  role: string;
  share: number;
  type: 'writer' | 'publisher';
}

interface DDEXRecording {
  isrc?: string;
  title?: string;
  artist?: string;
  duration?: number;
  releaseDate?: string;
}

const generateDDEXXML = (works: DDEXWork[]): string => {
  const timestamp = new Date().toISOString();
  const messageId = `ENCORE_${Date.now()}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<MusicalWorkNotificationMessage xmlns="http://ddex.net/xml/mwn/20161006">
  <MessageHeader>
    <MessageThreadId>${messageId}</MessageThreadId>
    <MessageId>${messageId}</MessageId>
    <MessageSender>
      <PartyId>DPID::ENCORE</PartyId>
      <PartyName>
        <FullName>Encore Music</FullName>
      </PartyName>
    </MessageSender>
    <MessageRecipient>
      <PartyId>DPID::RECIPIENT</PartyId>
    </MessageRecipient>
    <MessageCreatedDateTime>${timestamp}</MessageCreatedDateTime>
    <MessageControlType>LiveMessage</MessageControlType>
  </MessageHeader>
  <MusicalWorkNotificationList>`;

  works.forEach((work, index) => {
    xml += `
    <MusicalWorkNotification>
      <MusicalWorkNotificationId>MW_${index + 1}</MusicalWorkNotificationId>
      <NotificationAction>CreateMusicalWork</NotificationAction>
      <MusicalWork>
        <MusicalWorkId>
          <ProprietaryId Namespace="ENCORE">${work.title.replace(/[^a-zA-Z0-9]/g, '_')}_${index + 1}</ProprietaryId>`;
    
    if (work.iswc) {
      xml += `
          <ISWC>${work.iswc}</ISWC>`;
    }
    
    xml += `
        </MusicalWorkId>
        <MusicalWorkReference>
          <MusicalWorkReferenceId>
            <ProprietaryId Namespace="ENCORE">${work.title.replace(/[^a-zA-Z0-9]/g, '_')}_${index + 1}</ProprietaryId>
          </MusicalWorkReferenceId>
        </MusicalWorkReference>
        <MusicalWorkDetailsByTerritory>
          <TerritoryCode>Worldwide</TerritoryCode>
          <Title>
            <TitleText>${work.title}</TitleText>
            <TitleType>OriginalTitle</TitleType>
          </Title>`;
    
    if (work.language) {
      xml += `
          <LanguageOfLyrics>${work.language}</LanguageOfLyrics>`;
    }
    
    // Add contributors
    if (work.contributors && work.contributors.length > 0) {
      xml += `
          <WorkContributors>`;
      
      work.contributors.forEach((contributor, contribIndex) => {
        xml += `
            <WorkContributor SequenceNumber="${contribIndex + 1}">
              <PartyId>
                <ProprietaryId Namespace="ENCORE">${contributor.type.toUpperCase()}_${contribIndex + 1}</ProprietaryId>`;
        
        if (contributor.ipi) {
          xml += `
                <IPI>${contributor.ipi}</IPI>`;
        }
        
        xml += `
              </PartyId>
              <PartyName>
                <FullName>${contributor.name}</FullName>
              </PartyName>
              <ContributorRole>${contributor.role === 'composer' ? 'Composer' : contributor.role === 'lyricist' ? 'Lyricist' : 'Adapter'}</ContributorRole>
              <ContributorShare>
                <SharePercentage>${contributor.share}</SharePercentage>
              </ContributorShare>
            </WorkContributor>`;
      });
      
      xml += `
          </WorkContributors>`;
    }
    
    xml += `
        </MusicalWorkDetailsByTerritory>`;
    
    // Add sound recordings if available
    if (work.recordings && work.recordings.length > 0) {
      xml += `
        <SoundRecordingDetailsByTerritory>
          <TerritoryCode>Worldwide</TerritoryCode>`;
      
      work.recordings.forEach((recording, recIndex) => {
        xml += `
          <SoundRecording SequenceNumber="${recIndex + 1}">`;
        
        if (recording.isrc) {
          xml += `
            <SoundRecordingId>
              <ISRC>${recording.isrc}</ISRC>
            </SoundRecordingId>`;
        }
        
        if (recording.title) {
          xml += `
            <Title>
              <TitleText>${recording.title}</TitleText>
              <TitleType>OriginalTitle</TitleType>
            </Title>`;
        }
        
        if (recording.artist) {
          xml += `
            <DisplayArtistName>${recording.artist}</DisplayArtistName>`;
        }
        
        if (recording.duration) {
          const minutes = Math.floor(recording.duration / 60);
          const seconds = recording.duration % 60;
          xml += `
            <Duration>PT${minutes}M${seconds}S</Duration>`;
        }
        
        if (recording.releaseDate) {
          xml += `
            <ReleaseDate>${recording.releaseDate}</ReleaseDate>`;
        }
        
        xml += `
          </SoundRecording>`;
      });
      
      xml += `
        </SoundRecordingDetailsByTerritory>`;
    }
    
    xml += `
      </MusicalWork>
    </MusicalWorkNotification>`;
  });

  xml += `
  </MusicalWorkNotificationList>
</MusicalWorkNotificationMessage>`;

  return xml;
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

    // Transform data to DDEX format
    const ddexWorks: DDEXWork[] = copyrights.map(copyright => {
      const contributors: DDEXContributor[] = [
        ...copyright.copyright_writers.map((writer: any) => ({
          name: writer.writer_name,
          ipi: writer.ipi_number,
          role: writer.writer_role,
          share: writer.ownership_percentage,
          type: 'writer' as const,
        })),
        ...copyright.copyright_publishers.map((publisher: any) => ({
          name: publisher.publisher_name,
          ipi: publisher.ipi_number,
          role: publisher.publisher_role,
          share: publisher.ownership_percentage,
          type: 'publisher' as const,
        }))
      ];

      return {
        title: copyright.work_title,
        iswc: copyright.iswc,
        language: copyright.language_code,
        contributors,
        recordings: copyright.copyright_recordings.map((recording: any) => ({
          isrc: recording.isrc,
          title: recording.recording_title,
          artist: recording.artist_name,
          duration: recording.duration_seconds,
          releaseDate: recording.release_date,
        })),
      };
    });

    // Generate DDEX XML content
    const ddexContent = generateDDEXXML(ddexWorks);

    // Log the export
    await supabase.from('copyright_exports').insert({
      user_id: user.id,
      export_type: 'bulk',
      export_format: 'ddex',
      record_count: copyrightIds.length,
      export_status: 'completed',
    });

    // Return the DDEX XML file
    return new Response(ddexContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="ddex_export_${new Date().toISOString().split('T')[0]}.xml"`,
      },
    });

  } catch (error) {
    console.error('Error in export-ddex function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate DDEX export' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});