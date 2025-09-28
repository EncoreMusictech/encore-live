import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; script-src 'none'",
};

interface SpotifyTrackMetadata {
  isrc?: string;
  artist: string;
  duration: number;
  releaseDate: string;
  trackName: string;
  albumName: string;
  label?: string;
  previewUrl?: string;
  popularity?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const body = await req.json();
    const { workTitle, artist } = body;

    // Input validation and sanitization
    if (!workTitle || typeof workTitle !== 'string' || workTitle.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid work title is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitize work title - limit length and prevent malicious input
    const sanitizedWorkTitle = workTitle.trim().substring(0, 200);
    
    if (sanitizedWorkTitle.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Work title cannot be empty' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Searching Spotify for: ${workTitle}${artist ? ` by ${artist}` : ''}`);

    // Get Spotify access token
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    // Get access token using client credentials flow
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get Spotify access token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Build search query - prioritize artist search when artist is provided
    let searchQuery;
    if (artist && artist.trim()) {
      // Artist-first search: find tracks by this artist
      searchQuery = encodeURIComponent(`artist:"${artist.trim()}" track:"${sanitizedWorkTitle}"`);
    } else {
      // Track-first search: find tracks with this title
      searchQuery = encodeURIComponent(`track:"${sanitizedWorkTitle}"`);
    }
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Spotify search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const tracks = searchData.tracks?.items || [];

    console.log(`Found ${tracks.length} tracks for "${workTitle}"`);

    if (tracks.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No tracks found',
          suggestions: []
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process tracks and extract metadata
    const trackMetadata: SpotifyTrackMetadata[] = tracks.map((track: any) => ({
      isrc: track.external_ids?.isrc || undefined,
      artist: track.artists?.map((artist: any) => artist.name).join(', ') || 'Unknown Artist',
      duration: Math.round(track.duration_ms / 1000), // Convert to seconds
      releaseDate: track.album?.release_date || '',
      trackName: track.name,
      albumName: track.album?.name || '',
      label: track.album?.label || 'Unknown Label',
      previewUrl: track.preview_url || undefined,
      popularity: track.popularity || 0
    }));

    // Return the best match (first result) and alternatives
    const bestMatch = trackMetadata[0];
    const alternatives = trackMetadata.slice(1, 10); // Up to 9 alternatives

    console.log(`Best match for "${workTitle}": ${bestMatch.trackName} by ${bestMatch.artist}`);

    return new Response(
      JSON.stringify({
        success: true,
        bestMatch,
        alternatives,
        totalFound: tracks.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in spotify-track-metadata function:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Internal server error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});