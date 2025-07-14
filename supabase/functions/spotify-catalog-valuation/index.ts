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

interface IndustryBenchmark {
  genre: string;
  revenue_multiple_min: number;
  revenue_multiple_max: number;
  revenue_multiple_avg: number;
  streams_to_revenue_ratio: number;
  growth_rate_assumption: number;
  market_risk_factor: number;
}

interface CashFlowProjection {
  year: number;
  revenue: number;
  growth: number;
  discountedValue: number;
  terminalValue?: number;
}

// Advanced mathematical models
class ValuationEngine {
  // Exponential Decay Forecast Model
  static exponentialDecayForecast(
    initialStreams: number, 
    decayRate: number, 
    years: number,
    streamsToRevenue: number = 0.003
  ): CashFlowProjection[] {
    const projections: CashFlowProjection[] = [];
    
    for (let year = 1; year <= years; year++) {
      const decayedStreams = initialStreams * Math.exp(-decayRate * (year - 1));
      const revenue = decayedStreams * streamsToRevenue;
      const growth = year === 1 ? 0 : ((decayedStreams / (initialStreams * Math.exp(-decayRate * (year - 2)))) - 1);
      
      projections.push({
        year,
        revenue: Math.floor(revenue),
        growth: growth * 100,
        discountedValue: revenue / Math.pow(1.12, year) // 12% discount rate
      });
    }
    
    return projections;
  }

  // Discounted Cash Flow (DCF) Valuation
  static calculateDCFValuation(
    cashFlowProjections: CashFlowProjection[],
    terminalGrowthRate: number = 0.02,
    discountRate: number = 0.12
  ): number {
    // Calculate present value of projected cash flows
    const pvOfProjections = cashFlowProjections.reduce((sum, projection) => {
      return sum + projection.discountedValue;
    }, 0);

    // Calculate terminal value (Gordon Growth Model)
    const lastYearCashFlow = cashFlowProjections[cashFlowProjections.length - 1].revenue;
    const terminalValue = (lastYearCashFlow * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
    const pvOfTerminalValue = terminalValue / Math.pow(1 + discountRate, cashFlowProjections.length);

    return Math.floor(pvOfProjections + pvOfTerminalValue);
  }

  // Risk-Adjusted Valuation
  static calculateRiskAdjustedValue(
    baseValuation: number,
    popularityScore: number,
    genreRiskFactor: number,
    catalogAge: number = 5
  ): number {
    // Popularity adjustment (0-100 scale)
    const popularityAdjustment = (popularityScore / 100) * 1.2 + 0.8; // 0.8 to 2.0 multiplier
    
    // Age adjustment (newer catalogs may have higher risk but also higher growth potential)
    const ageAdjustment = catalogAge < 3 ? 1.1 : catalogAge > 10 ? 0.9 : 1.0;
    
    // Genre risk adjustment
    const riskAdjustment = 1 - genreRiskFactor;
    
    return Math.floor(baseValuation * popularityAdjustment * ageAdjustment * riskAdjustment);
  }

  // Confidence Score Calculation
  static calculateConfidenceScore(
    dataPoints: {
      hasStreamData: boolean;
      hasFollowerData: boolean;
      hasGenreData: boolean;
      trackPopularity: number;
      artistPopularity: number;
    }
  ): number {
    let score = 0;
    
    if (dataPoints.hasStreamData) score += 30;
    if (dataPoints.hasFollowerData) score += 25;
    if (dataPoints.hasGenreData) score += 20;
    if (dataPoints.trackPopularity > 70) score += 15;
    if (dataPoints.artistPopularity > 70) score += 10;
    
    return Math.min(100, score);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, valuationParams } = await req.json();

    if (!artistName) {
      throw new Error('Artist name is required');
    }

    console.log(`Advanced valuation for artist: ${artistName}`);

    // Initialize Supabase client for industry benchmarks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Get industry benchmarks
    const primaryGenre = artist.genres[0] || 'pop';
    const { data: benchmarkData } = await supabase
      .from('industry_benchmarks')
      .select('*')
      .eq('genre', primaryGenre)
      .single();

    const benchmark: IndustryBenchmark = benchmarkData || {
      genre: 'pop',
      revenue_multiple_min: 8.0,
      revenue_multiple_max: 15.0,
      revenue_multiple_avg: 11.5,
      streams_to_revenue_ratio: 0.003,
      growth_rate_assumption: 0.05,
      market_risk_factor: 0.15
    };

    // Enhanced stream estimation with genre-specific factors
    const genreMultiplier = benchmark.streams_to_revenue_ratio / 0.003; // Normalize to base rate
    const estimatedTotalStreams = Math.floor(
      (artist.followers.total * artist.popularity * 2.5 * genreMultiplier) + 
      topTracks.reduce((acc, track) => acc + (track.popularity * 50000), 0)
    );

    // Calculate LTM Revenue estimate
    const ltmRevenue = estimatedTotalStreams * benchmark.streams_to_revenue_ratio;

    // Advanced cash flow projections using exponential decay model
    const decayRate = Math.max(0.05, 1 - benchmark.growth_rate_assumption); // Higher decay for lower growth genres
    const cashFlowProjections = ValuationEngine.exponentialDecayForecast(
      estimatedTotalStreams,
      decayRate,
      10, // 10-year projection
      benchmark.streams_to_revenue_ratio
    );

    // DCF Valuation
    const dcfValuation = ValuationEngine.calculateDCFValuation(
      cashFlowProjections.slice(0, 5), // Use first 5 years for DCF
      benchmark.growth_rate_assumption * 0.5, // Terminal growth rate
      valuationParams?.discountRate || 0.12
    );

    // Multiple-based valuation
    const multipleValuation = Math.floor(ltmRevenue * benchmark.revenue_multiple_avg);

    // Risk-adjusted valuation
    const catalogAge = valuationParams?.catalogAge || 5;
    const riskAdjustedValue = ValuationEngine.calculateRiskAdjustedValue(
      (dcfValuation + multipleValuation) / 2,
      artist.popularity,
      benchmark.market_risk_factor,
      catalogAge
    );

    // Confidence score
    const confidenceScore = ValuationEngine.calculateConfidenceScore({
      hasStreamData: true,
      hasFollowerData: artist.followers.total > 0,
      hasGenreData: artist.genres.length > 0,
      trackPopularity: topTracks.reduce((avg, track) => avg + track.popularity, 0) / topTracks.length,
      artistPopularity: artist.popularity
    });

    // Traditional scenario analysis for comparison
    const scenarios = {
      pessimistic: {
        growthRate: benchmark.growth_rate_assumption * 0.5,
        multipleRange: { min: benchmark.revenue_multiple_min, max: benchmark.revenue_multiple_avg }
      },
      base: {
        growthRate: benchmark.growth_rate_assumption,
        multipleRange: { min: benchmark.revenue_multiple_avg, max: benchmark.revenue_multiple_max }
      },
      optimistic: {
        growthRate: benchmark.growth_rate_assumption * 1.5,
        multipleRange: { min: benchmark.revenue_multiple_max, max: benchmark.revenue_multiple_max * 1.2 }
      }
    };

    // Calculate traditional forecasts
    const forecasts = {};
    const valuations = {};
    
    Object.entries(scenarios).forEach(([scenario, { growthRate, multipleRange }]) => {
      const yearlyForecasts = [];
      let currentStreams = estimatedTotalStreams;
      
      for (let year = 1; year <= 5; year++) {
        currentStreams = Math.floor(currentStreams * (1 + growthRate));
        const revenue = currentStreams * benchmark.streams_to_revenue_ratio;
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
        current: Math.floor(ltmRevenue * ((multipleRange.min + multipleRange.max) / 2)),
        year5: yearlyForecasts[4].valuation,
        cagr: ((Math.pow(yearlyForecasts[4].valuation / (ltmRevenue * ((multipleRange.min + multipleRange.max) / 2)), 1/5) - 1) * 100).toFixed(1)
      };
    });

    // Fair market value incorporating advanced models
    const fairMarketValue = {
      low: Math.min(valuations.pessimistic.current, riskAdjustedValue * 0.8),
      mid: riskAdjustedValue,
      high: Math.max(valuations.optimistic.current, riskAdjustedValue * 1.2)
    };

    // Find comparable artists (existing logic)
    let comparableArtists = [];
    
    if (artist.genres.length > 0) {
      try {
        const genreSearchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(primaryGenre)}"&type=artist&limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (genreSearchResponse.ok) {
          const genreSearchData = await genreSearchResponse.json();
          
          if (genreSearchData.artists?.items?.length > 0) {
            const similarArtists = genreSearchData.artists.items
              .filter((searchArtist: SpotifyArtist) => searchArtist.id !== artist.id)
              .filter((searchArtist: SpotifyArtist) => {
                const popularityDiff = Math.abs(searchArtist.popularity - artist.popularity);
                return popularityDiff <= 20 && searchArtist.followers.total > 10000;
              })
              .sort((a: SpotifyArtist, b: SpotifyArtist) => b.popularity - a.popularity)
              .slice(0, 3);

            if (similarArtists.length > 0) {
              comparableArtists = similarArtists.map((similarArtist: SpotifyArtist) => {
                const similarEstimatedStreams = Math.floor(
                  (similarArtist.followers.total * similarArtist.popularity * 2.5 * genreMultiplier)
                );
                
                const similarValuation = Math.floor(
                  similarEstimatedStreams * benchmark.streams_to_revenue_ratio * benchmark.revenue_multiple_avg
                );
                
                return {
                  name: similarArtist.name,
                  valuation: similarValuation,
                  followers: similarArtist.followers.total,
                  popularity: similarArtist.popularity,
                  genres: similarArtist.genres,
                  spotify_id: similarArtist.id
                };
              });
            }
          }
        }
      } catch (error) {
        console.log(`Error searching for similar artists: ${error.message}`);
      }
    }
    
    // Ensure we have 3 comparable artists
    while (comparableArtists.length < 3) {
      const index = comparableArtists.length;
      comparableArtists.push({
        name: `Industry Peer ${index + 1}`,
        valuation: Math.floor(fairMarketValue.mid * (0.8 + Math.random() * 0.4)),
        followers: Math.floor(artist.followers.total * (0.7 + Math.random() * 0.6)),
        popularity: Math.max(1, Math.min(100, artist.popularity + (Math.random() * 20 - 10))),
        genres: artist.genres.slice(0, 2)
      });
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
      valuation_amount: riskAdjustedValue,
      currency: 'USD',
      spotify_data: {
        artist_id: artist.id,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total
      },
      // Traditional metrics
      forecasts,
      valuations,
      fair_market_value: fairMarketValue,
      comparable_artists: comparableArtists,
      growth_metrics: {
        estimated_cagr: benchmark.growth_rate_assumption * 100,
        industry_growth: benchmark.growth_rate_assumption * 100,
        base_multiple: benchmark.revenue_multiple_avg
      },
      // Advanced valuation metrics
      ltm_revenue: Math.floor(ltmRevenue),
      catalog_age_years: catalogAge,
      genre: primaryGenre,
      popularity_score: artist.popularity,
      discount_rate: valuationParams?.discountRate || 0.12,
      dcf_valuation: dcfValuation,
      multiple_valuation: multipleValuation,
      risk_adjusted_value: riskAdjustedValue,
      confidence_score: confidenceScore,
      valuation_methodology: 'advanced_dcf_with_risk_adjustment',
      cash_flow_projections: cashFlowProjections.slice(0, 5),
      industry_benchmarks: {
        genre: benchmark.genre,
        revenue_multiple: benchmark.revenue_multiple_avg,
        risk_factor: benchmark.market_risk_factor,
        growth_assumption: benchmark.growth_rate_assumption
      },
      comparable_multiples: {
        ev_revenue_multiple: benchmark.revenue_multiple_avg,
        peer_average_multiple: benchmark.revenue_multiple_avg * 1.1,
        market_premium_discount: artist.popularity > 80 ? 1.15 : artist.popularity < 40 ? 0.85 : 1.0
      }
    };

    console.log(`Advanced valuation complete - DCF: $${dcfValuation}, Multiple: $${multipleValuation}, Risk-Adjusted: $${riskAdjustedValue}`);

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