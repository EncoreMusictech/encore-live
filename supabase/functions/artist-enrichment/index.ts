import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtistEnrichmentResult {
  artistName: string;
  imageUrl: string | null;
  biography: string | null;
  topTracks: Array<{
    name: string;
    popularity: number;
    spotifyUrl?: string;
  }>;
  recentSyncs: Array<{
    title: string;
    placement: string;
    year?: number;
  }>;
  recentPerformances: Array<{
    event: string;
    date?: string;
    location?: string;
  }>;
  spotifyFollowers?: number;
  monthlyListeners?: number;
  genres: string[];
}

// Get Spotify access token
async function getSpotifyToken(): Promise<string | null> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.error('Missing Spotify credentials');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      console.error('Spotify token error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Spotify token fetch error:', error);
    return null;
  }
}

// Search and get Spotify artist data
async function getSpotifyArtistData(artistName: string, token: string): Promise<{
  id: string;
  name: string;
  imageUrl: string | null;
  followers: number;
  genres: string[];
  topTracks: Array<{ name: string; popularity: number; spotifyUrl?: string }>;
} | null> {
  try {
    // Search for artist
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=5`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!searchResponse.ok) {
      console.error('Spotify search error:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    const artists = searchData.artists?.items || [];
    
    if (artists.length === 0) {
      console.log(`No Spotify artist found for: ${artistName}`);
      return null;
    }

    // Find best match (case-insensitive)
    const artist = artists.find((a: any) => 
      a.name.toLowerCase() === artistName.toLowerCase()
    ) || artists[0];

    console.log(`Found Spotify artist: ${artist.name} (ID: ${artist.id})`);

    // Get top tracks
    const topTracksUrl = `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`;
    const topTracksResponse = await fetch(topTracksUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    let topTracks: Array<{ name: string; popularity: number; spotifyUrl?: string }> = [];
    if (topTracksResponse.ok) {
      const topTracksData = await topTracksResponse.json();
      topTracks = (topTracksData.tracks || []).slice(0, 5).map((track: any) => ({
        name: track.name,
        popularity: track.popularity,
        spotifyUrl: track.external_urls?.spotify,
      }));
    }

    return {
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url || null,
      followers: artist.followers?.total || 0,
      genres: artist.genres || [],
      topTracks,
    };
  } catch (error) {
    console.error('Spotify artist fetch error:', error);
    return null;
  }
}

// Use Perplexity to get recent syncs and performances
async function getArtistContext(artistName: string): Promise<{
  biography: string | null;
  recentSyncs: Array<{ title: string; placement: string; year?: number }>;
  recentPerformances: Array<{ event: string; date?: string; location?: string }>;
}> {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityKey) {
    console.log('No Perplexity API key, skipping context enrichment');
    return { biography: null, recentSyncs: [], recentPerformances: [] };
  }

  try {
    const prompt = `For the music artist "${artistName}", provide:
1. A brief 2-3 sentence biography focusing on their music career and notable achievements.
2. A list of up to 3 notable sync placements (songs used in TV shows, movies, commercials, or video games) in the last 5 years.
3. A list of up to 3 notable recent live performances or tours.

Format your response as JSON with this exact structure:
{
  "biography": "Brief 2-3 sentence bio here",
  "syncs": [
    {"title": "Song Name", "placement": "Show/Movie Name (Year)", "year": 2024}
  ],
  "performances": [
    {"event": "Festival or Tour Name", "date": "Month Year", "location": "City/Venue"}
  ]
}

If you cannot find specific sync or performance information, return empty arrays for those fields. Only include verified, factual information.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a music industry research assistant. Provide accurate, factual information about artists. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return { biography: null, recentSyncs: [], recentPerformances: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('Perplexity response:', content.substring(0, 200));

    // Parse JSON from response
    try {
      // Extract JSON from potential markdown code blocks
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const parsed = JSON.parse(jsonStr.trim());
      
      return {
        biography: parsed.biography || null,
        recentSyncs: (parsed.syncs || []).map((s: any) => ({
          title: s.title || s.song || '',
          placement: s.placement || s.show || s.movie || '',
          year: s.year,
        })),
        recentPerformances: (parsed.performances || []).map((p: any) => ({
          event: p.event || p.name || '',
          date: p.date,
          location: p.location || p.venue,
        })),
      };
    } catch (parseError) {
      console.error('Failed to parse Perplexity response as JSON:', parseError);
      
      // Try to extract biography from plain text
      const bioMatch = content.match(/biography['":\s]+([^"]+)/i);
      return {
        biography: bioMatch ? bioMatch[1].trim() : content.substring(0, 300),
        recentSyncs: [],
        recentPerformances: [],
      };
    }
  } catch (error) {
    console.error('Perplexity fetch error:', error);
    return { biography: null, recentSyncs: [], recentPerformances: [] };
  }
}

// Get Chartmetric data if available
async function getChartmetricData(artistName: string): Promise<{
  monthlyListeners?: number;
  additionalSyncs?: Array<{ title: string; placement: string }>;
} | null> {
  const chartmetricKey = Deno.env.get('CHARTMETRIC_API_KEY');
  
  if (!chartmetricKey) {
    console.log('No Chartmetric API key');
    return null;
  }

  try {
    // Get access token
    const tokenResponse = await fetch('https://api.chartmetric.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshtoken: chartmetricKey }),
    });

    if (!tokenResponse.ok) {
      console.error('Chartmetric token error:', tokenResponse.status);
      return null;
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.token;

    // Search for artist
    const searchUrl = `https://api.chartmetric.com/api/search?q=${encodeURIComponent(artistName)}&type=artists&limit=3`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!searchResponse.ok) {
      console.error('Chartmetric search error:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    const artists = searchData.obj?.artists || [];
    
    if (artists.length === 0) {
      return null;
    }

    const artist = artists[0];
    const artistId = artist.id;

    // Get Spotify stats for monthly listeners
    const statsUrl = `https://api.chartmetric.com/api/artist/${artistId}/stat/spotify`;
    const statsResponse = await fetch(statsUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    let monthlyListeners: number | undefined;
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      monthlyListeners = statsData.obj?.monthly_listeners;
    }

    return { monthlyListeners };
  } catch (error) {
    console.error('Chartmetric fetch error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName } = await req.json();

    if (!artistName) {
      return new Response(
        JSON.stringify({ success: false, error: 'artistName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Enriching artist data for: ${artistName}`);

    // Fetch data from all sources in parallel
    const spotifyToken = await getSpotifyToken();
    
    const [spotifyData, contextData, chartmetricData] = await Promise.all([
      spotifyToken ? getSpotifyArtistData(artistName, spotifyToken) : null,
      getArtistContext(artistName),
      getChartmetricData(artistName),
    ]);

    const result: ArtistEnrichmentResult = {
      artistName: spotifyData?.name || artistName,
      imageUrl: spotifyData?.imageUrl || null,
      biography: contextData.biography,
      topTracks: spotifyData?.topTracks || [],
      recentSyncs: contextData.recentSyncs,
      recentPerformances: contextData.recentPerformances,
      spotifyFollowers: spotifyData?.followers,
      monthlyListeners: chartmetricData?.monthlyListeners,
      genres: spotifyData?.genres || [],
    };

    console.log(`Enrichment complete for ${artistName}: image=${!!result.imageUrl}, tracks=${result.topTracks.length}, syncs=${result.recentSyncs.length}`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Artist enrichment error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
