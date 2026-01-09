import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Music, 
  Users, 
  TrendingUp, 
  Instagram, 
  Youtube,
  Globe,
  ListMusic,
  RefreshCw
} from 'lucide-react';
import { useChartmetric, ChartmetricAnalytics, ChartmetricArtist } from '@/hooks/useChartmetric';

interface ChartmetricInsightsProps {
  artistName: string;
  onDataLoaded?: (data: ChartmetricAnalytics) => void;
}

export function ChartmetricInsights({ artistName, onDataLoaded }: ChartmetricInsightsProps) {
  const { loading, error, searchArtist, getFullAnalytics } = useChartmetric();
  const [analytics, setAnalytics] = useState<ChartmetricAnalytics | null>(null);
  const [searchResults, setSearchResults] = useState<ChartmetricArtist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ChartmetricArtist | null>(null);

  const handleSearch = async () => {
    const results = await searchArtist(artistName);
    setSearchResults(results);
    
    // Auto-select first result if exact match
    const exactMatch = results.find(
      a => a.name.toLowerCase() === artistName.toLowerCase()
    );
    if (exactMatch) {
      handleSelectArtist(exactMatch);
    }
  };

  const handleSelectArtist = async (artist: ChartmetricArtist) => {
    setSelectedArtist(artist);
    const data = await getFullAnalytics(artist.id);
    if (data) {
      setAnalytics(data);
      onDataLoaded?.(data);
    }
  };

  const formatNumber = (num?: number): string => {
    if (!num) return 'N/A';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  if (!analytics && !loading && searchResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Chartmetric Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Fetch real-time streaming analytics and market data for this artist.
          </p>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Load Chartmetric Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Loading Chartmetric Data...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (searchResults.length > 0 && !selectedArtist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Artist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Multiple artists found. Please select the correct one:
          </p>
          <div className="space-y-2">
            {searchResults.slice(0, 5).map((artist) => (
              <Button
                key={artist.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSelectArtist(artist)}
              >
                <Music className="h-4 w-4 mr-2" />
                {artist.name}
                {artist.spotify_monthly_listeners && (
                  <Badge variant="secondary" className="ml-auto">
                    {formatNumber(artist.spotify_monthly_listeners)} listeners
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <BarChart3 className="h-5 w-5" />
            Chartmetric Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleSearch} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const spotify = analytics.spotify?.stats;
  const social = analytics.social;
  const playlists = analytics.spotify?.playlists || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Chartmetric Insights
          {analytics.artist?.cm_artist_rank && (
            <Badge variant="outline" className="ml-2">
              Rank #{analytics.artist.cm_artist_rank.toLocaleString()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Spotify Stats */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Music className="h-4 w-4 text-green-500" />
            Spotify Metrics
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Monthly Listeners</div>
              <div className="text-lg font-semibold">{formatNumber(spotify?.monthly_listeners)}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Followers</div>
              <div className="text-lg font-semibold">{formatNumber(spotify?.followers)}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Popularity</div>
              <div className="text-lg font-semibold">{spotify?.popularity || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Playlist Placements */}
        {playlists.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-purple-500" />
              Current Playlist Placements ({playlists.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {playlists.slice(0, 5).map((pl, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{pl.name}</span>
                    {pl.is_editorial && (
                      <Badge variant="secondary" className="text-xs">Editorial</Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">{formatNumber(pl.followers)} followers</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Stats */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            Social Media
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {social?.instagram?.followers && (
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                <Instagram className="h-4 w-4 text-pink-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Instagram</div>
                  <div className="font-medium">{formatNumber(social.instagram.followers)}</div>
                </div>
              </div>
            )}
            {social?.youtube?.subscribers && (
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                <Youtube className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-xs text-muted-foreground">YouTube</div>
                  <div className="font-medium">{formatNumber(social.youtube.subscribers)}</div>
                </div>
              </div>
            )}
            {social?.tiktok?.followers && (
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                <TrendingUp className="h-4 w-4" />
                <div>
                  <div className="text-xs text-muted-foreground">TikTok</div>
                  <div className="font-medium">{formatNumber(social.tiktok.followers)}</div>
                </div>
              </div>
            )}
            {social?.twitter?.followers && (
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                <Users className="h-4 w-4 text-sky-500" />
                <div>
                  <div className="text-xs text-muted-foreground">X (Twitter)</div>
                  <div className="font-medium">{formatNumber(social.twitter.followers)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Career Stage */}
        {analytics.career && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Career Stage</span>
              <Badge>{analytics.career.stage || 'Emerging'}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
