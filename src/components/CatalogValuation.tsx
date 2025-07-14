import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, DollarSign, Users, Music, TrendingUp } from "lucide-react";

interface TopTrack {
  name: string;
  popularity: number;
  spotify_url: string;
}

interface ValuationResult {
  artist_name: string;
  total_streams: number;
  monthly_listeners: number;
  top_tracks: TopTrack[];
  valuation_amount: number;
  currency: string;
  spotify_data: {
    artist_id: string;
    genres: string[];
    popularity: number;
    followers: number;
  };
}

const CatalogValuation = () => {
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!artistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an artist name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log("Calling Spotify catalog valuation function...");
      
      const { data, error } = await supabase.functions.invoke('spotify-catalog-valuation', {
        body: { artistName: artistName.trim() }
      });

      if (error) {
        console.error("Function error:", error);
        throw new Error(error.message || 'Failed to get catalog valuation');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("Valuation result:", data);
      setResult(data);

      // Save to database (user would need to be authenticated)
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { error: saveError } = await supabase
          .from('catalog_valuations')
          .insert({
            user_id: user.user.id,
            artist_name: data.artist_name,
            total_streams: data.total_streams,
            monthly_listeners: data.monthly_listeners,
            top_tracks: data.top_tracks,
            valuation_amount: data.valuation_amount,
            currency: data.currency
          });

        if (saveError) {
          console.error("Error saving valuation:", saveError);
        }
      }

      toast({
        title: "Success",
        description: `Catalog valuation completed for ${data.artist_name}`,
      });
    } catch (error) {
      console.error("Catalog valuation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get catalog valuation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-music-purple" />
            Catalog Valuation
          </CardTitle>
          <CardDescription>
            Get estimated streaming data and catalog valuation for any artist using Spotify data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter artist or songwriter name..."
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loading}
            />
            <Button onClick={handleSearch} disabled={loading || !artistName.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-music-purple" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Estimated Valuation</p>
                  <p className="text-2xl font-bold text-music-purple">
                    {formatCurrency(result.valuation_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Music className="h-4 w-4 text-music-purple" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Streams</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(result.total_streams)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-music-purple" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Monthly Listeners</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(result.monthly_listeners)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-music-purple" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Popularity Score</p>
                  <p className="text-2xl font-bold">
                    {result.spotify_data.popularity}/100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Artist Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-lg">{result.artist_name}</p>
                <p className="text-muted-foreground">
                  {formatNumber(result.spotify_data.followers)} followers on Spotify
                </p>
              </div>
              
              <div>
                <p className="font-medium mb-2">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {result.spotify_data.genres.map((genre, index) => (
                    <Badge key={index} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Tracks</CardTitle>
              <CardDescription>Most popular tracks on Spotify</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.top_tracks.slice(0, 5).map((track, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                    <div>
                      <p className="font-medium">{track.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Popularity: {track.popularity}/100
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(track.spotify_url, '_blank')}
                    >
                      Listen
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CatalogValuation;