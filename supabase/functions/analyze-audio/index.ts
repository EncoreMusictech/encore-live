import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, filename, userId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Starting audio analysis for:', filename);

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Extract basic metadata from filename
    const basicMetadata = extractMetadataFromFilename(filename);
    
    // Analyze audio characteristics using AI
    const aiAnalysis = await analyzeAudioWithAI(filename, basicMetadata);

    // Create track tags record
    const { data: trackTag, error: insertError } = await supabase
      .from('track_tags')
      .insert({
        user_id: userId,
        file_url: fileUrl,
        filename: filename,
        title: basicMetadata.title,
        artist: basicMetadata.artist,
        genre: basicMetadata.genre,
        
        // AI-analyzed tags
        mood_emotion: aiAnalysis.moodEmotion,
        energy_level: aiAnalysis.energyLevel,
        genre_subgenre: aiAnalysis.genreSubgenre,
        scene_use_case: aiAnalysis.sceneUseCase,
        vocal_type: aiAnalysis.vocalType,
        instrumentation: aiAnalysis.instrumentation,
        structure_tags: aiAnalysis.structureTags,
        lyrical_themes: aiAnalysis.lyricalThemes,
        
        analysis_status: 'completed',
        analysis_confidence: aiAnalysis.confidence
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting track tags:', insertError);
      throw insertError;
    }

    console.log('Audio analysis completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      trackTag,
      analysis: aiAnalysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in audio analysis:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractMetadataFromFilename(filename: string) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // Common patterns: "Artist - Title", "Title by Artist", etc.
  let artist = null;
  let title = nameWithoutExt;
  let genre = null;

  // Try to extract artist and title from common patterns
  if (nameWithoutExt.includes(' - ')) {
    const parts = nameWithoutExt.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts[1].trim();
    }
  } else if (nameWithoutExt.includes(' by ')) {
    const parts = nameWithoutExt.split(' by ');
    if (parts.length >= 2) {
      title = parts[0].trim();
      artist = parts[1].trim();
    }
  }

  // Try to extract genre from parentheses or brackets
  const genreMatch = nameWithoutExt.match(/[\(\[]([^)]+)[\)\]]/);
  if (genreMatch) {
    genre = genreMatch[1];
  }

  return { artist, title, genre };
}

async function analyzeAudioWithAI(filename: string, basicMetadata: any) {
  const prompt = `Analyze this audio track based on the filename "${filename}" and extracted metadata:
${basicMetadata.artist ? `Artist: ${basicMetadata.artist}` : ''}
${basicMetadata.title ? `Title: ${basicMetadata.title}` : ''}
${basicMetadata.genre ? `Genre: ${basicMetadata.genre}` : ''}

Please provide a detailed analysis for sync licensing purposes in this exact JSON format:
{
  "moodEmotion": ["array of 1-3 mood/emotion tags like: Uplifting, Dark, Suspenseful, Romantic, Energetic, Melancholic, Triumphant, Mysterious"],
  "energyLevel": "single energy level: High Energy, Medium Energy, Low Energy, or Chill",
  "genreSubgenre": ["array of 1-2 specific genre/subgenre tags like: Trap Soul, Indie Pop, Alternative Rock, Electronic Dance, Acoustic Folk"],
  "sceneUseCase": ["array of 1-3 scene use cases like: Montage, Fight Scene, Romance, Chase Scene, Emotional Moment, Party Scene, Workout, Study"],
  "vocalType": "single vocal type: Male Vocal, Female Vocal, Choir, Instrumental Only, or Mixed Vocals",
  "instrumentation": ["array of 1-4 key instruments like: Piano-Driven, 808s, Electric Guitar, Strings, Synthesizer, Acoustic Guitar, Drums"],
  "structureTags": ["array of 1-2 structure tags like: Clean Ending, Loopable, Build-Up, Drop, Fade Out"],
  "lyricalThemes": ["array of 0-3 lyrical themes like: Empowerment, Love, Rebellion, Success, Heartbreak, Freedom, Unity"],
  "confidence": 0.85
}

Be specific and accurate. Focus on characteristics that would be valuable for sync licensing in film, TV, and advertising.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert music supervisor and audio analyst specializing in sync licensing. Provide accurate, detailed analysis for music placement in media.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate and set defaults
    return {
      moodEmotion: Array.isArray(analysis.moodEmotion) ? analysis.moodEmotion : ['Neutral'],
      energyLevel: analysis.energyLevel || 'Medium Energy',
      genreSubgenre: Array.isArray(analysis.genreSubgenre) ? analysis.genreSubgenre : ['Unknown'],
      sceneUseCase: Array.isArray(analysis.sceneUseCase) ? analysis.sceneUseCase : ['General Use'],
      vocalType: analysis.vocalType || 'Unknown',
      instrumentation: Array.isArray(analysis.instrumentation) ? analysis.instrumentation : ['Mixed'],
      structureTags: Array.isArray(analysis.structureTags) ? analysis.structureTags : ['Standard'],
      lyricalThemes: Array.isArray(analysis.lyricalThemes) ? analysis.lyricalThemes : [],
      confidence: analysis.confidence || 0.7
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    // Return default analysis if AI fails
    return {
      moodEmotion: ['Neutral'],
      energyLevel: 'Medium Energy',
      genreSubgenre: ['Unknown'],
      sceneUseCase: ['General Use'],
      vocalType: 'Unknown',
      instrumentation: ['Mixed'],
      structureTags: ['Standard'],
      lyricalThemes: [],
      confidence: 0.5
    };
  }
}