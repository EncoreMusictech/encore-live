import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  followers: {
    total: number;
  };
  genres: string[];
  popularity: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  external_urls: {
    spotify: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName } = await req.json();

    if (!artistName) {
      throw new Error('Artist name is required');
    }

    console.log(`Searching for artist: ${artistName}`);

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

    // Search for the artist
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Failed to search for artist');
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.artists?.items?.length) {
      throw new Error('Artist not found');
    }

    const artist: SpotifyArtist = searchData.artists.items[0];
    console.log(`Found artist: ${artist.name} with ${artist.followers.total} followers`);

    // Get artist's top tracks
    const topTracksResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!topTracksResponse.ok) {
      throw new Error('Failed to get top tracks');
    }

    const topTracksData = await topTracksResponse.json();
    const topTracks: SpotifyTrack[] = topTracksData.tracks.slice(0, 10);

    // Calculate estimated streams based on popularity and followers
    // This is a simplified calculation for demo purposes
    const estimatedTotalStreams = Math.floor(
      (artist.followers.total * artist.popularity * 2.5) + 
      topTracks.reduce((acc, track) => acc + (track.popularity * 50000), 0)
    );

    // Calculate estimated valuation (simplified formula)
    // Real valuation would consider many more factors
    const estimatedValuation = Math.floor(estimatedTotalStreams * 0.003); // $0.003 per stream

    const valuationData = {
      artist_name: artist.name,
      total_streams: estimatedTotalStreams,
      monthly_listeners: artist.followers.total,
      top_tracks: topTracks.map(track => ({
        name: track.name,
        popularity: track.popularity,
        spotify_url: track.external_urls.spotify
      })),
      valuation_amount: estimatedValuation,
      currency: 'USD',
      spotify_data: {
        artist_id: artist.id,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total
      }
    };

    console.log(`Calculated valuation: $${estimatedValuation} for ${estimatedTotalStreams} streams`);

    return new Response(
      JSON.stringify(valuationData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in spotify-catalog-valuation function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});