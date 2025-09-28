import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; script-src 'none'",
};

const supabaseUrl = "https://plxsenykjisqutxcvjeg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseHNlbnlramlzcXV0eGN2amVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTQ5OTcsImV4cCI6MjA2ODA3MDk5N30.f-luEprJjlx1sN-siFWgAKlHJ3c1aewKxPqwxIb9gtA";

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  release_date?: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  popularity?: number;
  external_urls: {
    spotify: string;
  };
  tracks?: {
    items: SpotifyTrack[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const body = await req.json();
    const { artistId, artistName } = body;

    // Input validation and sanitization
    if (!artistId || typeof artistId !== 'string' || artistId.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid Artist ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!artistName || typeof artistName !== 'string' || artistName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid Artist name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs - prevent injection attacks
    const sanitizedArtistId = artistId.trim().replace(/[^a-zA-Z0-9]/g, '');
    const sanitizedArtistName = artistName.trim().substring(0, 200); // Limit length

    if (sanitizedArtistId.length === 0 || sanitizedArtistId.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid Artist ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching discography for artist: ${artistName} (${artistId})`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we have cached discography data (less than 24 hours old)
    const { data: cachedData } = await supabase
      .from('artist_discography')
      .select('*')
      .eq('artist_id', artistId)
      .gte('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours
      .single();

    if (cachedData) {
      console.log(`Using cached discography data for ${artistName}`);
      return new Response(JSON.stringify({
        artist_id: artistId,
        artist_name: artistName,
        albums: cachedData.albums,
        singles: cachedData.singles,
        cached: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Spotify access token
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const tokenData: SpotifyTokenResponse = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch artist's albums
    console.log(`Fetching albums for artist ${artistId}`);
    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!albumsResponse.ok) {
      throw new Error('Failed to fetch artist albums');
    }

    const albumsData = await albumsResponse.json();
    console.log(`Found ${albumsData.items?.length || 0} releases`);

    // Process albums and singles
    const albums: SpotifyAlbum[] = [];
    const singles: SpotifyAlbum[] = [];

    for (const release of albumsData.items || []) {
      // Get album details including tracks
      const albumDetailsResponse = await fetch(
        `https://api.spotify.com/v1/albums/${release.id}?market=US`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (albumDetailsResponse.ok) {
        const albumDetails = await albumDetailsResponse.json();
        
        const processedAlbum: SpotifyAlbum = {
          id: albumDetails.id,
          name: albumDetails.name,
          release_date: albumDetails.release_date,
          total_tracks: albumDetails.total_tracks,
          popularity: albumDetails.popularity,
          external_urls: albumDetails.external_urls,
          tracks: {
            items: albumDetails.tracks.items.map((track: any) => ({
              id: track.id,
              name: track.name,
              popularity: track.popularity || 50, // Default if not available
              duration_ms: track.duration_ms,
              external_urls: track.external_urls
            }))
          }
        };

        // Categorize as album or single based on track count and album type
        if (release.album_group === 'single' || albumDetails.total_tracks <= 3) {
          singles.push(processedAlbum);
        } else {
          albums.push(processedAlbum);
        }
      }

      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Processed ${albums.length} albums and ${singles.length} singles`);

    // Cache the results
    const discographyData = {
      artist_id: artistId,
      artist_name: artistName,
      albums: albums,
      singles: singles
    };

    await supabase
      .from('artist_discography')
      .upsert({
        artist_id: artistId,
        artist_name: artistName,
        albums: albums,
        singles: singles,
        last_updated: new Date().toISOString()
      });

    console.log(`Cached discography data for ${artistName}`);

    return new Response(
      JSON.stringify({
        ...discographyData,
        cached: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error in artist-discography function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});