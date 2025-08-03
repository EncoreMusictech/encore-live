import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BMISearchParams {
  workTitle?: string;
  writerName?: string;
  publisherName?: string;
}

interface BMIResult {
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
    console.log('BMI lookup function called');
    
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { workTitle, writerName, publisherName }: BMISearchParams = await req.json();

    if (!workTitle && !writerName && !publisherName) {
      return new Response(
        JSON.stringify({ error: 'At least one search parameter required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching BMI for:', { workTitle, writerName, publisherName });

    // Construct search query for BMI
    let searchQuery = 'Search the BMI Repertoire database at https://repertoire.bmi.com for ';
    
    if (workTitle) searchQuery += `work title: "${workTitle}" `;
    if (writerName) searchQuery += `writer: "${writerName}" `;
    if (publisherName) searchQuery += `publisher: "${publisherName}" `;
    
    searchQuery += `. Extract the following information if found: writer names with IPI numbers and ownership percentages, publisher names with ownership percentages, and ISWC code. Return the data in a structured JSON format with exact percentages and IPI numbers as they appear in BMI. If no exact matches are found, indicate that clearly.`;

    console.log('Making OpenAI API call with query:', searchQuery);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a data extraction specialist with access to real-time web search capabilities. When searching BMI Repertoire at https://repertoire.bmi.com, extract exact writer and publisher information including IPI numbers and ownership percentages. 

Return data in this exact JSON format:
{
  "writers": [{"name": "string", "ipi": "string", "share": number, "role": "string"}],
  "publishers": [{"name": "string", "share": number}],
  "iswc": "string",
  "found": boolean
}

If no exact matches are found, return found: false with empty arrays.`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;

    console.log('OpenAI response:', extractedText);

    // Try to parse JSON response first
    let result: BMIResult;
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (jsonError) {
      console.log('Failed to parse JSON, falling back to text parsing');
      
      // Fallback to pattern matching if JSON parsing fails
      result = {
        writers: [],
        publishers: [],
        found: false
      };

      const lines = extractedText.split('\n');
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('writer') || lowerLine.includes('composer') || lowerLine.includes('lyricist')) {
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
    }

    return new Response(JSON.stringify({
      ...result,
      rawResponse: extractedText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in BMI lookup:', error);
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