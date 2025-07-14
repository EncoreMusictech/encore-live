import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ASCAPSearchParams {
  workTitle?: string;
  writerName?: string;
  publisherName?: string;
}

interface ASCAPResult {
  writers: Array<{
    name: string;
    ipi?: string;
    share?: number;
    role?: string;
  }>;
  publishers: Array<{
    name: string;
    share?: number;
  }>;
  iswc?: string;
  found: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workTitle, writerName, publisherName }: ASCAPSearchParams = await req.json();

    if (!workTitle && !writerName && !publisherName) {
      return new Response(
        JSON.stringify({ error: 'At least one search parameter required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching ASCAP for:', { workTitle, writerName, publisherName });

    // Construct search query for ASCAP
    let searchQuery = 'Search the ASCAP Repertory database at https://www.ascap.com/repertory for ';
    
    if (workTitle) searchQuery += `work title: "${workTitle}" `;
    if (writerName) searchQuery += `writer: "${writerName}" `;
    if (publisherName) searchQuery += `publisher: "${publisherName}" `;
    
    searchQuery += `. Extract the following information if found: writer names with IPI numbers and ownership percentages, publisher names with ownership percentages, and ISWC code. Format the response as structured data with exact percentages and IPI numbers as they appear in ASCAP.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction specialist. When searching ASCAP Repertory, extract exact writer and publisher information including IPI numbers and ownership percentages. Return data in a structured JSON format. If no exact matches are found, indicate that clearly.'
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        search_domain_filter: ['ascap.com'],
        search_recency_filter: 'year',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;

    console.log('Perplexity response:', extractedText);

    // Parse the response to extract structured data
    const result: ASCAPResult = {
      writers: [],
      publishers: [],
      found: false
    };

    // Simple pattern matching to extract information
    // This is a basic implementation - in production, you'd want more sophisticated parsing
    const lines = extractedText.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('writer') || lowerLine.includes('composer') || lowerLine.includes('lyricist')) {
        // Extract writer information
        const ipiMatch = line.match(/IPI[:\s]*(\d+)/i);
        const shareMatch = line.match(/(\d+(?:\.\d+)?)%/);
        const nameMatch = line.match(/([A-Z][A-Z\s]+)/);
        
        if (nameMatch) {
          result.writers.push({
            name: nameMatch[1].trim(),
            ipi: ipiMatch ? ipiMatch[1] : undefined,
            share: shareMatch ? parseFloat(shareMatch[1]) : undefined,
            role: lowerLine.includes('composer') ? 'composer' : lowerLine.includes('lyricist') ? 'lyricist' : 'writer'
          });
          result.found = true;
        }
      }
      
      if (lowerLine.includes('publisher')) {
        // Extract publisher information
        const shareMatch = line.match(/(\d+(?:\.\d+)?)%/);
        const nameMatch = line.match(/([A-Z][A-Z\s&]+)/);
        
        if (nameMatch) {
          result.publishers.push({
            name: nameMatch[1].trim(),
            share: shareMatch ? parseFloat(shareMatch[1]) : undefined
          });
          result.found = true;
        }
      }
      
      if (lowerLine.includes('iswc')) {
        const iswcMatch = line.match(/ISWC[:\s]*([T-]\d+[-\d]+)/i);
        if (iswcMatch) {
          result.iswc = iswcMatch[1];
          result.found = true;
        }
      }
    }

    // If no structured data was found, check if the response indicates no results
    if (!result.found) {
      const noResultsIndicators = [
        'no results found',
        'not found',
        'no matches',
        'no information available',
        'could not find'
      ];
      
      const hasNoResults = noResultsIndicators.some(indicator => 
        extractedText.toLowerCase().includes(indicator)
      );
      
      if (!hasNoResults && extractedText.length > 100) {
        // If we have substantial content but couldn't parse it, still mark as found
        result.found = true;
      }
    }

    return new Response(JSON.stringify({
      ...result,
      rawResponse: extractedText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ASCAP lookup:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      found: false,
      writers: [],
      publishers: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});