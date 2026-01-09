import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartmetricToken {
  token: string;
  expiresAt: number;
}

let cachedToken: ChartmetricToken | null = null;

async function getAccessToken(): Promise<string> {
  const refreshToken = Deno.env.get('CHARTMETRIC_API_KEY');
  if (!refreshToken) {
    throw new Error('CHARTMETRIC_API_KEY (refresh token) not configured');
  }

  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300000) {
    return cachedToken.token;
  }

  console.log('Fetching new Chartmetric access token...');
  console.log('Using refresh token starting with:', refreshToken.substring(0, 10) + '...');
  
  const response = await fetch('https://api.chartmetric.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshtoken: refreshToken }),
  });

  const responseText = await response.text();
  console.log('Chartmetric token response status:', response.status);
  console.log('Chartmetric token response:', responseText.substring(0, 200));

  if (!response.ok) {
    console.error('Chartmetric token error:', responseText);
    throw new Error(`Failed to get Chartmetric token: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  
  if (!data.token) {
    console.error('No token in response:', data);
    throw new Error('Chartmetric response missing token - ensure you are using the REFRESH TOKEN, not API key');
  }
  
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  console.log('Chartmetric token obtained successfully');
  return cachedToken.token;
}

async function chartmetricRequest(endpoint: string, token: string): Promise<any> {
  const response = await fetch(`https://api.chartmetric.com/api${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Chartmetric API error for ${endpoint}:`, error);
    throw new Error(`Chartmetric API error: ${response.status}`);
  }

  return response.json();
}

async function searchArtist(query: string, token: string): Promise<any> {
  const encoded = encodeURIComponent(query);
  const data = await chartmetricRequest(`/search?q=${encoded}&type=artists&limit=10`, token);
  return data.obj?.artists || [];
}

async function getArtistById(artistId: string, token: string): Promise<any> {
  const data = await chartmetricRequest(`/artist/${artistId}`, token);
  return data.obj;
}

async function getSpotifyStats(artistId: string, token: string): Promise<any> {
  try {
    const data = await chartmetricRequest(`/artist/${artistId}/stat/spotify?latest=true`, token);
    return data.obj || null;
  } catch (e) {
    console.warn('Could not fetch Spotify stats:', e);
    return null;
  }
}

async function getSpotifyListeners(artistId: string, token: string): Promise<any> {
  try {
    const data = await chartmetricRequest(`/artist/${artistId}/where-people-listen/spotify?latest=true`, token);
    return data.obj || null;
  } catch (e) {
    console.warn('Could not fetch listener geography:', e);
    return null;
  }
}

async function getPlaylists(artistId: string, token: string): Promise<any> {
  try {
    const data = await chartmetricRequest(`/artist/${artistId}/playlists/spotify?status=current&limit=20`, token);
    return data.obj || [];
  } catch (e) {
    console.warn('Could not fetch playlists:', e);
    return [];
  }
}

async function getSocialStats(artistId: string, token: string): Promise<any> {
  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter'];
  const stats: Record<string, any> = {};

  for (const platform of platforms) {
    try {
      const data = await chartmetricRequest(`/artist/${artistId}/stat/${platform}?latest=true`, token);
      stats[platform] = data.obj || null;
    } catch (e) {
      console.warn(`Could not fetch ${platform} stats:`, e);
      stats[platform] = null;
    }
  }

  return stats;
}

async function getChartHistory(artistId: string, token: string): Promise<any> {
  try {
    const data = await chartmetricRequest(`/artist/${artistId}/charts?type=spotify_top_tracks&limit=50`, token);
    return data.obj || [];
  } catch (e) {
    console.warn('Could not fetch chart history:', e);
    return [];
  }
}

async function getCareerMetrics(artistId: string, token: string): Promise<any> {
  try {
    const data = await chartmetricRequest(`/artist/${artistId}/career`, token);
    return data.obj || null;
  } catch (e) {
    console.warn('Could not fetch career metrics:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, artistName, artistId } = await req.json();
    
    console.log(`Chartmetric request: ${action} for ${artistName || artistId}`);

    const token = await getAccessToken();

    let result: any = {};

    switch (action) {
      case 'search': {
        if (!artistName) {
          throw new Error('artistName is required for search');
        }
        const artists = await searchArtist(artistName, token);
        result = { artists };
        break;
      }

      case 'full-analytics': {
        if (!artistId) {
          throw new Error('artistId is required for full-analytics');
        }

        // Fetch all data in parallel for performance
        const [artist, spotifyStats, listeners, playlists, socialStats, charts, career] = 
          await Promise.all([
            getArtistById(artistId, token),
            getSpotifyStats(artistId, token),
            getSpotifyListeners(artistId, token),
            getPlaylists(artistId, token),
            getSocialStats(artistId, token),
            getChartHistory(artistId, token),
            getCareerMetrics(artistId, token),
          ]);

        result = {
          artist,
          spotify: {
            stats: spotifyStats,
            listeners,
            playlists,
          },
          social: socialStats,
          charts,
          career,
        };
        break;
      }

      case 'spotify-stats': {
        if (!artistId) {
          throw new Error('artistId is required');
        }
        const [stats, listeners, playlists] = await Promise.all([
          getSpotifyStats(artistId, token),
          getSpotifyListeners(artistId, token),
          getPlaylists(artistId, token),
        ]);
        result = { stats, listeners, playlists };
        break;
      }

      case 'social-stats': {
        if (!artistId) {
          throw new Error('artistId is required');
        }
        result = await getSocialStats(artistId, token);
        break;
      }

      case 'chart-history': {
        if (!artistId) {
          throw new Error('artistId is required');
        }
        result = await getChartHistory(artistId, token);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Chartmetric ${action} completed successfully`);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chartmetric function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
