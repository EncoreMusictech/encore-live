import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

// Environment variables
const chartmetricApiKey = Deno.env.get('CHARTMETRIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Data interfaces
interface ChartmetricArtist {
  id: number;
  name: string;
  cm_artist_rank?: number;
  followers?: {
    spotify?: number;
    instagram?: number;
    facebook?: number;
    twitter?: number;
    youtube?: number;
  };
  engagement_rate?: number;
  genre?: string[];
}

interface ChartmetricStreamingStats {
  data: {
    timestp: string;
    spotify_followers: number;
    spotify_monthly_listeners: number;
    spotify_streams: number;
    youtube_views: number;
    apple_music_playlists: number;
    shazam_counts: number;
  }[];
}

interface ChartmetricPlaylistPlacements {
  data: {
    playlist_name: string;
    platform: string;
    followers: number;
    reach: number;
    date_added: string;
  }[];
}

interface IndustryBenchmark {
  genre: string;
  min_multiple: number;
  avg_multiple: number;
  max_multiple: number;
  streams_to_revenue: number;
  growth_rate: number;
  risk_factor: number;
}

interface RevenueSource {
  revenue_type: string;
  annual_revenue: number;
  confidence_level: string;
  is_recurring: boolean;
}

interface CashFlowProjection {
  year: number;
  revenue: number;
  growth_rate: number;
  streams: number;
}

// Enhanced valuation engine with real Chartmetric data
class ChartmetricValuationEngine {
  private industryBenchmarks: IndustryBenchmark[] = [];
  private additionalRevenues: RevenueSource[] = [];

  constructor(benchmarks: IndustryBenchmark[], additionalRevenues: RevenueSource[] = []) {
    this.industryBenchmarks = benchmarks;
    this.additionalRevenues = additionalRevenues;
  }

  // Calculate DCF valuation using real streaming data
  calculateDCFValuation(
    initialStreams: number,
    streamsToRevenue: number,
    discountRate: number,
    terminalGrowthRate: number = 0.02
  ): { dcfValue: number; projections: CashFlowProjection[] } {
    const projections: CashFlowProjection[] = [];
    let presentValue = 0;
    
    // Use more conservative decay rate with real data
    const decayRate = 0.08; // 8% annual decline - industry standard for music catalogs
    
    for (let year = 1; year <= 10; year++) {
      const streams = initialStreams * Math.exp(-decayRate * (year - 1));
      const revenue = streams * streamsToRevenue;
      const growthRate = year === 1 ? 0 : -decayRate;
      
      projections.push({
        year,
        revenue,
        growth_rate: growthRate,
        streams: Math.round(streams)
      });
      
      const discountFactor = Math.pow(1 + discountRate, year);
      presentValue += revenue / discountFactor;
    }
    
    // Terminal value calculation
    const terminalRevenue = projections[9].revenue * (1 + terminalGrowthRate);
    const terminalValue = terminalRevenue / (discountRate - terminalGrowthRate);
    const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, 10);
    
    const dcfValue = presentValue + discountedTerminalValue;
    
    return { dcfValue, projections };
  }

  // Calculate risk-adjusted valuation with real data factors
  calculateRiskAdjustedValue(
    baseValue: number,
    realMonthlyListeners: number,
    genre: string,
    chartPosition?: number,
    playlistPlacements?: number
  ): number {
    // More sophisticated popularity factor using real metrics
    let popularityFactor = 1.0;
    
    // Monthly listeners factor (more accurate than Spotify's popularity score)
    if (realMonthlyListeners > 10000000) popularityFactor *= 1.3;
    else if (realMonthlyListeners > 5000000) popularityFactor *= 1.2;
    else if (realMonthlyListeners > 1000000) popularityFactor *= 1.1;
    else if (realMonthlyListeners > 100000) popularityFactor *= 1.0;
    else if (realMonthlyListeners > 10000) popularityFactor *= 0.9;
    else popularityFactor *= 0.8;

    // Chart position bonus (if available)
    if (chartPosition && chartPosition <= 100) {
      const chartBonus = Math.max(0.1, (101 - chartPosition) / 1000);
      popularityFactor += chartBonus;
    }

    // Playlist placement bonus
    if (playlistPlacements && playlistPlacements > 0) {
      const playlistBonus = Math.min(0.2, playlistPlacements * 0.01);
      popularityFactor += playlistBonus;
    }

    // Genre risk factor
    const genreRiskFactors: Record<string, number> = {
      'hip-hop': 0.12,
      'r&b': 0.14,
      'pop': 0.15,
      'electronic': 0.16,
      'country': 0.17,
      'rock': 0.18,
      'alternative': 0.18,
      'folk': 0.22,
      'classical': 0.25,
      'jazz': 0.28
    };

    const riskFactor = genreRiskFactors[genre.toLowerCase()] || 0.20;
    const riskAdjustment = 1 - (riskFactor * 0.5); // Apply 50% of risk factor

    return baseValue * popularityFactor * riskAdjustment;
  }

  // Enhanced confidence scoring with real data quality
  calculateConfidenceScore(
    hasRealStreamingData: boolean,
    hasHistoricalData: boolean,
    hasPlaylistData: boolean,
    dataRecency: number, // days since last update
    monthlyListeners: number
  ): number {
    let score = 0;

    // Real streaming data significantly boosts confidence
    if (hasRealStreamingData) score += 40;
    else score += 10; // estimated data only

    // Historical data availability
    if (hasHistoricalData) score += 25;
    else score += 5;

    // Playlist placement data
    if (hasPlaylistData) score += 15;
    else score += 3;

    // Data recency (fresher data = higher confidence)
    if (dataRecency <= 7) score += 10;
    else if (dataRecency <= 30) score += 7;
    else if (dataRecency <= 90) score += 4;
    else score += 1;

    // Artist scale (larger artists = more reliable data)
    if (monthlyListeners > 1000000) score += 10;
    else if (monthlyListeners > 100000) score += 7;
    else if (monthlyListeners > 10000) score += 5;
    else score += 2;

    return Math.min(100, score);
  }
}

// Chartmetric API client
class ChartmetricAPI {
  private apiKey: string;
  private baseUrl = 'https://api.chartmetric.com/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Get access token (Chartmetric uses OAuth2)
  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshtoken: this.apiKey
      })
    });

    if (!response.ok) {
      throw new Error(`Chartmetric auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  }

  // Search for artist
  async searchArtist(artistName: string): Promise<ChartmetricArtist | null> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(artistName)}&type=artists&limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Chartmetric search failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.obj?.artists?.[0] || null;
    } catch (error) {
      console.error('Chartmetric search error:', error);
      return null;
    }
  }

  // Get comprehensive streaming statistics
  async getStreamingStats(artistId: number, period: string = '6m'): Promise<ChartmetricStreamingStats | null> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/artist/${artistId}/streaming-stats?since=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Chartmetric streaming stats failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Chartmetric streaming stats error:', error);
      return null;
    }
  }

  // Get playlist placements
  async getPlaylistPlacements(artistId: number): Promise<ChartmetricPlaylistPlacements | null> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/artist/${artistId}/playlist-placements?since=3m`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Chartmetric playlist placements failed: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Chartmetric playlist placements error:', error);
      return null;
    }
  }
}

// Genre normalization for Chartmetric data
function normalizeChartmetricGenre(genres: string[]): string {
  if (!genres || genres.length === 0) return 'pop';
  
  const genreMap: Record<string, string> = {
    'hip hop': 'hip-hop',
    'rap': 'hip-hop',
    'trap': 'hip-hop',
    'r&b': 'r&b',
    'rnb': 'r&b',
    'soul': 'r&b',
    'pop': 'pop',
    'dance pop': 'pop',
    'electropop': 'electronic',
    'edm': 'electronic',
    'electronic': 'electronic',
    'house': 'electronic',
    'techno': 'electronic',
    'country': 'country',
    'rock': 'rock',
    'indie rock': 'alternative',
    'alternative': 'alternative',
    'folk': 'folk',
    'indie folk': 'folk',
    'classical': 'classical',
    'jazz': 'jazz'
  };

  // Find the first matching genre
  for (const genre of genres) {
    const normalized = genreMap[genre.toLowerCase()];
    if (normalized) return normalized;
  }

  return 'pop'; // Default fallback
}

// Main HTTP server
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CHARTMETRIC-VALUATION] Function started');

    // Verify API key
    if (!chartmetricApiKey) {
      console.error('[CHARTMETRIC-VALUATION] Chartmetric API key not configured');
      return new Response(JSON.stringify({ error: 'Chartmetric API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request
    const { artistName, additionalRevenues = [], discountRate = 0.12 } = await req.json();
    
    if (!artistName) {
      return new Response(JSON.stringify({ error: 'Artist name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[CHARTMETRIC-VALUATION] Processing valuation for: ${artistName}`);

    // Initialize Chartmetric API
    const chartmetric = new ChartmetricAPI(chartmetricApiKey);

    // Search for artist
    console.log('[CHARTMETRIC-VALUATION] Searching for artist...');
    const artist = await chartmetric.searchArtist(artistName);
    
    if (!artist) {
      console.log('[CHARTMETRIC-VALUATION] Artist not found, using fallback method');
      return new Response(JSON.stringify({ 
        error: 'Artist not found in Chartmetric database',
        suggestion: 'Try using the Spotify valuation tool instead'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[CHARTMETRIC-VALUATION] Found artist: ${artist.name} (ID: ${artist.id})`);

    // Get comprehensive data
    console.log('[CHARTMETRIC-VALUATION] Fetching streaming statistics...');
    const [streamingStats, playlistPlacements] = await Promise.all([
      chartmetric.getStreamingStats(artist.id),
      chartmetric.getPlaylistPlacements(artist.id)
    ]);

    // Determine primary genre
    const primaryGenre = normalizeChartmetricGenre(artist.genre || []);
    console.log(`[CHARTMETRIC-VALUATION] Primary genre: ${primaryGenre}`);

    // Fetch industry benchmarks from Supabase
    console.log('[CHARTMETRIC-VALUATION] Fetching industry benchmarks...');
    const { data: benchmarks } = await supabase
      .from('industry_benchmarks')
      .select('*')
      .eq('genre', primaryGenre)
      .single();

    const defaultBenchmark: IndustryBenchmark = {
      genre: primaryGenre,
      min_multiple: 8.0,
      avg_multiple: 12.0,
      max_multiple: 16.0,
      streams_to_revenue: 0.003,
      growth_rate: 0.05,
      risk_factor: 0.15
    };

    const benchmark = benchmarks || defaultBenchmark;

    // Extract real data from Chartmetric
    let currentMonthlyListeners = 0;
    let currentMonthlyStreams = 0;
    let hasRealData = false;

    if (streamingStats?.data && streamingStats.data.length > 0) {
      const latestData = streamingStats.data[streamingStats.data.length - 1];
      currentMonthlyListeners = latestData.spotify_monthly_listeners || 0;
      currentMonthlyStreams = latestData.spotify_streams || 0;
      hasRealData = true;
      console.log(`[CHARTMETRIC-VALUATION] Real data - Monthly listeners: ${currentMonthlyListeners}, Streams: ${currentMonthlyStreams}`);
    } else {
      // Fallback estimation based on followers if available
      currentMonthlyListeners = (artist.followers?.spotify || 0) * 0.15; // Conservative estimation
      currentMonthlyStreams = currentMonthlyListeners * 3; // Rough estimate
      console.log(`[CHARTMETRIC-VALUATION] Using estimated data - Monthly listeners: ${currentMonthlyListeners}`);
    }

    // Calculate annual streams (monthly streams * 12)
    const annualStreams = currentMonthlyStreams * 12;
    const ltmRevenue = annualStreams * benchmark.streams_to_revenue;

    console.log(`[CHARTMETRIC-VALUATION] Annual streams: ${annualStreams}, LTM Revenue: $${ltmRevenue}`);

    // Initialize valuation engine
    const valuationEngine = new ChartmetricValuationEngine([benchmark], additionalRevenues);

    // Calculate DCF valuation
    const { dcfValue, projections } = valuationEngine.calculateDCFValuation(
      annualStreams,
      benchmark.streams_to_revenue,
      discountRate
    );

    // Calculate risk-adjusted valuation
    const playlistCount = playlistPlacements?.data?.length || 0;
    const riskAdjustedValue = valuationEngine.calculateRiskAdjustedValue(
      dcfValue,
      currentMonthlyListeners,
      primaryGenre,
      artist.cm_artist_rank,
      playlistCount
    );

    // Calculate confidence score
    const dataRecency = hasRealData ? 1 : 30; // Assume fresh data if available, otherwise old
    const confidenceScore = valuationEngine.calculateConfidenceScore(
      hasRealData,
      (streamingStats?.data?.length || 0) > 10, // Has historical data
      playlistCount > 0,
      dataRecency,
      currentMonthlyListeners
    );

    // Enhanced response with real Chartmetric data
    const response = {
      // Basic artist info
      artist_name: artist.name,
      chartmetric_id: artist.id,
      primary_genre: primaryGenre,
      
      // Real streaming metrics
      monthly_listeners: currentMonthlyListeners,
      monthly_streams: currentMonthlyStreams,
      annual_streams: annualStreams,
      ltm_revenue: Math.round(ltmRevenue),
      
      // Enhanced social metrics
      social_metrics: {
        spotify_followers: artist.followers?.spotify || 0,
        instagram_followers: artist.followers?.instagram || 0,
        youtube_subscribers: artist.followers?.youtube || 0,
        facebook_likes: artist.followers?.facebook || 0,
        twitter_followers: artist.followers?.twitter || 0,
        chartmetric_rank: artist.cm_artist_rank || null,
        engagement_rate: artist.engagement_rate || null
      },
      
      // Playlist and chart data
      playlist_metrics: {
        total_placements: playlistCount,
        major_playlist_placements: playlistPlacements?.data?.filter(p => p.followers > 100000).length || 0,
        total_reach: playlistPlacements?.data?.reduce((sum, p) => sum + p.reach, 0) || 0
      },
      
      // Valuation results
      valuation_results: {
        dcf_valuation: Math.round(dcfValue),
        risk_adjusted_valuation: Math.round(riskAdjustedValue),
        confidence_score: Math.round(confidenceScore),
        methodology: 'chartmetric_enhanced_dcf'
      },
      
      // Financial projections
      cash_flow_projections: projections,
      
      // Data quality indicators
      data_quality: {
        has_real_streaming_data: hasRealData,
        has_historical_data: (streamingStats?.data?.length || 0) > 10,
        has_playlist_data: playlistCount > 0,
        data_source: 'chartmetric',
        last_updated: new Date().toISOString()
      },
      
      // Industry benchmarks used
      benchmark_data: benchmark,
      
      // Historical performance (if available)
      historical_performance: streamingStats?.data?.slice(-6).map(d => ({
        date: d.timestp,
        monthly_listeners: d.spotify_monthly_listeners,
        streams: d.spotify_streams,
        youtube_views: d.youtube_views
      })) || []
    };

    console.log(`[CHARTMETRIC-VALUATION] Valuation completed - DCF: $${Math.round(dcfValue)}, Risk-adjusted: $${Math.round(riskAdjustedValue)}, Confidence: ${Math.round(confidenceScore)}%`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[CHARTMETRIC-VALUATION] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});