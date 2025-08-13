import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const mlcApiKey = Deno.env.get('MLC_API_KEY');

const supabase = createClient(supabaseUrl, serviceKey || '');

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workTitle, writerName, publisherName, iswc, isrc } = await req.json();

    if (!workTitle && !writerName && !iswc && !isrc) {
      return json({ error: 'At least one search parameter is required' }, 400);
    }

    if (!mlcApiKey) {
      return json({ 
        error: 'MLC API key not configured',
        found: false,
        writers: [],
        publishers: [],
        metadata: {}
      }, 200);
    }

    // Construct search query for MLC API
    const searchParams = new URLSearchParams();
    if (workTitle) searchParams.append('title', workTitle);
    if (writerName) searchParams.append('writer', writerName);
    if (publisherName) searchParams.append('publisher', publisherName);
    if (iswc) searchParams.append('iswc', iswc);
    if (isrc) searchParams.append('isrc', isrc);

    console.log('Searching MLC with params:', Object.fromEntries(searchParams));

    // Call MLC Public Search API
    const mlcResponse = await fetch(`https://api.themlc.com/public/search?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mlcApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!mlcResponse.ok) {
      console.error('MLC API error:', mlcResponse.status, await mlcResponse.text());
      return json({
        error: `MLC API error: ${mlcResponse.status}`,
        found: false,
        writers: [],
        publishers: [],
        metadata: {}
      }, 200);
    }

    const mlcData = await mlcResponse.json();
    console.log('MLC API response:', mlcData);

    if (!mlcData.works || mlcData.works.length === 0) {
      return json({
        found: false,
        writers: [],
        publishers: [],
        metadata: {},
        message: 'No works found in MLC database'
      });
    }

    // Process the first matching work
    const work = mlcData.works[0];
    
    // Extract writers with their shares and IPI numbers
    const writers = (work.rightsholders || [])
      .filter((r: any) => r.type === 'writer' || r.role === 'songwriter')
      .map((writer: any) => ({
        name: writer.name || '',
        ipi: writer.ipi_number || writer.ipi || '',
        share: parseFloat(writer.share_percentage || writer.share || '0'),
        role: writer.role || 'songwriter',
        cae: writer.cae_number || ''
      }));

    // Extract publishers with their shares
    const publishers = (work.rightsholders || [])
      .filter((r: any) => r.type === 'publisher' || r.role === 'publisher')
      .map((publisher: any) => ({
        name: publisher.name || '',
        ipi: publisher.ipi_number || publisher.ipi || '',
        share: parseFloat(publisher.share_percentage || publisher.share || '0'),
        cae: publisher.cae_number || ''
      }));

    // Extract metadata
    const metadata = {
      workTitle: work.title || '',
      iswc: work.iswc || '',
      mlcWorkId: work.work_id || work.id || '',
      registrationDate: work.registration_date || '',
      lastUpdated: work.last_updated || '',
      status: work.status || 'registered',
      workType: work.work_type || 'musical work',
      duration: work.duration || null,
      territory: 'USA', // MLC covers US mechanical rights
      rightsType: 'mechanical'
    };

    // Calculate confidence score based on data completeness
    let confidence = 0.5;
    if (work.iswc) confidence += 0.2;
    if (writers.length > 0) confidence += 0.2;
    if (publishers.length > 0) confidence += 0.1;
    confidence = Math.min(1.0, confidence);

    const result = {
      found: true,
      writers,
      publishers,
      metadata,
      confidence,
      source: 'MLC',
      totalMatches: mlcData.works.length,
      verification_notes: `Found ${mlcData.works.length} work(s) in MLC database`
    };

    console.log('Processed MLC result:', result);
    return json(result);

  } catch (error) {
    console.error('MLC lookup error:', error);
    return json({ 
      error: error.message || 'Unexpected error during MLC lookup',
      found: false,
      writers: [],
      publishers: [],
      metadata: {}
    }, 500);
  }
});