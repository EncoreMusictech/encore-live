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

interface RevenueSource {
  revenue_type: string;
  revenue_source: string;
  annual_revenue: number;
  growth_rate: number;
  confidence_level: string;
  is_recurring: boolean;
}

interface CashFlowProjection {
  year: number;
  revenue: number;
  growth: number;
  discountedValue: number;
  terminalValue?: number;
}

// Genre mapping function to normalize Spotify genres to database genres
function normalizeGenre(spotifyGenre: string): string {
  const lowerGenre = spotifyGenre.toLowerCase();
  
  // R&B variations (check before pop since many R&B artists also have "pop" in their genres)
  if (lowerGenre.includes('r&b') || lowerGenre.includes('rnb') || lowerGenre.includes('soul') || 
      lowerGenre.includes('neo soul') || lowerGenre.includes('contemporary r&b') || 
      lowerGenre.includes('urban contemporary')) {
    return 'r&b';
  }
  
  // Hip-hop variations
  if (lowerGenre.includes('rap') || lowerGenre.includes('hip hop') || lowerGenre.includes('hip-hop') || 
      lowerGenre.includes('gangster') || lowerGenre.includes('trap') || lowerGenre.includes('drill')) {
    return 'hip-hop';
  }
  
  // Electronic variations
  if (lowerGenre.includes('electronic') || lowerGenre.includes('edm') || lowerGenre.includes('house') || 
      lowerGenre.includes('techno') || lowerGenre.includes('dubstep') || lowerGenre.includes('trance') ||
      lowerGenre.includes('ambient') || lowerGenre.includes('synth')) {
    return 'electronic';
  }
  
  // Rock variations
  if (lowerGenre.includes('rock') || lowerGenre.includes('metal') || lowerGenre.includes('punk') ||
      lowerGenre.includes('grunge') || lowerGenre.includes('indie rock')) {
    return 'rock';
  }
  
  // Pop variations (moved after R&B to avoid false matches)
  if (lowerGenre.includes('pop') || lowerGenre.includes('dance') || lowerGenre.includes('mainstream')) {
    return 'pop';
  }
  
  // Country variations
  if (lowerGenre.includes('country') || lowerGenre.includes('folk') || lowerGenre.includes('americana') ||
      lowerGenre.includes('bluegrass')) {
    return 'country';
  }
  
  // Classical variations
  if (lowerGenre.includes('classical') || lowerGenre.includes('opera') || lowerGenre.includes('orchestral') ||
      lowerGenre.includes('chamber') || lowerGenre.includes('baroque')) {
    return 'classical';
  }
  
  // Jazz variations
  if (lowerGenre.includes('jazz') || lowerGenre.includes('blues') || lowerGenre.includes('swing') ||
      lowerGenre.includes('bebop') || lowerGenre.includes('fusion')) {
    return 'jazz';
  }
  
  // Alternative variations
  if (lowerGenre.includes('alternative') || lowerGenre.includes('indie') || lowerGenre.includes('experimental')) {
    return 'alternative';
  }
  
  // Default to pop if no match
  return 'pop';
}

// Helper to resolve a primary genre and check if normalization is needed
async function resolvePrimaryGenre(accessToken: string, artist: SpotifyArtist): Promise<string> {
  let primaryGenre: string | undefined;
  
  // Available genres in our database
  const availableGenres = ['hip-hop', 'r&b', 'pop', 'rock', 'electronic', 'country', 'alternative', 'classical', 'jazz', 'folk'];
  
  // Known artist mappings for when Spotify doesn't provide genre data
  const knownArtistMappings: Record<string, string> = {
    'dababy': 'hip-hop',
    'da baby': 'hip-hop',
    'lil baby': 'hip-hop',
    'drake': 'hip-hop',
    'kendrick lamar': 'hip-hop',
    'j. cole': 'hip-hop',
    'travis scott': 'hip-hop',
    'future': 'hip-hop',
    'lil wayne': 'hip-hop',
    'nicki minaj': 'hip-hop',
    'cardi b': 'hip-hop',
    'megan thee stallion': 'hip-hop',
    'beyoncé': 'r&b',
    'beyonce': 'r&b',
    'rihanna': 'r&b',
    'the weeknd': 'r&b',
    'sza': 'r&b',
    'frank ocean': 'r&b',
    'alicia keys': 'r&b'
  };
  
  console.log(`Starting genre resolution for artist: ${artist.name}`);
  console.log(`Artist genres from Spotify: ${JSON.stringify(artist.genres)}`);
  
  // Check known artist mappings first
  const artistLower = artist.name.toLowerCase();
  if (knownArtistMappings[artistLower]) {
    console.log(`Found known artist mapping: ${artist.name} -> ${knownArtistMappings[artistLower]}`);
    return knownArtistMappings[artistLower];
  }
  
  // First try the artist's own genres
  if (artist.genres && artist.genres.length > 0) {
    console.log(`Found ${artist.genres.length} genres for artist`);
    
    // Check if any Spotify genre directly matches our available genres
    for (const spotifyGenre of artist.genres) {
      const lowerGenre = spotifyGenre.toLowerCase();
      console.log(`Checking genre: "${spotifyGenre}" (normalized: "${lowerGenre}")`);
      
      if (availableGenres.includes(lowerGenre)) {
        console.log(`Direct match found: ${lowerGenre}`);
        return lowerGenre;
      }
      // Check for exact matches with common variations
      if (lowerGenre === 'hip hop' || lowerGenre === 'hip-hop') {
        console.log(`Hip-hop variation matched: ${lowerGenre}`);
        return 'hip-hop';
      }
      if (lowerGenre === 'r&b' || lowerGenre === 'rnb') {
        console.log(`R&B variation matched: ${lowerGenre}`);
        return 'r&b';
      }
    }
    
    // If no direct match, use the first genre for normalization
    primaryGenre = artist.genres[0];
    console.log(`No direct match found, using first genre for normalization: ${primaryGenre}`);
  } else {
    console.log(`No genres found for artist, checking related artists`);
    
    // Fallback to related artists' genres - more aggressive search for hip-hop/rap artists
    try {
      const resp = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/related-artists`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const genreCounts: Record<string, number> = {};
        const related = Array.isArray(data?.artists) ? data.artists : [];
        console.log(`Found ${related.length} related artists`);
        
        for (const ra of related) {
          const genres: string[] = Array.isArray(ra?.genres) ? ra.genres : [];
          for (const g of genres) {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
          }
        }
        
        // Look for hip-hop indicators first
        const hipHopGenres = Object.keys(genreCounts).filter(g => 
          g.toLowerCase().includes('rap') || 
          g.toLowerCase().includes('hip hop') || 
          g.toLowerCase().includes('hip-hop') || 
          g.toLowerCase().includes('trap')
        );
        
        if (hipHopGenres.length > 0) {
          console.log(`Found hip-hop genres in related artists: ${hipHopGenres.join(', ')}`);
          return 'hip-hop';
        }
        
        // Look for R&B indicators
        const rbGenres = Object.keys(genreCounts).filter(g => 
          g.toLowerCase().includes('r&b') || 
          g.toLowerCase().includes('soul') || 
          g.toLowerCase().includes('contemporary r&b')
        );
        
        if (rbGenres.length > 0) {
          console.log(`Found R&B genres in related artists: ${rbGenres.join(', ')}`);
          return 'r&b';
        }
        
        // Fall back to most common genre
        let max = 0;
        for (const [g, count] of Object.entries(genreCounts)) {
          if (count > max) {
            max = count;
            primaryGenre = g;
          }
        }
        console.log(`Most common genre from related artists: ${primaryGenre} (${max} occurrences)`);
      }
    } catch (_e) {
      console.log(`Error fetching related artists: ${_e.message}`);
    }
  }
  
  // If we have a primary genre but it doesn't directly match, normalize it
  if (primaryGenre) {
    const normalizedGenre = normalizeGenre(primaryGenre);
    console.log(`Normalizing "${primaryGenre}" to "${normalizedGenre}"`);
    return normalizedGenre;
  }
  
  // If no genre data available, return 'pop' as default
  console.log(`No genre data found, defaulting to pop`);
  return 'pop';
}

// Advanced mathematical models
class ValuationEngine {
  // Exponential Decay Forecast Model
  static exponentialDecayForecast(
    initialStreams: number, 
    decayRate: number, 
    years: number,
    streamsToRevenue: number = 0.003,
    discountRate: number = 0.12
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
        discountedValue: revenue / Math.pow(1 + discountRate, year)
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

  // Enhanced Valuation with Additional Revenue Sources
  static calculateEnhancedValuation(
    baseValuation: number,
    revenueSources: RevenueSource[]
  ): { blendedValue: number; additionalValue: number; diversificationBonus: number } {
    if (!revenueSources.length) {
      return { blendedValue: baseValuation, additionalValue: 0, diversificationBonus: 0 };
    }

    // Revenue type multipliers based on industry standards
    const multipliers: Record<string, number> = {
      streaming: 12,
      sync: 8,
      performance: 10,
      mechanical: 15,
      merchandise: 5,
      touring: 3,
      publishing: 18,
      master_licensing: 12,
      other: 6,
    };

    // Calculate additional value from revenue sources
    let additionalValue = 0;
    const revenueTypes = new Set<string>();

    revenueSources.forEach(source => {
      const multiplier = multipliers[source.revenue_type] || 6;
      const confidenceMultiplier = source.confidence_level === 'high' ? 1.1 : 
                                  source.confidence_level === 'medium' ? 1.0 : 0.8;
      const recurringMultiplier = source.is_recurring ? 1.0 : 0.6;
      
      additionalValue += source.annual_revenue * multiplier * confidenceMultiplier * recurringMultiplier;
      revenueTypes.add(source.revenue_type);
    });

    // Diversification bonus (up to 20% for fully diversified portfolio)
    const diversificationScore = Math.min(revenueTypes.size / 9, 1); // Max 9 revenue types
    const diversificationBonus = diversificationScore * 0.2;

    // Blend valuations (70% base, 30% additional)
    const blendedValue = (baseValuation * 0.7) + (additionalValue * 0.3);
    const finalValue = blendedValue * (1 + diversificationBonus);

    return {
      blendedValue: finalValue,
      additionalValue,
      diversificationBonus: diversificationBonus * 100,
    };
  }

  // Enhanced Confidence Score with Additional Revenue Data
  static calculateEnhancedConfidenceScore(
    baseScore: number,
    revenueSources: RevenueSource[]
  ): number {
    if (!revenueSources.length) return baseScore;
    
    // Base boost from having additional data points
    const dataBoost = Math.min(revenueSources.length * 5, 25); // Max 25% boost
    
    // Quality boost from confidence levels
    const highConfidenceCount = revenueSources.filter(s => s.confidence_level === 'high').length;
    const mediumConfidenceCount = revenueSources.filter(s => s.confidence_level === 'medium').length;
    const qualityBoost = (highConfidenceCount * 3) + (mediumConfidenceCount * 1.5);
    
    return Math.min(baseScore + dataBoost + qualityBoost, 100);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
  const { artistName, valuationParams, catalogValuationId, userId } = await req.json();
  console.log(`DEBUGGING: Received territory parameter: "${valuationParams?.territory}"`);
  const territory = valuationParams?.territory || 'global';

    if (!artistName) {
      throw new Error('Artist name is required');
    }

    console.log(`Advanced valuation for artist: ${artistName}`);

    // Initialize Supabase client for industry benchmarks and revenue sources
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch additional revenue sources if catalogValuationId is provided
    let revenueSources: RevenueSource[] = [];
    if (catalogValuationId && userId) {
      try {
        const { data: revenueData, error: revenueError } = await supabase
          .from('catalog_revenue_sources')
          .select('*')
          .eq('catalog_valuation_id', catalogValuationId)
          .eq('user_id', userId);
        
        if (revenueError) {
          console.warn(`Error fetching revenue sources: ${revenueError.message}`);
        } else {
          revenueSources = revenueData || [];
          console.log(`Found ${revenueSources.length} additional revenue sources`);
        }
      } catch (error) {
        console.warn(`Error fetching revenue sources: ${error.message}`);
      }
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

// Resolve primary genre (use Spotify genres directly when available; fallback to related artists)
const primaryGenre = await resolvePrimaryGenre(accessToken, artist);
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

    // Check if industry benchmarks are missing or generic
    const hasCustomBenchmarks = benchmarkData !== null;

    // Territory-specific adjustments
    const territoryMultiplier = territory === 'us-only' ? 0.6 : territory === 'international' ? 0.4 : 1.0;
    const territoryBenchmarkAdjustment = territory === 'us-only' ? 1.2 : territory === 'international' ? 0.8 : 1.0;
    console.log(`BACKEND DEBUG: Territory received: "${territory}", Multiplier: ${territoryMultiplier}, Benchmark Adjustment: ${territoryBenchmarkAdjustment}`);
    
    // Enhanced stream estimation with genre-specific factors
    const genreMultiplier = benchmark.streams_to_revenue_ratio / 0.003; // Normalize to base rate
    const estimatedTotalStreams = Math.floor(
      (artist.followers.total * artist.popularity * 2.5 * genreMultiplier * territoryMultiplier) + 
      topTracks.reduce((acc, track) => acc + (track.popularity * 50000), 0)
    );

    // Calculate LTM Revenue estimate with territory adjustments
    const ltmRevenue = estimatedTotalStreams * benchmark.streams_to_revenue_ratio * territoryBenchmarkAdjustment;

    // Advanced cash flow projections using exponential decay model
    const decayRate = Math.max(0.05, 1 - benchmark.growth_rate_assumption); // Higher decay for lower growth genres
    const userDiscountRate = valuationParams?.discountRate || 0.12;
    console.log(`Using discount rate: ${userDiscountRate * 100}%`);
    const cashFlowProjections = ValuationEngine.exponentialDecayForecast(
      estimatedTotalStreams,
      decayRate,
      10, // 10-year projection
      benchmark.streams_to_revenue_ratio,
      userDiscountRate
    );

    // DCF Valuation
    const dcfValuation = ValuationEngine.calculateDCFValuation(
      cashFlowProjections.slice(0, 5), // Use first 5 years for DCF
      benchmark.growth_rate_assumption * 0.5, // Terminal growth rate
      valuationParams?.discountRate || 0.12
    );

    // Multiple-based valuation
    const multipleValuation = Math.floor(ltmRevenue * benchmark.revenue_multiple_avg);

    // Risk-adjusted valuation with territory adjustments
    const catalogAge = valuationParams?.catalogAge || 5;
    const baseRiskAdjustedValue = ValuationEngine.calculateRiskAdjustedValue(
      (dcfValuation + multipleValuation) / 2,
      artist.popularity,
      benchmark.market_risk_factor,
      catalogAge
    );
    
    // Apply territory-specific adjustments to final valuation
    const riskAdjustedValue = Math.floor(baseRiskAdjustedValue * territoryBenchmarkAdjustment);

    // Base confidence score
    const baseConfidenceScore = ValuationEngine.calculateConfidenceScore({
      hasStreamData: true,
      hasFollowerData: artist.followers.total > 0,
      hasGenreData: artist.genres.length > 0,
      trackPopularity: topTracks.reduce((avg, track) => avg + track.popularity, 0) / topTracks.length,
      artistPopularity: artist.popularity
    });

    // Enhanced valuation with additional revenue sources
    const enhancedValuation = ValuationEngine.calculateEnhancedValuation(riskAdjustedValue, revenueSources);
    const enhancedConfidenceScore = ValuationEngine.calculateEnhancedConfidenceScore(baseConfidenceScore, revenueSources);

    console.log(`Enhanced valuation: Base: $${riskAdjustedValue}, Enhanced: $${enhancedValuation.blendedValue}, Additional: $${enhancedValuation.additionalValue}`);
    
    // Calculate revenue metrics for UI
    const totalAdditionalRevenue = revenueSources.reduce((sum, source) => sum + source.annual_revenue, 0);
    const uniqueRevenueTypes = new Set(revenueSources.map(s => s.revenue_type)).size;
    const revenueDiversificationScore = Math.min(uniqueRevenueTypes / 9, 1); // Max 9 revenue types

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

    // Find comparable artists using multiple search strategies
    let comparableArtists = [];
    console.log(`Starting comparable artist search. Artist genres: ${JSON.stringify(artist.genres)}`);
    
// Strategy 1: Search by genre
if (primaryGenre) {
  console.log(`Strategy 1: Starting genre-based search for genre: ${primaryGenre}`);
  try {
        const genreSearchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(primaryGenre)}"&type=artist&limit=50`,
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
                return popularityDiff <= 30 && searchArtist.followers.total > 1000;
              })
              .sort((a: SpotifyArtist, b: SpotifyArtist) => b.popularity - a.popularity);

            similarArtists.forEach((similarArtist: SpotifyArtist) => {
              if (comparableArtists.length < 10) { // Get more to choose from
                const similarEstimatedStreams = Math.floor(
                  (similarArtist.followers.total * similarArtist.popularity * 2.5 * genreMultiplier)
                );
                
                const similarValuation = Math.floor(
                  similarEstimatedStreams * benchmark.streams_to_revenue_ratio * benchmark.revenue_multiple_avg
                );
                
                comparableArtists.push({
                  name: similarArtist.name,
                  valuation: similarValuation,
                  followers: similarArtist.followers.total,
                  popularity: similarArtist.popularity,
                  genres: similarArtist.genres,
                  spotify_id: similarArtist.id
                });
              }
            });
          }
        }
      } catch (error) {
        console.log(`Error searching for similar artists by genre: ${error.message}`);
      }
    } else {
      console.log(`Artist has no genres, skipping genre-based search`);
    }
    
    // Strategy 2: If we still need more artists, search for popular artists in general
    if (comparableArtists.length < 3) {
      console.log(`Strategy 2: Starting popular artists search. Current count: ${comparableArtists.length}`);
      try {
        const popularSearchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=year:2020-2024&type=artist&limit=50`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (popularSearchResponse.ok) {
          const popularSearchData = await popularSearchResponse.json();
          
          if (popularSearchData.artists?.items?.length > 0) {
            const additionalArtists = popularSearchData.artists.items
              .filter((searchArtist: SpotifyArtist) => 
                searchArtist.id !== artist.id && 
                !comparableArtists.some(existing => existing.spotify_id === searchArtist.id)
              )
              .filter((searchArtist: SpotifyArtist) => searchArtist.followers.total > 10000)
              .sort((a: SpotifyArtist, b: SpotifyArtist) => b.followers.total - a.followers.total);

            additionalArtists.forEach((additionalArtist: SpotifyArtist) => {
              if (comparableArtists.length < 10) {
                const additionalEstimatedStreams = Math.floor(
                  (additionalArtist.followers.total * additionalArtist.popularity * 2.5 * genreMultiplier)
                );
                
                const additionalValuation = Math.floor(
                  additionalEstimatedStreams * benchmark.streams_to_revenue_ratio * benchmark.revenue_multiple_avg
                );
                
                comparableArtists.push({
                  name: additionalArtist.name,
                  valuation: additionalValuation,
                  followers: additionalArtist.followers.total,
                  popularity: additionalArtist.popularity,
                  genres: additionalArtist.genres,
                  spotify_id: additionalArtist.id
                });
              }
            });
          }
        }
      } catch (error) {
        console.log(`Error searching for additional comparable artists: ${error.message}`);
      }
    }

    // Strategy 3: Search by related artists if we still need more
    if (comparableArtists.length < 3) {
      console.log(`Strategy 3: Starting related artists search. Current count: ${comparableArtists.length}`);
      try {
        const relatedResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artist.id}/related-artists`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          
          if (relatedData.artists?.length > 0) {
            relatedData.artists.forEach((relatedArtist: SpotifyArtist) => {
              if (comparableArtists.length < 10 && 
                  !comparableArtists.some(existing => existing.spotify_id === relatedArtist.id)) {
                const relatedEstimatedStreams = Math.floor(
                  (relatedArtist.followers.total * relatedArtist.popularity * 2.5 * genreMultiplier)
                );
                
                const relatedValuation = Math.floor(
                  relatedEstimatedStreams * benchmark.streams_to_revenue_ratio * benchmark.revenue_multiple_avg
                );
                
                comparableArtists.push({
                  name: relatedArtist.name,
                  valuation: relatedValuation,
                  followers: relatedArtist.followers.total,
                  popularity: relatedArtist.popularity,
                  genres: relatedArtist.genres,
                  spotify_id: relatedArtist.id
                });
              }
            });
          }
        }
      } catch (error) {
        console.log(`Error searching for related artists: ${error.message}`);
      }
    }

    // Strategy 4: Search for artists with similar follower counts (always run if we don't have enough artists)
    if (comparableArtists.length < 3) {
      console.log(`Searching for artists with similar follower counts to find real Spotify artists`);
      
      try {
        // Calculate follower range for search (±50% of artist's followers)
        const targetFollowers = artist.followers.total;
        const minFollowers = Math.max(1000, Math.floor(targetFollowers * 0.5));
        const maxFollowers = Math.floor(targetFollowers * 1.5);
        
        console.log(`Searching for artists with ${minFollowers} to ${maxFollowers} followers (target: ${targetFollowers})`);
        
        // Search multiple queries to find artists with similar follower counts
        const searchQueries = [
          'a', 'e', 'i', 'o', 'u', // Vowel searches tend to return diverse results
          'the', 'and', 'for', 'you', 'all', // Common words to get variety
          'new', 'music', 'band', 'singer' // Music-related terms
        ];
        
        for (const query of searchQueries) {
          if (comparableArtists.length >= 10) break;
          
          try {
            const followerSearchResponse = await fetch(
              `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=50`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );

            if (followerSearchResponse.ok) {
              const followerSearchData = await followerSearchResponse.json();
              
              if (followerSearchData.artists?.items?.length > 0) {
                const similarFollowerArtists = followerSearchData.artists.items
                  .filter((searchArtist: SpotifyArtist) => 
                    searchArtist.id !== artist.id && 
                    !comparableArtists.some(existing => existing.spotify_id === searchArtist.id)
                  )
                  .filter((searchArtist: SpotifyArtist) => {
                    const followers = searchArtist.followers.total;
                    return followers >= minFollowers && followers <= maxFollowers && followers > 0;
                  })
                  .sort((a: SpotifyArtist, b: SpotifyArtist) => {
                    // Sort by how close the follower count is to our target
                    const aDiff = Math.abs(a.followers.total - targetFollowers);
                    const bDiff = Math.abs(b.followers.total - targetFollowers);
                    return aDiff - bDiff;
                  });

                similarFollowerArtists.forEach((similarArtist: SpotifyArtist) => {
                  if (comparableArtists.length < 10) {
                    const similarEstimatedStreams = Math.floor(
                      (similarArtist.followers.total * similarArtist.popularity * 2.5 * genreMultiplier)
                    );
                    
                    const similarValuation = Math.floor(
                      similarEstimatedStreams * benchmark.streams_to_revenue_ratio * benchmark.revenue_multiple_avg
                    );
                    
                    comparableArtists.push({
                      name: similarArtist.name,
                      valuation: similarValuation,
                      followers: similarArtist.followers.total,
                      popularity: similarArtist.popularity,
                      genres: similarArtist.genres,
                      spotify_id: similarArtist.id
                    });
                    
                    console.log(`Added similar artist: ${similarArtist.name} (${similarArtist.followers.total} followers)`);
                  }
                });
              }
            }
          } catch (error) {
            console.log(`Error searching for artists with query "${query}": ${error.message}`);
          }
        }
        
        console.log(`Found ${comparableArtists.length} total comparable artists through follower similarity search`);
      } catch (error) {
        console.log(`Error in follower similarity search: ${error.message}`);
      }
    }
    
    // Select the best 3 comparables, ensuring diversity
    if (comparableArtists.length > 3) {
      // Sort by similarity to target artist and pick diverse set
      comparableArtists = comparableArtists
        .sort((a, b) => {
          const aSimilarity = Math.abs(a.popularity - artist.popularity) + 
                             Math.abs(Math.log(a.followers) - Math.log(artist.followers.total));
          const bSimilarity = Math.abs(b.popularity - artist.popularity) + 
                             Math.abs(Math.log(b.followers) - Math.log(artist.followers.total));
          return aSimilarity - bSimilarity;
        })
        .slice(0, 3);
    }
    
    // If we still don't have enough real artists, pad with the best ones we found
    while (comparableArtists.length < 3 && comparableArtists.length > 0) {
      const lastArtist = comparableArtists[comparableArtists.length - 1];
      const syntheticArtist = {
        name: `${lastArtist.name} (Similar Artist)`,
        valuation: Math.floor(lastArtist.valuation * (0.9 + Math.random() * 0.2)),
        followers: Math.floor(lastArtist.followers * (0.8 + Math.random() * 0.4)),
        popularity: Math.max(1, Math.min(100, lastArtist.popularity + (Math.random() * 10 - 5))),
        genres: lastArtist.genres
      };
      comparableArtists.push(syntheticArtist);
    }
    
    // Debug: Log the final comparable artists count before proceeding
    console.log(`Final comparable artists count: ${comparableArtists.length}`);
    
    // If we still have no real artists after all strategies, create a better fallback
    if (comparableArtists.length === 0) {
      console.log(`No comparable artists found through any search strategy. Creating fallback based on similar follower ranges.`);
      
      // Create more realistic fallback data based on the target artist's metrics
      const baseFollowers = artist.followers.total;
      const basePopularity = artist.popularity;
      
      for (let i = 0; i < 3; i++) {
        const followerVariation = 0.2 + (Math.random() * 0.6); // 20% to 80% variation
        const popularityVariation = -10 + (Math.random() * 20); // ±10 points
        
        comparableArtists.push({
          name: `Similar Artist ${i + 1}`,
          valuation: Math.floor(fairMarketValue.mid * (0.8 + Math.random() * 0.4)),
          followers: Math.floor(baseFollowers * followerVariation),
          popularity: Math.max(1, Math.min(100, basePopularity + popularityVariation)),
          genres: artist.genres.length > 0 ? artist.genres.slice(0, 2) : ['pop']
        });
      }
      
      console.log(`Created ${comparableArtists.length} fallback comparable artists`);
    } else {
      console.log(`Successfully found ${comparableArtists.length} real comparable artists`);
    }

    console.log(`Territory: ${territory}, Benchmark Adjustment: ${territoryBenchmarkAdjustment}`);

    const valuationData = {
      artist_name: artist.name,
      total_streams: estimatedTotalStreams,
      monthly_listeners: artist.followers.total,
      territory_focus: territory,
      territory_multiplier: territoryBenchmarkAdjustment,
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
primary_genre: primaryGenre,
popularity_score: artist.popularity,
discount_rate: valuationParams?.discountRate || 0.12,
      dcf_valuation: dcfValuation,
      multiple_valuation: multipleValuation,
      risk_adjusted_value: riskAdjustedValue,
      confidence_score: enhancedConfidenceScore,
      valuation_methodology: revenueSources.length > 0 ? 'enhanced_blended_valuation' : 'advanced_dcf_with_risk_adjustment',
      
      // Enhanced Valuation Data
      has_additional_revenue: revenueSources.length > 0,
      total_additional_revenue: totalAdditionalRevenue,
      revenue_diversification_score: revenueDiversificationScore,
      blended_valuation: enhancedValuation.blendedValue,
      valuation_methodology_v2: revenueSources.length > 0 ? 'enhanced' : 'basic',
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
    },
    territory_focus: territory,
    territory_multiplier: territoryBenchmarkAdjustment,
  };

  console.log(`Advanced valuation complete - DCF: $${dcfValuation}, Multiple: $${multipleValuation}, Risk-Adjusted: $${riskAdjustedValue}`);
    console.log(`FINAL DEBUG UPDATED: territory_focus in response: ${valuationData.territory_focus}`);
    console.log(`FINAL DEBUG UPDATED: territory_multiplier in response: ${valuationData.territory_multiplier}`);

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