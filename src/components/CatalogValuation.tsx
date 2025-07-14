import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Download, TrendingUp, DollarSign, Users, BarChart3, Music, Target, PieChart, Calculator, Shield, Star, Zap, Brain } from "lucide-react";

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
  popularity: number;
  genres?: string[];
  spotify_id?: string;
}

interface CashFlowProjection {
  year: number;
  revenue: number;
  growth: number;
  discountedValue: number;
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
  // Advanced metrics
  ltm_revenue?: number;
  catalog_age_years?: number;
  genre?: string;
  popularity_score?: number;
  discount_rate?: number;
  dcf_valuation?: number;
  multiple_valuation?: number;
  risk_adjusted_value?: number;
  confidence_score?: number;
  valuation_methodology?: string;
  cash_flow_projections?: CashFlowProjection[];
  industry_benchmarks?: {
    genre: string;
    revenue_multiple: number;
    risk_factor: number;
    growth_assumption: number;
  };
  comparable_multiples?: {
    ev_revenue_multiple: number;
    peer_average_multiple: number;
    market_premium_discount: number;
  };
}

interface ValuationParams {
  discountRate?: number;
  catalogAge?: number;
  methodology?: string;
}

const CatalogValuation = () => {
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<"pessimistic" | "base" | "optimistic">("base");
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [valuationParams, setValuationParams] = useState<ValuationParams>({
    discountRate: 0.12,
    catalogAge: 5,
    methodology: 'advanced'
  });
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
      console.log("Calling advanced Spotify catalog valuation function...");
      
      const { data, error } = await supabase.functions.invoke('spotify-catalog-valuation', {
        body: { 
          artistName: artistName.trim(),
          valuationParams
        }
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

      // Save enhanced data to database
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
            valuation_amount: data.risk_adjusted_value || data.valuation_amount,
            currency: data.currency,
            ltm_revenue: data.ltm_revenue,
            catalog_age_years: data.catalog_age_years,
            genre: data.genre,
            popularity_score: data.popularity_score,
            discount_rate: data.discount_rate,
            dcf_valuation: data.dcf_valuation,
            multiple_valuation: data.multiple_valuation,
            risk_adjusted_value: data.risk_adjusted_value,
            confidence_score: data.confidence_score,
            valuation_methodology: data.valuation_methodology,
            cash_flow_projections: data.cash_flow_projections,
            comparable_multiples: data.comparable_multiples
          });

        if (saveError) {
          console.error("Error saving valuation:", saveError);
        }
      }

      toast({
        title: "Success",
        description: `Advanced catalog valuation completed for ${data.artist_name}`,
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

  const generateAdvancedReport = () => {
    if (!result) return;
    
    const reportText = `
ADVANCED CATALOG VALUATION REPORT
=====================================
Artist: ${result.artist_name}
Generated: ${new Date().toLocaleDateString()}
Methodology: ${result.valuation_methodology || 'Advanced DCF with Risk Adjustment'}

EXECUTIVE SUMMARY
=================
Risk-Adjusted Valuation: ${formatCurrency(result.risk_adjusted_value || result.valuation_amount)}
DCF Valuation: ${formatCurrency(result.dcf_valuation || 0)}
Multiple-Based Valuation: ${formatCurrency(result.multiple_valuation || 0)}
Confidence Score: ${result.confidence_score || 0}/100

FAIR MARKET VALUE RANGE
========================
Low: ${formatCurrency(result.fair_market_value.low)}
Mid: ${formatCurrency(result.fair_market_value.mid)}
High: ${formatCurrency(result.fair_market_value.high)}

KEY METRICS
===========
Total Streams: ${formatNumber(result.total_streams)}
Monthly Listeners: ${formatNumber(result.monthly_listeners)}
LTM Revenue: ${formatCurrency(result.ltm_revenue || 0)}
Genre: ${result.genre || 'N/A'}
Popularity Score: ${result.popularity_score || result.spotify_data.popularity}/100
Catalog Age: ${result.catalog_age_years || 5} years

INDUSTRY BENCHMARKS
===================
${result.industry_benchmarks ? `
Genre: ${result.industry_benchmarks.genre}
Revenue Multiple: ${result.industry_benchmarks.revenue_multiple}x
Risk Factor: ${(result.industry_benchmarks.risk_factor * 100).toFixed(1)}%
Growth Assumption: ${(result.industry_benchmarks.growth_assumption * 100).toFixed(1)}%
` : 'Industry benchmarks not available'}

DCF ANALYSIS
============
Discount Rate: ${((result.discount_rate || 0.12) * 100).toFixed(1)}%
${result.cash_flow_projections ? 
  result.cash_flow_projections.map(cf => 
    `Year ${cf.year}: Revenue ${formatCurrency(cf.revenue)}, Growth ${cf.growth.toFixed(1)}%, PV ${formatCurrency(cf.discountedValue)}`
  ).join('\n') : 'Cash flow projections not available'}

5-YEAR FORECAST (BASE CASE)
===========================
${result.forecasts.base.map(year => 
  `Year ${year.year}: ${formatCurrency(year.valuation)} (${formatNumber(year.streams)} streams, ${formatCurrency(year.revenue)} revenue)`
).join('\n')}

COMPARABLE ARTISTS
==================
${result.comparable_artists.map(comp => 
  `${comp.name}: ${formatCurrency(comp.valuation)} (${formatNumber(comp.followers)} followers, ${comp.popularity}/100 popularity)`
).join('\n')}

RISK FACTORS & ASSUMPTIONS
==========================
- Market risk factor incorporated based on genre
- Age-adjusted valuation for catalog maturity
- Popularity-weighted growth assumptions
- Industry-specific revenue multiples applied

DISCLAIMER
==========
This valuation is for informational purposes only and should not be considered as investment advice. 
Actual market values may vary significantly based on numerous factors not captured in this analysis.
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.artist_name.replace(/\s+/g, '_')}_advanced_catalog_valuation_report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Advanced Report Downloaded",
      description: "Comprehensive catalog valuation report has been downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Advanced Catalog Valuation
          </CardTitle>
          <CardDescription>
            Professional-grade music IP valuation using DCF modeling, risk adjustment, and industry benchmarks
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
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading || !artistName.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
            >
              {showAdvancedInputs ? "Hide" : "Show"} Advanced Parameters
            </Button>
          </div>

          {showAdvancedInputs && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-secondary/30">
              <div className="space-y-2">
                <Label htmlFor="discount-rate">Discount Rate (%)</Label>
                <Input
                  id="discount-rate"
                  type="number"
                  min="8"
                  max="20"
                  step="0.5"
                  value={(valuationParams.discountRate || 0.12) * 100}
                  onChange={(e) => setValuationParams(prev => ({ 
                    ...prev, 
                    discountRate: parseFloat(e.target.value) / 100 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalog-age">Catalog Age (Years)</Label>
                <Input
                  id="catalog-age"
                  type="number"
                  min="1"
                  max="50"
                  value={valuationParams.catalogAge || 5}
                  onChange={(e) => setValuationParams(prev => ({ 
                    ...prev, 
                    catalogAge: parseInt(e.target.value) 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodology">Valuation Method</Label>
                <Select 
                  value={valuationParams.methodology || 'advanced'} 
                  onValueChange={(value) => setValuationParams(prev => ({ ...prev, methodology: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Multiple</SelectItem>
                    <SelectItem value="dcf">DCF Only</SelectItem>
                    <SelectItem value="advanced">Advanced (DCF + Risk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">DCF Analysis</TabsTrigger>
              <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
              <TabsTrigger value="comparables">Comparables</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Risk-Adjusted Value</p>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(result.risk_adjusted_value || result.valuation_amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">DCF Valuation</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(result.dcf_valuation || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Multiple Valuation</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(result.multiple_valuation || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-orange-600" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Confidence Score</p>
                        <p className="text-xl font-bold text-orange-600">
                          {result.confidence_score || 0}/100
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">LTM Revenue</p>
                        <p className="text-xl font-bold text-purple-600">
                          {formatCurrency(result.ltm_revenue || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Popularity</p>
                        <p className="text-xl font-bold text-yellow-600">
                          {result.popularity_score || result.spotify_data.popularity}/100
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Confidence Meter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Valuation Confidence Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Overall Confidence</span>
                        <span className="text-sm text-muted-foreground">{result.confidence_score || 0}%</span>
                      </div>
                      <Progress value={result.confidence_score || 0} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(result.confidence_score || 0) >= 80 && "High confidence - Strong data availability and market validation"}
                      {(result.confidence_score || 0) >= 60 && (result.confidence_score || 0) < 80 && "Moderate confidence - Good data but some limitations"}
                      {(result.confidence_score || 0) < 60 && "Lower confidence - Limited data or high market uncertainty"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Industry Benchmarks */}
              {result.industry_benchmarks && (
                <Card>
                  <CardHeader>
                    <CardTitle>Industry Benchmarks</CardTitle>
                    <CardDescription>Genre-specific market data for {result.industry_benchmarks.genre}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Revenue Multiple</p>
                        <p className="text-2xl font-bold">{result.industry_benchmarks.revenue_multiple}x</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Risk Factor</p>
                        <p className="text-2xl font-bold">{(result.industry_benchmarks.risk_factor * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Growth Rate</p>
                        <p className="text-2xl font-bold">{(result.industry_benchmarks.growth_assumption * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {/* DCF Components */}
              <Card>
                <CardHeader>
                  <CardTitle>Discounted Cash Flow Analysis</CardTitle>
                  <CardDescription>
                    Intrinsic value based on projected future cash flows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.cash_flow_projections && result.cash_flow_projections.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">Cash Flow Projections</h4>
                        {result.cash_flow_projections.map((cf) => (
                          <div key={cf.year} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">Year {cf.year}</p>
                              <p className="text-sm text-muted-foreground">
                                Growth: {cf.growth.toFixed(1)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(cf.revenue)}</p>
                              <p className="text-sm text-muted-foreground">
                                PV: {formatCurrency(cf.discountedValue)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Cash flow projections not available for this valuation</p>
                    )}
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Discount Rate</p>
                        <p className="text-xl font-bold">{((result.discount_rate || 0.12) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Valuation Method</p>
                        <p className="text-xl font-bold capitalize">{result.valuation_methodology || 'Advanced'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forecasts" className="space-y-6">
              {/* Traditional Forecast Analysis */}
              <Card>
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
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(result.valuations[selectedScenario].current)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Year 5 Valuation</p>
                        <p className="text-xl font-bold text-primary">
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
            </TabsContent>

            <TabsContent value="comparables" className="space-y-6">
              {/* Comparable Artists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comparable Artists</CardTitle>
                    <CardDescription>Market-based valuation benchmarks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.comparable_artists.map((comp, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{comp.name}</p>
                            {comp.spotify_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`https://open.spotify.com/artist/${comp.spotify_id}`, '_blank')}
                              >
                                View
                              </Button>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {formatNumber(comp.followers)} followers
                            </p>
                            {comp.popularity && (
                              <p className="text-sm text-muted-foreground">
                                Popularity: {comp.popularity}/100
                              </p>
                            )}
                            <p className="font-bold text-primary">
                              {formatCurrency(comp.valuation)}
                            </p>
                            {comp.genres && comp.genres.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {comp.genres.slice(0, 2).map((genre, genreIndex) => (
                                  <Badge key={genreIndex} variant="outline" className="text-xs">
                                    {genre}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Valuation Multiples</CardTitle>
                    <CardDescription>Market multiples and premiums</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.comparable_multiples ? (
                      <>
                        <div>
                          <p className="text-sm font-medium">EV/Revenue Multiple</p>
                          <p className="text-2xl font-bold">{result.comparable_multiples.ev_revenue_multiple.toFixed(1)}x</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Peer Average Multiple</p>
                          <p className="text-2xl font-bold">{result.comparable_multiples.peer_average_multiple.toFixed(1)}x</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Market Premium/Discount</p>
                          <p className={`text-2xl font-bold ${result.comparable_multiples.market_premium_discount > 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {((result.comparable_multiples.market_premium_discount - 1) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                        <p className="text-sm font-medium">Base Revenue Multiple</p>
                        <p className="text-lg font-bold">
                          {result.growth_metrics.base_multiple.toFixed(1)}x Revenue
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Enhanced Analysis Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Advanced Deal Analysis
              </CardTitle>
              <CardDescription>
                Deep-dive into catalog acquisition scenarios with custom deal structures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Professional Deal Simulator</p>
                  <p className="text-sm text-muted-foreground">
                    Model complex acquisition scenarios with track-level selection and custom terms
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = `/deal-simulator?artist=${encodeURIComponent(result.artist_name)}&id=${encodeURIComponent(result.spotify_data.artist_id)}`}
                  className="bg-gradient-primary text-primary-foreground"
                >
                  Launch Deal Simulator
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Download Enhanced Report */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Valuation Report</CardTitle>
              <CardDescription>
                Comprehensive analysis with DCF modeling, risk factors, and investment recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Download Advanced Report</p>
                  <p className="text-sm text-muted-foreground">
                    Includes DCF analysis, risk assessment, industry benchmarks, and detailed methodology
                  </p>
                </div>
                <Button onClick={generateAdvancedReport} className="bg-gradient-primary text-primary-foreground">
                  <Download className="h-4 w-4 mr-2" />
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

                {result.catalog_age_years && (
                  <div>
                    <p className="font-medium mb-1">Catalog Age</p>
                    <p className="text-2xl font-bold">{result.catalog_age_years} years</p>
                  </div>
                )}
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