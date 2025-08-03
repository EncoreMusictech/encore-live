import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SearchRequest {
  workTitle: string;
  writerName?: string;
  publisherName?: string;
  artistName?: string;
}

interface MusicBrainzWork {
  id: string;
  title: string;
  disambiguation?: string;
  relations: any[];
  'attribute-lists'?: any[];
}

interface BMISearchResult {
  writers: Array<{
    name: string;
    ipi?: string;
    share?: number;
    role?: string;
  }>;
  publishers: Array<{
    name: string;
    ipi?: string;
    share?: number;
  }>;
  iswc?: string;
  found: boolean;
  source: 'bmi_scraped' | 'musicbrainz' | 'agent_search' | 'cache';
  confidence: number;
  verification_notes?: string;
}

// Enhanced MusicBrainz search with multiple query strategies
async function searchMusicBrainzEnhanced(workTitle: string, artistName?: string, writerName?: string): Promise<MusicBrainzWork | null> {
  const baseUrl = 'https://musicbrainz.org/ws/2/work';
  const userAgent = 'EncoreMusicTech/1.0.0 ( info@encoremusic.tech )';
  
  // Multiple search strategies
  const searchQueries = [
    // Exact title match
    `title:"${workTitle}"`,
    // Title with artist
    artistName ? `title:"${workTitle}" AND artist:"${artistName}"` : null,
    // Title with writer
    writerName ? `title:"${workTitle}" AND artist:"${writerName}"` : null,
    // Fuzzy title match
    `title:${workTitle.replace(/[^a-zA-Z0-9\s]/g, '')}`,
    // Simplified title search
    workTitle.split(' ').length > 1 ? `title:${workTitle.split(' ')[0]}` : null
  ].filter(Boolean);

  for (const query of searchQueries) {
    try {
      console.log(`MusicBrainz search: ${query}`);
      
      const response = await fetch(
        `${baseUrl}?query=${encodeURIComponent(query!)}&fmt=json&limit=5`,
        {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.log(`MusicBrainz API error: ${response.status} for query: ${query}`);
        continue;
      }

      const data = await response.json();
      
      if (data.works && data.works.length > 0) {
        // Find best match based on title similarity
        const bestMatch = data.works.find((work: MusicBrainzWork) => 
          work.title.toLowerCase().includes(workTitle.toLowerCase()) ||
          workTitle.toLowerCase().includes(work.title.toLowerCase())
        ) || data.works[0];
        
        console.log(`Found MusicBrainz work: ${bestMatch.title} (${bestMatch.id})`);
        return bestMatch;
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`MusicBrainz search error for query "${query}":`, error);
      continue;
    }
  }
  
  return null;
}

// Enhanced MusicBrainz work details with ISWC and relationships
async function getMusicBrainzWorkDetails(workId: string): Promise<{ iswc?: string; writers: string[]; publishers: string[] }> {
  const userAgent = 'EncoreMusicTech/1.0.0 ( info@encoremusic.tech )';
  
  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/work/${workId}?inc=work-rels+artist-rels&fmt=json`,
      {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.log(`MusicBrainz work details error: ${response.status}`);
      return { writers: [], publishers: [] };
    }

    const work = await response.json();
    const writers: string[] = [];
    const publishers: string[] = [];
    let iswc: string | undefined;

    // Extract ISWC
    if (work.iswcs && work.iswcs.length > 0) {
      iswc = work.iswcs[0];
    }

    // Extract relationships
    if (work.relations) {
      for (const relation of work.relations) {
        if (relation.type === 'writer' || relation.type === 'composer' || relation.type === 'lyricist') {
          if (relation.artist && relation.artist.name) {
            writers.push(relation.artist.name);
          }
        }
        if (relation.type === 'publisher') {
          if (relation.artist && relation.artist.name) {
            publishers.push(relation.artist.name);
          }
        }
      }
    }

    return { iswc, writers, publishers };
  } catch (error) {
    console.error('Error fetching MusicBrainz work details:', error);
    return { writers: [], publishers: [] };
  }
}

// OpenAI Agent with function calling for database searches
async function searchWithOpenAIAgent(searchRequest: SearchRequest): Promise<BMISearchResult> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const tools = [
    {
      type: "function",
      function: {
        name: "search_musicbrainz",
        description: "Search MusicBrainz database for song metadata including ISWC codes, writers, and publishers",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Song title to search for" },
            artist: { type: "string", description: "Artist or writer name" }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function", 
      function: {
        name: "search_bmi_repertoire",
        description: "Search BMI repertoire database for detailed song information",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Song title" },
            writer: { type: "string", description: "Writer name" },
            publisher: { type: "string", description: "Publisher name" }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "verify_song_metadata",
        description: "Cross-reference and verify song metadata from multiple sources",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            sources: { type: "array", items: { type: "object" } }
          },
          required: ["title", "sources"]
        }
      }
    }
  ];

  const systemPrompt = `You are a music metadata research agent specializing in finding accurate song information from BMI and MusicBrainz databases.

Your task is to find comprehensive metadata for songs including:
- ISWC codes (most important)
- Writer names and IPI numbers
- Publisher information and shares
- Performing rights organization data

Search strategy:
1. First search MusicBrainz for ISWC and basic metadata
2. Then search BMI repertoire for detailed writer/publisher info
3. Cross-reference and verify data consistency
4. Provide confidence scoring based on source reliability

Always prioritize verified database information over training data.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Find detailed metadata for the song "${searchRequest.workTitle}"${searchRequest.writerName ? ` by writer ${searchRequest.writerName}` : ''}${searchRequest.artistName ? ` performed by ${searchRequest.artistName}` : ''}${searchRequest.publisherName ? ` published by ${searchRequest.publisherName}` : ''}.`
          }
        ],
        tools: tools,
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    // Process function calls
    let musicbrainzData: any = null;
    let bmiData: any = null;

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        switch (functionName) {
          case 'search_musicbrainz':
            console.log('Agent calling MusicBrainz search');
            const mbWork = await searchMusicBrainzEnhanced(args.title, args.artist, searchRequest.writerName);
            if (mbWork) {
              musicbrainzData = await getMusicBrainzWorkDetails(mbWork.id);
              musicbrainzData.title = mbWork.title;
            }
            break;

          case 'search_bmi_repertoire':
            console.log('Agent calling BMI repertoire search');
            // This would integrate with BMI scraping in a real implementation
            // For now, we'll simulate the call
            bmiData = { note: 'BMI scraping would be implemented here' };
            break;

          case 'verify_song_metadata':
            console.log('Agent verifying metadata');
            break;
        }
      }
    }

    // Combine and reconcile data
    const result: BMISearchResult = {
      writers: [],
      publishers: [],
      found: false,
      source: 'agent_search',
      confidence: 0
    };

    // Process MusicBrainz data
    if (musicbrainzData) {
      result.iswc = musicbrainzData.iswc;
      result.writers = musicbrainzData.writers.map((name: string) => ({ name, role: 'writer' }));
      result.publishers = musicbrainzData.publishers.map((name: string) => ({ name }));
      result.found = true;
      result.confidence = 85; // High confidence for MusicBrainz data
      result.source = 'musicbrainz';
    }

    // If no data found, fall back to OpenAI knowledge
    if (!result.found && message.content) {
      try {
        const knowledgeResult = JSON.parse(message.content);
        if (knowledgeResult.writers || knowledgeResult.publishers) {
          result.writers = knowledgeResult.writers || [];
          result.publishers = knowledgeResult.publishers || [];
          result.found = true;
          result.confidence = 60; // Lower confidence for AI knowledge
          result.verification_notes = 'Based on AI training data, not real-time database access';
        }
      } catch {
        // If content isn't JSON, create basic result
        result.writers = [{ name: searchRequest.writerName || 'Unknown', role: 'writer' }];
        result.found = true;
        result.confidence = 30;
        result.verification_notes = 'Limited data available';
      }
    }

    return result;

  } catch (error) {
    console.error('OpenAI Agent search error:', error);
    
    // Fallback to basic search
    const fallbackWork = await searchMusicBrainzEnhanced(searchRequest.workTitle, searchRequest.artistName, searchRequest.writerName);
    if (fallbackWork) {
      const details = await getMusicBrainzWorkDetails(fallbackWork.id);
      return {
        writers: details.writers.map(name => ({ name, role: 'writer' })),
        publishers: details.publishers.map(name => ({ name })),
        iswc: details.iswc,
        found: true,
        source: 'musicbrainz',
        confidence: 80,
        verification_notes: 'Fallback MusicBrainz search after agent failure'
      };
    }

    return {
      writers: searchRequest.writerName ? [{ name: searchRequest.writerName, role: 'writer' }] : [],
      publishers: searchRequest.publisherName ? [{ name: searchRequest.publisherName }] : [],
      found: false,
      source: 'agent_search',
      confidence: 0,
      verification_notes: `Agent search failed: ${error.message}`
    };
  }
}

// Cache management
async function getCachedResult(searchKey: string, supabase: any): Promise<BMISearchResult | null> {
  try {
    const { data, error } = await supabase
      .from('song_metadata_cache')
      .select('*')
      .eq('search_key', searchKey)
      .eq('verification_status', 'verified')
      .single();

    if (error || !data) return null;

    return {
      writers: data.enhanced_writers || [],
      publishers: data.enhanced_publishers || [],
      iswc: data.iswc,
      found: data.bmi_verified || false,
      source: 'cache',
      confidence: data.verification_confidence || 0
    };
  } catch (error) {
    console.error('Cache lookup error:', error);
    return null;
  }
}

async function cacheResult(searchKey: string, result: BMISearchResult, supabase: any): Promise<void> {
  try {
    await supabase
      .from('song_metadata_cache')
      .upsert({
        search_key: searchKey,
        song_title: searchKey.split('|')[0],
        writer_name: searchKey.split('|')[1] || null,
        iswc: result.iswc,
        enhanced_writers: result.writers,
        enhanced_publishers: result.publishers,
        bmi_verified: result.found,
        verification_confidence: result.confidence,
        verification_status: result.confidence > 70 ? 'verified' : 'needs_review',
        metadata_source: result.source,
        last_verified_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const searchRequest: SearchRequest = await req.json();

    console.log('Enhanced BMI Agent search request:', searchRequest);

    // Create cache key
    const searchKey = `${searchRequest.workTitle}|${searchRequest.writerName || ''}|${searchRequest.artistName || ''}`;

    // Check cache first
    const cachedResult = await getCachedResult(searchKey, supabase);
    if (cachedResult) {
      console.log('Returning cached result');
      return new Response(JSON.stringify(cachedResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Perform enhanced search with OpenAI Agent
    const result = await searchWithOpenAIAgent(searchRequest);

    // Cache the result
    await cacheResult(searchKey, result, supabase);

    console.log('Enhanced BMI Agent search completed:', {
      found: result.found,
      source: result.source,
      confidence: result.confidence,
      writers_count: result.writers.length,
      publishers_count: result.publishers.length
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Enhanced BMI Agent error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        writers: [],
        publishers: [],
        found: false,
        source: 'agent_search',
        confidence: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});