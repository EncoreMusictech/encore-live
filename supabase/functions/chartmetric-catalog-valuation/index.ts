import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface definitions for Chartmetric API responses
interface ChartmetricArtist {
  id: number
  name: string
  image_url?: string
  spotify_popularity_score?: number
  spotify_followers?: number
  apple_music_id?: string
  youtube_channel_id?: string
  genres?: string[]
}

interface ChartmetricStreamingStats {
  spotify?: {
    monthly_listeners?: number
    followers?: number
    popularity_score?: number
  }
  apple_music?: {
    followers?: number
  }
  youtube?: {
    subscribers?: number
    views?: number
  }
}

interface ChartmetricTrack {
  id: number
  name: string
  artist_names: string[]
  spotify_popularity?: number
  spotify_streams?: number
  release_date?: string
  isrc?: string
}

interface IndustryBenchmark {
  genre: string
  avg_multiple: number
  min_multiple: number
  max_multiple: number
  risk_factor: number
  streams_to_revenue_ratio: number
  growth_rate: number
}

interface CashFlowProjection {
  year: number
  projected_streams: number
  gross_revenue: number
  net_revenue: number
  growth_rate: number
}

// Chartmetric API Configuration
const CHARTMETRIC_API_BASE = 'https://api.chartmetric.com/api'

class ChartmetricClient {
  private accessToken: string | null = null
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${CHARTMETRIC_API_BASE}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshtoken: this.apiKey
        })
      })

      if (!response.ok) {
        throw new Error(`Chartmetric auth failed: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.token
      console.log('Chartmetric authentication successful')
    } catch (error) {
      console.error('Chartmetric authentication error:', error)
      throw new Error('Failed to authenticate with Chartmetric API')
    }
  }

  async searchArtist(artistName: string): Promise<ChartmetricArtist | null> {
    if (!this.accessToken) {
      await this.authenticate()
    }

    try {
      const response = await fetch(
        `${CHARTMETRIC_API_BASE}/search?q=${encodeURIComponent(artistName)}&type=artists&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Artist search failed: ${response.status}`)
      }

      const data = await response.json()
      return data.obj?.artists?.[0] || null
    } catch (error) {
      console.error('Artist search error:', error)
      return null
    }
  }

  async getArtistStreamingStats(artistId: number): Promise<ChartmetricStreamingStats> {
    if (!this.accessToken) {
      await this.authenticate()
    }

    const stats: ChartmetricStreamingStats = {}

    try {
      // Get Spotify stats
      const spotifyResponse = await fetch(
        `${CHARTMETRIC_API_BASE}/artist/${artistId}/stat/spotify`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json()
        const latestStats = spotifyData.obj?.data?.[spotifyData.obj.data.length - 1]
        if (latestStats) {
          stats.spotify = {
            monthly_listeners: latestStats.monthly_listeners || 0,
            followers: latestStats.followers || 0,
            popularity_score: latestStats.popularity || 0
          }
        }
      }

      // Get Apple Music stats
      try {
        const appleResponse = await fetch(
          `${CHARTMETRIC_API_BASE}/artist/${artistId}/stat/applemusic`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        )

        if (appleResponse.ok) {
          const appleData = await appleResponse.json()
          const latestAppleStats = appleData.obj?.data?.[appleData.obj.data.length - 1]
          if (latestAppleStats) {
            stats.apple_music = {
              followers: latestAppleStats.followers || 0
            }
          }
        }
      } catch (error) {
        console.log('Apple Music stats not available:', error)
      }

      // Get YouTube stats
      try {
        const youtubeResponse = await fetch(
          `${CHARTMETRIC_API_BASE}/artist/${artistId}/stat/youtube`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        )

        if (youtubeResponse.ok) {
          const youtubeData = await youtubeResponse.json()
          const latestYouTubeStats = youtubeData.obj?.data?.[youtubeData.obj.data.length - 1]
          if (latestYouTubeStats) {
            stats.youtube = {
              subscribers: latestYouTubeStats.subscribers || 0,
              views: latestYouTubeStats.views || 0
            }
          }
        }
      } catch (error) {
        console.log('YouTube stats not available:', error)
      }

    } catch (error) {
      console.error('Error fetching streaming stats:', error)
    }

    return stats
  }

  async getTopTracks(artistId: number, limit: number = 10): Promise<ChartmetricTrack[]> {
    if (!this.accessToken) {
      await this.authenticate()
    }

    try {
      const response = await fetch(
        `${CHARTMETRIC_API_BASE}/artist/${artistId}/tracks-chart-performances?since=2023-01-01&until=${new Date().toISOString().split('T')[0]}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        console.log(`Top tracks request failed: ${response.status}`)
        return []
      }

      const data = await response.json()
      return data.obj?.data || []
    } catch (error) {
      console.error('Error fetching top tracks:', error)
      return []
    }
  }
}

// Genre normalization function
function normalizeGenre(genres: string[]): string {
  const genreMap: Record<string, string> = {
    'hip hop': 'Hip-Hop',
    'rap': 'Hip-Hop',
    'hip-hop': 'Hip-Hop',
    'pop': 'Pop',
    'r&b': 'R&B',
    'rnb': 'R&B',
    'electronic': 'Electronic',
    'edm': 'Electronic',
    'dance': 'Electronic',
    'rock': 'Rock',
    'alternative': 'Alternative',
    'indie': 'Alternative',
    'country': 'Country',
    'folk': 'Folk',
    'classical': 'Classical',
    'jazz': 'Jazz'
  }

  for (const genre of genres) {
    const normalized = genre.toLowerCase()
    for (const [key, value] of Object.entries(genreMap)) {
      if (normalized.includes(key)) {
        return value
      }
    }
  }

  return 'Pop' // Default fallback
}

// Valuation Engine for advanced calculations
class ValuationEngine {
  calculateDCFValuation(
    currentStreams: number,
    revenuePerStream: number,
    discountRate: number = 0.12,
    terminalGrowthRate: number = 0.02,
    years: number = 10
  ): { dcfValue: number, projections: CashFlowProjection[] } {
    const projections: CashFlowProjection[] = []
    let presentValue = 0

    for (let year = 1; year <= years; year++) {
      const decayRate = Math.max(0.05, 0.15 - (year * 0.01)) // Gradual decay improvement
      const projectedStreams = currentStreams * Math.pow(1 - decayRate, year)
      const grossRevenue = projectedStreams * revenuePerStream
      const netRevenue = grossRevenue * 0.7 // Platform fees
      const discountFactor = Math.pow(1 + discountRate, year)
      
      presentValue += netRevenue / discountFactor

      projections.push({
        year,
        projected_streams: Math.round(projectedStreams),
        gross_revenue: Math.round(grossRevenue),
        net_revenue: Math.round(netRevenue),
        growth_rate: -decayRate
      })
    }

    // Terminal value
    const terminalCashFlow = projections[projections.length - 1].net_revenue * (1 + terminalGrowthRate)
    const terminalValue = terminalCashFlow / (discountRate - terminalGrowthRate)
    const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, years)

    presentValue += discountedTerminalValue

    return {
      dcfValue: Math.round(presentValue),
      projections
    }
  }

  calculateRiskAdjustedValue(
    baseValue: number,
    popularityScore: number,
    genreRiskFactor: number,
    platformDiversification: number = 1.0
  ): number {
    // Popularity adjustment (0-100 scale)
    const popularityMultiplier = Math.max(0.6, Math.min(1.4, 0.6 + (popularityScore / 100) * 0.8))
    
    // Genre risk adjustment
    const genreMultiplier = 1 / (1 + genreRiskFactor)
    
    // Platform diversification bonus
    const diversificationBonus = Math.min(1.2, platformDiversification)
    
    return Math.round(baseValue * popularityMultiplier * genreMultiplier * diversificationBonus)
  }

  calculateConfidenceScore(
    monthlyListeners: number,
    hasAppleMusic: boolean,
    hasYouTube: boolean,
    trackCount: number
  ): number {
    let confidence = 60 // Base confidence for Chartmetric real data
    
    // Monthly listeners boost
    if (monthlyListeners > 10000000) confidence += 25
    else if (monthlyListeners > 1000000) confidence += 20
    else if (monthlyListeners > 100000) confidence += 15
    else if (monthlyListeners > 10000) confidence += 10
    
    // Platform diversification
    if (hasAppleMusic) confidence += 5
    if (hasYouTube) confidence += 5
    
    // Track availability
    if (trackCount > 50) confidence += 5
    else if (trackCount > 20) confidence += 3
    
    return Math.min(100, confidence)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { artistName } = await req.json()

    if (!artistName) {
      return new Response(
        JSON.stringify({ error: 'Artist name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Starting Chartmetric valuation for: ${artistName}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Chartmetric API key
    const chartmetricApiKey = Deno.env.get('CHARTMETRIC_API_KEY')
    if (!chartmetricApiKey) {
      throw new Error('Chartmetric API key not configured')
    }

    // Initialize Chartmetric client
    const chartmetric = new ChartmetricClient(chartmetricApiKey)
    
    // Search for artist
    const artist = await chartmetric.searchArtist(artistName)
    if (!artist) {
      return new Response(
        JSON.stringify({ 
          error: 'Artist not found in Chartmetric database',
          suggestion: 'Try searching with the exact artist name or check spelling' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found artist: ${artist.name} (ID: ${artist.id})`)

    // Get streaming statistics
    const streamingStats = await chartmetric.getArtistStreamingStats(artist.id)
    const topTracks = await chartmetric.getTopTracks(artist.id, 10)

    // Determine primary genre
    const primaryGenre = normalizeGenre(artist.genres || ['pop'])
    
    // Get industry benchmarks
    const { data: benchmarks } = await supabase
      .from('industry_benchmarks')
      .select('*')
      .eq('genre', primaryGenre)
      .single()

    // Default benchmark if not found
    const defaultBenchmark: IndustryBenchmark = {
      genre: primaryGenre,
      avg_multiple: 10,
      min_multiple: 8,
      max_multiple: 12,
      risk_factor: 0.15,
      streams_to_revenue_ratio: 0.003,
      growth_rate: 0.05
    }

    const benchmark = benchmarks || defaultBenchmark

    // Calculate core metrics from Chartmetric data
    const monthlyListeners = streamingStats.spotify?.monthly_listeners || 0
    const popularityScore = streamingStats.spotify?.popularity_score || 50
    
    // Estimate annual streams (monthly listeners * 12 months * average plays per month)
    const estimatedAnnualStreams = monthlyListeners * 12 * 3.5 // Conservative estimate
    
    // Calculate LTM revenue
    const ltmRevenue = estimatedAnnualStreams * benchmark.streams_to_revenue_ratio

    // Initialize Valuation Engine
    const engine = new ValuationEngine()

    // Calculate DCF valuation
    const { dcfValue, projections } = engine.calculateDCFValuation(
      estimatedAnnualStreams,
      benchmark.streams_to_revenue_ratio,
      0.12 + benchmark.risk_factor
    )

    // Calculate platform diversification factor
    const platformDiversification = 1.0 + 
      (streamingStats.apple_music?.followers ? 0.1 : 0) + 
      (streamingStats.youtube?.subscribers ? 0.1 : 0)

    // Risk-adjusted valuation
    const riskAdjustedValue = engine.calculateRiskAdjustedValue(
      dcfValue,
      popularityScore,
      benchmark.risk_factor,
      platformDiversification
    )

    // Multiple-based valuation
    const multipleValuation = Math.round(ltmRevenue * benchmark.avg_multiple)

    // Blended valuation (60% DCF, 40% Multiple)
    const blendedValuation = Math.round((dcfValue * 0.6) + (multipleValuation * 0.4))

    // Calculate confidence score
    const confidenceScore = engine.calculateConfidenceScore(
      monthlyListeners,
      !!streamingStats.apple_music?.followers,
      !!streamingStats.youtube?.subscribers,
      topTracks.length
    )

    // Format top tracks for response
    const formattedTracks = topTracks.slice(0, 10).map((track, index) => ({
      name: track.name,
      artist: track.artist_names.join(', '),
      popularity: track.spotify_popularity || 50,
      estimated_streams: track.spotify_streams || Math.round(monthlyListeners * (1 - index * 0.1) * 0.3),
      position: index + 1
    }))

    // Prepare response data
    const responseData = {
      artist: {
        name: artist.name,
        id: artist.id,
        image_url: artist.image_url,
        genres: artist.genres || [primaryGenre],
        data_source: 'Chartmetric'
      },
      streaming_stats: {
        monthly_listeners: monthlyListeners,
        spotify_followers: streamingStats.spotify?.followers || 0,
        apple_music_followers: streamingStats.apple_music?.followers || 0,
        youtube_subscribers: streamingStats.youtube?.subscribers || 0,
        youtube_views: streamingStats.youtube?.views || 0,
        platform_count: Object.keys(streamingStats).length
      },
      valuation: {
        primary_valuation: riskAdjustedValue,
        dcf_valuation: dcfValue,
        multiple_valuation: multipleValuation,
        blended_valuation: blendedValuation,
        ltm_revenue: Math.round(ltmRevenue),
        currency: 'USD'
      },
      analytics: {
        confidence_score: confidenceScore,
        popularity_score: popularityScore,
        primary_genre: primaryGenre,
        platform_diversification_score: Math.round(platformDiversification * 100),
        data_quality: 'Real-time data from Chartmetric',
        last_updated: new Date().toISOString()
      },
      projections: {
        cash_flows: projections.slice(0, 5), // First 5 years
        methodology: 'DCF with real streaming data and platform diversification',
        assumptions: {
          discount_rate: 0.12 + benchmark.risk_factor,
          terminal_growth_rate: 0.02,
          platform_fee_deduction: 0.30
        }
      },
      top_tracks: formattedTracks,
      benchmarks: {
        genre: benchmark.genre,
        industry_multiple: `${benchmark.min_multiple}x - ${benchmark.max_multiple}x`,
        average_multiple: `${benchmark.avg_multiple}x`,
        genre_growth_rate: `${(benchmark.growth_rate * 100).toFixed(1)}%`,
        risk_factor: benchmark.risk_factor
      },
      data_sources: {
        primary: 'Chartmetric API',
        real_time_data: true,
        last_sync: new Date().toISOString(),
        platforms_covered: ['Spotify', 'Apple Music', 'YouTube Music', 'Charts']
      }
    }

    console.log(`Valuation completed: $${riskAdjustedValue.toLocaleString()} (Confidence: ${confidenceScore}%)`)

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chartmetric valuation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Valuation calculation failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestion: 'Please check the artist name and try again'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})