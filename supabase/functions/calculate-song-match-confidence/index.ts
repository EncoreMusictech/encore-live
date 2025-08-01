import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SongMatchRequest {
  songTitle: string;
  artist: string;
  iswc?: string;
  copyrights: Array<{
    id: string;
    work_title: string;
    iswc?: string;
    akas?: string[];
    copyright_writers?: Array<{
      writer_name: string;
      ownership_percentage: number;
      writer_role: string;
    }>;
  }>;
  useAI?: boolean;
}

interface MatchResult {
  copyrightId: string;
  confidence: number;
  factors: {
    titleSimilarity: number;
    artistSimilarity: number;
    iswcMatch: boolean;
    akaMatch: boolean;
    writerMatch: boolean;
    aiSemanticScore?: number;
  };
  matchType: 'exact' | 'high' | 'medium' | 'low';
  reasoning?: string;
}

function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const str1 = s1.toLowerCase();
  const str2 = s2.toLowerCase();

  const matchWindow = Math.max(str1.length, str2.length) / 2 - 1;
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
  
  let prefix = 0;
  for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return jaro + (0.1 * prefix * (1 - jaro));
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getAISemanticScore(songTitle: string, workTitle: string, artist: string, writers: string[]): Promise<{ score: number; reasoning: string }> {
  if (!openAIApiKey) {
    return { score: 0, reasoning: 'AI analysis not available' };
  }

  try {
    const prompt = `You are a music industry expert analyzing song matches. Compare these two songs and determine if they are likely the same work:

Song from Import:
- Title: "${songTitle}"
- Artist/Writer: "${artist}"

Catalog Work:
- Title: "${workTitle}"
- Writers: ${writers.join(', ')}

Consider:
1. Title variations (remixes, feat., vs., etc.)
2. Writer name variations (stage names, real names, collaborations)
3. Common music industry naming patterns
4. Abbreviations and alternate spellings

Respond with a JSON object containing:
- "confidence": A number between 0 and 1 (where 1 is absolutely certain they're the same song)
- "reasoning": Brief explanation of your assessment (max 100 words)

Be conservative - only high scores (0.8+) for clear matches.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a music industry expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    try {
      const result = JSON.parse(content);
      return {
        score: Math.max(0, Math.min(1, parseFloat(result.confidence) || 0)),
        reasoning: result.reasoning || 'AI analysis completed'
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return { score: 0, reasoning: 'AI analysis failed to parse' };
    }
  } catch (error) {
    console.error('AI semantic analysis error:', error);
    return { score: 0, reasoning: 'AI analysis error' };
  }
}

function calculateBasicConfidence(
  songTitle: string,
  artist: string,
  iswc: string | undefined,
  copyright: any
): { confidence: number; factors: any } {
  const normalizedSongTitle = normalizeString(songTitle);
  const normalizedWorkTitle = normalizeString(copyright.work_title);
  const normalizedArtist = normalizeString(artist);

  const titleSimilarity = jaroWinklerSimilarity(normalizedSongTitle, normalizedWorkTitle);

  let akaMatch = false;
  if (copyright.akas && Array.isArray(copyright.akas)) {
    akaMatch = copyright.akas.some((aka: string) => 
      jaroWinklerSimilarity(normalizedSongTitle, normalizeString(aka)) > 0.9
    );
  }

  const iswcMatch = !!(iswc && copyright.iswc && iswc === copyright.iswc);

  let artistSimilarity = 0;
  let writerMatch = false;
  
  if (copyright.copyright_writers && copyright.copyright_writers.length > 0) {
    const writerNames = copyright.copyright_writers.map((w: any) => normalizeString(w.writer_name));
    
    writerMatch = writerNames.some((writerName: string) => 
      jaroWinklerSimilarity(normalizedArtist, writerName) > 0.8
    );
    
    artistSimilarity = Math.max(
      ...writerNames.map((writerName: string) => 
        jaroWinklerSimilarity(normalizedArtist, writerName)
      )
    );
  }

  const factors = {
    titleSimilarity,
    artistSimilarity,
    iswcMatch,
    akaMatch,
    writerMatch
  };

  let score = 0;
  score += titleSimilarity * 0.4;
  score += artistSimilarity * 0.25;
  if (iswcMatch) score += 0.2;
  if (akaMatch) score += 0.1;
  if (writerMatch) score += 0.05;

  return {
    confidence: Math.min(score, 1.0),
    factors
  };
}

function getMatchType(confidence: number): 'exact' | 'high' | 'medium' | 'low' {
  if (confidence >= 0.95) return 'exact';
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { songTitle, artist, iswc, copyrights, useAI = false }: SongMatchRequest = await req.json();

    if (!songTitle || !copyrights || copyrights.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: songTitle and copyrights' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: MatchResult[] = [];

    for (const copyright of copyrights) {
      const basic = calculateBasicConfidence(songTitle, artist, iswc, copyright);
      
      let finalConfidence = basic.confidence;
      let aiSemanticScore: number | undefined;
      let reasoning: string | undefined;

      // Use AI enhancement if requested and confidence is in the uncertain range
      if (useAI && basic.confidence > 0.3 && basic.confidence < 0.9) {
        const writerNames = copyright.copyright_writers?.map((w: any) => w.writer_name) || [];
        const aiResult = await getAISemanticScore(songTitle, copyright.work_title, artist, writerNames);
        
        aiSemanticScore = aiResult.score;
        reasoning = aiResult.reasoning;
        
        // Blend AI score with basic confidence (70% basic, 30% AI)
        finalConfidence = (basic.confidence * 0.7) + (aiSemanticScore * 0.3);
        finalConfidence = Math.min(finalConfidence, 1.0);
      }

      results.push({
        copyrightId: copyright.id,
        confidence: Math.round(finalConfidence * 100) / 100, // Round to 2 decimal places
        factors: {
          ...basic.factors,
          aiSemanticScore
        },
        matchType: getMatchType(finalConfidence),
        reasoning
      });
    }

    // Sort by confidence descending
    results.sort((a, b) => b.confidence - a.confidence);

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in calculate-song-match-confidence:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});