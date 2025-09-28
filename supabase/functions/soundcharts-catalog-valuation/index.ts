import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; script-src 'none'",
};

interface SoundchartsArtist {
  uuid: string;
  name: string;
  genres: string[];
  followers: {
    spotify?: number;
    total: number;
  };
  popularity: number;
}

interface SoundchartsStreamingData {
  spotify?: {
    monthly_listeners: number;
    total_streams: number;
    popularity: number;
  };
  youtube?: {
    subscribers: number;
    total_views: number;
  };
  apple_music?: {
    listeners: number;
  };
}

interface SoundchartsTrack {
  id: string;
  name: string;
  popularity: number;
  external_urls: {
    spotify?: string;
    youtube?: string;
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

// Genre mapping function to normalize Soundcharts genres to database genres
function normalizeGenre(soundchartsGenre: string): string {
  const lowerGenre = soundchartsGenre.toLowerCase();
  
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

// Helper to resolve a primary genre from Soundcharts data
async function resolvePrimaryGenre(soundchartsHeaders: Record<string, string>, artist: SoundchartsArtist): Promise<string> {
  let primaryGenre: string | undefined;
  
  // Available genres in our database
  const availableGenres = ['hip-hop', 'r&b', 'pop', 'rock', 'electronic', 'country', 'alternative', 'classical', 'jazz', 'folk'];
  
  // Known artist mappings for consistency
  const knownArtistMappings: Record<string, string> = {
    'k camp': 'hip-hop',
    'k-camp': 'hip-hop', 
    'kcamp': 'hip-hop',
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
  console.log(`Artist genres from Soundcharts: ${JSON.stringify(artist.genres)}`);
  
  // Check known artist mappings first
  const artistLower = artist.name.toLowerCase();
  if (knownArtistMappings[artistLower]) {
    console.log(`Found known artist mapping: ${artist.name} -> ${knownArtistMappings[artistLower]}`);
    return knownArtistMappings[artistLower];
  }
  
  // Try the artist's own genres
  if (artist.genres && artist.genres.length > 0) {
    console.log(`Found ${artist.genres.length} genres for artist`);
    
    // Check if any Soundcharts genre directly matches our available genres
    for (const soundchartsGenre of artist.genres) {
      const lowerGenre = soundchartsGenre.toLowerCase();
      console.log(`Checking genre: "${soundchartsGenre}" (normalized: "${lowerGenre}")`);
      
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
    console.log(`No genres found for artist, checking similar artists`);
    
    // Fallback to similar artists' genres
    try {
      const resp = await fetch(`https://customer.api.soundcharts.com/api/artist/${artist.uuid}/similar-artists`, {
        headers: soundchartsHeaders,
      });
      if (resp.ok) {
        const data = await resp.json();
        const genreCounts: Record<string, number> = {};
        const similar = Array.isArray(data?.items) ? data.items : [];
        console.log(`Found ${similar.length} similar artists`);
        
        for (const sa of similar) {
          const genres: string[] = Array.isArray(sa?.genres) ? sa.genres : [];
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
          console.log(`Found hip-hop genres in similar artists: ${hipHopGenres.join(', ')}`);
          return 'hip-hop';
        }
        
        // Look for R&B indicators
        const rbGenres = Object.keys(genreCounts).filter(g => 
          g.toLowerCase().includes('r&b') || 
          g.toLowerCase().includes('soul') || 
          g.toLowerCase().includes('contemporary r&b')
        );
        
        if (rbGenres.length > 0) {
          console.log(`Found R&B genres in similar artists: ${rbGenres.join(', ')}`);
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
        console.log(`Most common genre from similar artists: ${primaryGenre} (${max} occurrences)`);
      }
    } catch (_e) {
      console.log(`Error fetching similar artists: ${(_e as Error).message}`);
    }
  }
  
  // If we have a primary genre but it doesn't directly match, normalize it
  if (primaryGenre) {
    const normalizedGenre = normalizeGenre(primaryGenre);
    console.log(`Normalizing "${primaryGenre}" to "${normalizedGenre}"`);
    return normalizedGenre;
  }
  
  // If no genre data available, return 'pop' as default
  console.log(`No genre data found, using 'pop' as default`);
  return 'pop';
}

// Advanced mathematical models (reusing the same valuation engine from Spotify function)
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
    console.log(`DEBUGGING: Received discount rate parameter: ${valuationParams?.discountRate || 0.12}`);
    const territory = valuationParams?.territory || 'global';

    if (!artistName) {
      throw new Error('Artist name is required');
    }

    console.log(`Advanced valuation for artist: ${artistName} using Soundcharts API`);

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
        console.warn(`Error fetching revenue sources: ${(error as Error).message}`);
      }
    }

    // Get Soundcharts API credentials
    const soundchartsApiKey = Deno.env.get('SOUNDCHARTS_API_KEY');
    const soundchartsAppId = Deno.env.get('SOUNDCHARTS_APP_ID');

    if (!soundchartsApiKey || !soundchartsAppId) {
      throw new Error('Soundcharts credentials not configured');
    }

    const soundchartsHeaders = {
      'x-app-id': soundchartsAppId,
      'x-api-key': soundchartsApiKey,
      'Content-Type': 'application/json',
    };

    console.log('Searching for artist on Soundcharts...');

    // Search for the artist
    const searchResponse = await fetch(`https://customer.api.soundcharts.com/api/search/artist?query=${encodeURIComponent(artistName)}`, {
      headers: soundchartsHeaders,
    });

    if (!searchResponse.ok) {
      throw new Error(`Soundcharts search failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log(`Soundcharts search results: ${JSON.stringify(searchData)}`);

    if (!searchData.items || !Array.isArray(searchData.items) || searchData.items.length === 0) {
      throw new Error(`Artist "${artistName}" not found on Soundcharts`);
    }

    // Get the first (most relevant) artist result
    const artist: SoundchartsArtist = searchData.items[0];
    console.log(`Found artist: ${artist.name} (${artist.uuid})`);

    // Get artist streaming data
    console.log('Fetching streaming audience data...');
    let streamingData: SoundchartsStreamingData = {};
    
    try {
      const streamingResponse = await fetch(`https://customer.api.soundcharts.com/api/artist/${artist.uuid}/streaming-audience`, {
        headers: soundchartsHeaders,
      });

      if (streamingResponse.ok) {
        const streamingResult = await streamingResponse.json();
        streamingData = streamingResult || {};
        console.log(`Streaming data: ${JSON.stringify(streamingData)}`);
      } else {
        console.warn(`Failed to fetch streaming data: ${streamingResponse.status}`);
      }
    } catch (error) {
      console.warn(`Error fetching streaming data: ${(error as Error).message}`);
    }

    // Resolve primary genre
    console.log('Resolving primary genre...');
    const primaryGenre = await resolvePrimaryGenre(soundchartsHeaders, artist);
    console.log(`Resolved primary genre: ${primaryGenre}`);

    // Fetch industry benchmarks from database
    console.log('Fetching industry benchmarks...');
    const { data: benchmarkData, error: benchmarkError } = await supabase
      .from('industry_benchmarks')
      .select('*')
      .eq('genre', primaryGenre)
      .single();

    let benchmark: IndustryBenchmark;
    if (benchmarkError || !benchmarkData) {
      console.warn(`No benchmark found for genre ${primaryGenre}, using default`);
      // Default benchmark values
      benchmark = {
        genre: primaryGenre,
        revenue_multiple_min: 8,
        revenue_multiple_max: 15,
        revenue_multiple_avg: 11.5,
        streams_to_revenue_ratio: 0.003,
        growth_rate_assumption: 0.05,
        market_risk_factor: 0.15,
      };
    } else {
      benchmark = benchmarkData;
    }

    // Extract streaming metrics (prioritize Spotify, fallback to other platforms)
    const totalStreams = streamingData.spotify?.total_streams || 0;
    const monthlyListeners = streamingData.spotify?.monthly_listeners || 0;
    const artistPopularity = streamingData.spotify?.popularity || artist.popularity || 50;
    const followers = streamingData.spotify ? 
      { total: artist.followers?.spotify || artist.followers?.total || 0 } : 
      { total: artist.followers?.total || 0 };

    console.log(`Extracted metrics - Streams: ${totalStreams}, Monthly Listeners: ${monthlyListeners}, Popularity: ${artistPopularity}`);

    // Estimate LTM revenue
    const estimatedLTMRevenue = totalStreams * benchmark.streams_to_revenue_ratio;

    // Calculate discount rate (use provided or default)
    const discountRate = valuationParams?.discountRate || 0.12;
    const catalogAge = valuationParams?.catalogAge || 5;

    // Generate cash flow projections
    const decayRate = 0.08; // Standard decay rate for music catalogs
    const cashFlowProjections = ValuationEngine.exponentialDecayForecast(
      totalStreams,
      decayRate,
      10,
      benchmark.streams_to_revenue_ratio,
      discountRate
    );

    // Calculate different valuation methods
    const dcfValuation = ValuationEngine.calculateDCFValuation(cashFlowProjections, 0.02, discountRate);
    const multipleValuation = estimatedLTMRevenue * benchmark.revenue_multiple_avg;
    const riskAdjustedValue = ValuationEngine.calculateRiskAdjustedValue(
      Math.max(dcfValuation, multipleValuation),
      artistPopularity,
      benchmark.market_risk_factor,
      catalogAge
    );

    // Calculate confidence score
    const confidenceScore = ValuationEngine.calculateConfidenceScore({
      hasStreamData: totalStreams > 0,
      hasFollowerData: followers.total > 0,
      hasGenreData: artist.genres && artist.genres.length > 0,
      trackPopularity: artistPopularity,
      artistPopularity: artistPopularity,
    });

    // Enhanced valuation with additional revenue sources
    const enhancedValuation = ValuationEngine.calculateEnhancedValuation(riskAdjustedValue, revenueSources);
    const enhancedConfidenceScore = ValuationEngine.calculateEnhancedConfidenceScore(confidenceScore, revenueSources);

    // Generate forecasts and scenarios (similar to Spotify function)
    const generateScenarioForecasts = (baseStreams: number, growthRate: number) => {
      const forecasts = [];
      for (let year = 1; year <= 5; year++) {
        const streams = Math.floor(baseStreams * Math.pow(1 + growthRate, year));
        const revenue = streams * benchmark.streams_to_revenue_ratio;
        const valuation = revenue * benchmark.revenue_multiple_avg;
        
        forecasts.push({
          year,
          streams,
          revenue: Math.floor(revenue),
          valuation: Math.floor(valuation)
        });
      }
      return forecasts;
    };

    const baseGrowthRate = benchmark.growth_rate_assumption;
    const forecasts = {
      pessimistic: generateScenarioForecasts(totalStreams, baseGrowthRate - 0.03),
      base: generateScenarioForecasts(totalStreams, baseGrowthRate),
      optimistic: generateScenarioForecasts(totalStreams, baseGrowthRate + 0.03)
    };

    const calculateCagr = (initialValue: number, finalValue: number, years: number) => {
      if (initialValue <= 0 || finalValue <= 0) return 0;
      return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
    };

    const valuations = {
      pessimistic: {
        current: Math.floor(riskAdjustedValue * 0.8),
        year5: forecasts.pessimistic[4]?.valuation || 0,
        cagr: calculateCagr(riskAdjustedValue * 0.8, forecasts.pessimistic[4]?.valuation || 0, 5).toFixed(1)
      },
      base: {
        current: riskAdjustedValue,
        year5: forecasts.base[4]?.valuation || 0,
        cagr: calculateCagr(riskAdjustedValue, forecasts.base[4]?.valuation || 0, 5).toFixed(1)
      },
      optimistic: {
        current: Math.floor(riskAdjustedValue * 1.2),
        year5: forecasts.optimistic[4]?.valuation || 0,
        cagr: calculateCagr(riskAdjustedValue * 1.2, forecasts.optimistic[4]?.valuation || 0, 5).toFixed(1)
      }
    };

    // Find similar artists (simplified version)
    let comparableArtists: any[] = [];
    try {
      const similarResponse = await fetch(`https://customer.api.soundcharts.com/api/artist/${artist.uuid}/similar-artists`, {
        headers: soundchartsHeaders,
      });

      if (similarResponse.ok) {
        const similarData = await similarResponse.json();
        comparableArtists = (similarData.items || []).slice(0, 5).map((similar: any) => ({
          name: similar.name,
          valuation: Math.floor(Math.random() * 5000000 + 1000000), // Placeholder - would need actual streaming data for each
          followers: similar.followers?.total || 0,
          popularity: similar.popularity || 50,
          genres: similar.genres || [],
          soundcharts_uuid: similar.uuid
        }));
      }
    } catch (error) {
      console.warn(`Error fetching similar artists: ${(error as Error).message}`);
    }

    // Build the response (maintain compatibility with existing interface)
    const result = {
      artist_name: artist.name,
      total_streams: totalStreams,
      monthly_listeners: monthlyListeners,
      territory_focus: territory as 'global' | 'us-only' | 'international',
      territory_multiplier: 1.0, // Soundcharts provides global data by default
      top_tracks: [], // Would need separate API call to get top tracks
      valuation_amount: riskAdjustedValue,
      currency: 'USD',
      spotify_data: {
        artist_id: artist.uuid, // Using Soundcharts UUID instead of Spotify ID
        genres: artist.genres || [],
        popularity: artistPopularity,
        followers: followers.total
      },
      forecasts,
      valuations,
      fair_market_value: {
        low: Math.floor(riskAdjustedValue * 0.8),
        mid: riskAdjustedValue,
        high: Math.floor(riskAdjustedValue * 1.2)
      },
      comparable_artists: comparableArtists,
      growth_metrics: {
        estimated_cagr: baseGrowthRate * 100,
        industry_growth: baseGrowthRate * 100,
        base_multiple: benchmark.revenue_multiple_avg
      },
      // Advanced metrics
      ltm_revenue: Math.floor(estimatedLTMRevenue),
      catalog_age_years: catalogAge,
      genre: primaryGenre,
      popularity_score: artistPopularity,
      discount_rate: discountRate,
      dcf_valuation: dcfValuation,
      multiple_valuation: Math.floor(multipleValuation),
      risk_adjusted_value: riskAdjustedValue,
      confidence_score: enhancedConfidenceScore,
      valuation_methodology: 'advanced',
      cash_flow_projections: cashFlowProjections,
      industry_benchmarks: {
        genre: benchmark.genre,
        revenue_multiple: benchmark.revenue_multiple_avg,
        risk_factor: benchmark.market_risk_factor,
        growth_assumption: benchmark.growth_rate_assumption
      },
      comparable_multiples: {
        ev_revenue_multiple: benchmark.revenue_multiple_avg,
        peer_average_multiple: benchmark.revenue_multiple_avg,
        market_premium_discount: 0
      },
      // Enhanced valuation fields
      has_additional_revenue: revenueSources.length > 0,
      total_additional_revenue: revenueSources.reduce((sum, source) => sum + source.annual_revenue, 0),
      revenue_diversification_score: enhancedValuation.diversificationBonus,
      blended_valuation: Math.floor(enhancedValuation.blendedValue),
      valuation_methodology_v2: 'enhanced'
    };

    console.log(`Valuation complete: ${JSON.stringify(result, null, 2)}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in soundcharts-catalog-valuation function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorStack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});