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

interface ForecastYear {
  year: number;
  streams: number;
  revenue: number;
  valuation: number;
}

interface ScenarioForecasts {
  pessimistic: ForecastYear[];
  base: ForecastYear[];
  optimistic: ForecastYear[];
}

interface ScenarioValuations {
  pessimistic: { current: number; year5: number; cagr: string };
  base: { current: number; year5: number; cagr: string };
  optimistic: { current: number; year5: number; cagr: string };
}

interface ComparableArtist {
  name: string;
  valuation: number;
  followers: number;
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
  forecasts: ScenarioForecasts;
  valuations: ScenarioValuations;
  fair_market_value: { low: number; mid: number; high: number };
  comparable_artists: ComparableArtist[];
  growth_metrics: {
    estimated_cagr: number;
    industry_growth: number;
    base_multiple: number;
  };
}

const CatalogValuation = () => {
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<"pessimistic" | "base" | "optimistic">("base");
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

  const generateReport = () => {
    if (!result) return;
    
    const reportData = {
      artist: result.artist_name,
      date: new Date().toLocaleDateString(),
      valuation: result.fair_market_value,
      forecasts: result.forecasts,
      comparables: result.comparable_artists,
      growth: result.growth_metrics
    };
    
    // Create a simple text report (in production, would generate PDF)
    const reportText = `
CATALOG VALUATION REPORT
Artist: ${reportData.artist}
Generated: ${reportData.date}

FAIR MARKET VALUE RANGE:
Low: ${formatCurrency(reportData.valuation.low)}
Mid: ${formatCurrency(reportData.valuation.mid)}
High: ${formatCurrency(reportData.valuation.high)}

5-YEAR FORECAST (BASE CASE):
${result.forecasts.base.map(year => 
  `Year ${year.year}: ${formatCurrency(year.valuation)} (${formatNumber(year.streams)} streams)`
).join('\\n')}

GROWTH METRICS:
Estimated CAGR: ${reportData.growth.estimated_cagr.toFixed(1)}%
Industry Growth: ${reportData.growth.industry_growth.toFixed(1)}%
Valuation Multiple: ${reportData.growth.base_multiple}x

COMPARABLE ARTISTS:
${reportData.comparables.map(comp => 
  `${comp.name}: ${formatCurrency(comp.valuation)} (${formatNumber(comp.followers)} followers)`
).join('\\n')}
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.artist_name.replace(/\\s+/g, '_')}_catalog_valuation_report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: "Catalog valuation report has been downloaded successfully",
    });
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-music-purple" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Fair Market Value</p>
                    <p className="text-lg font-bold text-music-purple">
                      {formatCurrency(result.fair_market_value.low)} - {formatCurrency(result.fair_market_value.high)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mid: {formatCurrency(result.fair_market_value.mid)}
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
                    <p className="text-sm font-medium leading-none">Estimated CAGR</p>
                    <p className="text-2xl font-bold">
                      {result.growth_metrics.estimated_cagr.toFixed(1)}%
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenario Analysis */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>5-Year Valuation Forecast</CardTitle>
                  <div className="flex gap-2">
                    {(["pessimistic", "base", "optimistic"] as const).map((scenario) => (
                      <Button
                        key={scenario}
                        variant={selectedScenario === scenario ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedScenario(scenario)}
                        className="capitalize"
                      >
                        {scenario === "base" ? "Base Case" : scenario}
                      </Button>
                    ))}
                  </div>
                </div>
                <CardDescription>
                  {selectedScenario === "pessimistic" && "Conservative growth assumptions"}
                  {selectedScenario === "base" && "Realistic growth expectations based on current metrics"}
                  {selectedScenario === "optimistic" && "Aggressive growth potential"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Current Valuation</p>
                      <p className="text-xl font-bold text-music-purple">
                        {formatCurrency(result.valuations[selectedScenario].current)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Year 5 Valuation</p>
                      <p className="text-xl font-bold text-music-purple">
                        {formatCurrency(result.valuations[selectedScenario].year5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">5-Year CAGR</p>
                      <p className="text-xl font-bold text-green-600">
                        {result.valuations[selectedScenario].cagr}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Return</p>
                      <p className="text-xl font-bold text-green-600">
                        {(((result.valuations[selectedScenario].year5 / result.valuations[selectedScenario].current) - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Year-by-Year Breakdown</p>
                    {result.forecasts[selectedScenario].map((year) => (
                      <div key={year.year} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Year {year.year}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(year.streams)} streams
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(year.valuation)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(year.revenue)} revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparable Artists */}
            <Card>
              <CardHeader>
                <CardTitle>Comparable Artists</CardTitle>
                <CardDescription>Market-based valuation benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.comparable_artists.map((comp, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="font-medium">{comp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(comp.followers)} followers
                      </p>
                      <p className="font-bold text-music-purple">
                        {formatCurrency(comp.valuation)}
                      </p>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                    <p className="text-sm font-medium">Valuation Multiple Range</p>
                    <p className="text-lg font-bold">
                      {result.growth_metrics.base_multiple}x Revenue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Download Report */}
          <Card>
            <CardHeader>
              <CardTitle>Valuation Report</CardTitle>
              <CardDescription>
                Comprehensive analysis for pitching, sales, and investor presentations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Download Complete Report</p>
                  <p className="text-sm text-muted-foreground">
                    Includes forecasts, comparables, and detailed methodology
                  </p>
                </div>
                <Button onClick={generateReport} className="bg-gradient-primary text-primary-foreground">
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Artist Information & Top Tracks */}
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
                    {result.spotify_data.genres.length > 0 ? (
                      result.spotify_data.genres.map((genre, index) => (
                        <Badge key={index} variant="secondary">
                          {genre}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">Genre data unavailable</Badge>
                    )}
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
        </>
      )}
    </div>
  );
};

export default CatalogValuation;