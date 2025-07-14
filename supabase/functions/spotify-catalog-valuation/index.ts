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

    // Calculate growth rates and forecasts
    const baseGrowthRate = Math.max(0.05, Math.min(0.25, artist.popularity / 400)); // 5-25% based on popularity
    const industryGrowthRate = 0.08; // 8% industry average
    const streamGrowthRate = (baseGrowthRate + industryGrowthRate) / 2;

    // Scenario analysis
    const scenarios = {
      pessimistic: {
        growthRate: streamGrowthRate * 0.5, // 50% of base growth
        multipleRange: { min: 10, max: 15 }
      },
      base: {
        growthRate: streamGrowthRate,
        multipleRange: { min: 15, max: 25 }
      },
      optimistic: {
        growthRate: streamGrowthRate * 1.5, // 150% of base growth
        multipleRange: { min: 25, max: 35 }
      }
    };

    // Calculate forecasts for each scenario
    const forecasts = {};
    const valuations = {};
    
    Object.entries(scenarios).forEach(([scenario, { growthRate, multipleRange }]) => {
      const yearlyForecasts = [];
      let currentStreams = estimatedTotalStreams;
      
      for (let year = 1; year <= 5; year++) {
        currentStreams = Math.floor(currentStreams * (1 + growthRate));
        const revenue = currentStreams * 0.003; // $0.003 per stream
        const valuation = revenue * ((multipleRange.min + multipleRange.max) / 2);
        
        yearlyForecasts.push({
          year,
          streams: currentStreams,
          revenue: Math.floor(revenue),
          valuation: Math.floor(valuation)
        });
      }
      
      forecasts[scenario] = yearlyForecasts;
      valuations[scenario] = {
        current: Math.floor(estimatedTotalStreams * 0.003 * ((multipleRange.min + multipleRange.max) / 2)),
        year5: yearlyForecasts[4].valuation,
        cagr: ((Math.pow(yearlyForecasts[4].valuation / (estimatedTotalStreams * 0.003 * ((multipleRange.min + multipleRange.max) / 2)), 1/5) - 1) * 100).toFixed(1)
      };
    });

    // Calculate fair market value range
    const fairMarketValue = {
      low: valuations.pessimistic.current,
      mid: valuations.base.current,
      high: valuations.optimistic.current
    };

    // Find comparable artists using Spotify's related artists API
    const relatedArtistsResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artist.id}/related-artists`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let comparableArtists = [];
    
    if (relatedArtistsResponse.ok) {
      const relatedData = await relatedArtistsResponse.json();
      console.log(`Found ${relatedData.artists.length} related artists`);
      
      // Take top 3 most popular related artists and calculate their valuations
      const topRelatedArtists = relatedData.artists
        .sort((a: SpotifyArtist, b: SpotifyArtist) => b.popularity - a.popularity)
        .slice(0, 3);
      
      comparableArtists = topRelatedArtists.map((relatedArtist: SpotifyArtist) => {
        // Calculate estimated streams for related artist using same methodology
        const relatedEstimatedStreams = Math.floor(
          (relatedArtist.followers.total * relatedArtist.popularity * 2.5)
        );
        
        // Calculate valuation using base case scenario
        const relatedValuation = Math.floor(
          relatedEstimatedStreams * 0.003 * scenarios.base.multipleRange.min
        );
        
        return {
          name: relatedArtist.name,
          valuation: relatedValuation,
          followers: relatedArtist.followers.total,
          popularity: relatedArtist.popularity,
          genres: relatedArtist.genres,
          spotify_id: relatedArtist.id
        };
      });
    } else {
      console.log('Could not fetch related artists, using fallback data');
      // Fallback to placeholder data if API call fails
      comparableArtists = [
        { name: "Similar Artist 1", valuation: fairMarketValue.mid * 0.8, followers: artist.followers.total * 0.9, popularity: artist.popularity - 5 },
        { name: "Similar Artist 2", valuation: fairMarketValue.mid * 1.2, followers: artist.followers.total * 1.1, popularity: artist.popularity + 3 },
        { name: "Similar Artist 3", valuation: fairMarketValue.mid * 0.95, followers: artist.followers.total * 0.85, popularity: artist.popularity - 2 }
      ];
    }

    const valuationData = {
      artist_name: artist.name,
      total_streams: estimatedTotalStreams,
      monthly_listeners: artist.followers.total,
      top_tracks: topTracks.map(track => ({
        name: track.name,
        popularity: track.popularity,
        spotify_url: track.external_urls.spotify
      })),
      valuation_amount: fairMarketValue.mid,
      currency: 'USD',
      spotify_data: {
        artist_id: artist.id,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total
      },
      forecasts,
      valuations,
      fair_market_value: fairMarketValue,
      comparable_artists: comparableArtists,
      growth_metrics: {
        estimated_cagr: streamGrowthRate * 100,
        industry_growth: industryGrowthRate * 100,
        base_multiple: (scenarios.base.multipleRange.min + scenarios.base.multipleRange.max) / 2
      }
    };

    console.log(`Calculated valuation range: $${fairMarketValue.low} - $${fairMarketValue.high} (mid: $${fairMarketValue.mid})`);

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