import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import { RevenueSourcesForm } from "@/components/catalog-valuation/RevenueSourcesForm";
import { EnhancedValuationEngine } from "@/components/catalog-valuation/EnhancedValuationEngine";
import { useCatalogRevenueSources } from "@/hooks/useCatalogRevenueSources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Download, TrendingUp, DollarSign, Users, BarChart3, Music, Target, PieChart, Calculator, Shield, Star, Zap, Brain, LineChart, Activity, TrendingDown, FileBarChart, Eye, ArrowLeft } from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, Area, AreaChart, ComposedChart, ScatterChart, Scatter, RadialBarChart, RadialBar } from 'recharts';
import { CatalogValuationSkeleton, AsyncLoading } from "@/components/LoadingStates";

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
  // Enhanced valuation fields
  has_additional_revenue?: boolean;
  total_additional_revenue?: number;
  revenue_diversification_score?: number;
  blended_valuation?: number;
  valuation_methodology_v2?: string;
}

interface ValuationParams {
  discountRate?: number;
  catalogAge?: number;
  methodology?: string;
}

const CatalogValuation = memo(() => {
  const [artistName, setArtistName] = useState("");
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<"pessimistic" | "base" | "optimistic">("base");
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [catalogValuationId, setCatalogValuationId] = useState<string | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<any>(null);
  const [isSmallViewport, setIsSmallViewport] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [valuationParams, setValuationParams] = useState<ValuationParams>({
    discountRate: 0.12,
    catalogAge: 5,
    methodology: 'advanced'
  });
  
  const { revenueSources, calculateRevenueMetrics } = useCatalogRevenueSources(catalogValuationId);
  
  const { toast } = useToast();
  const { canAccess, incrementUsage, showUpgradeModalForModule } = useDemoAccess();
  const { user } = useAuth();
  const debouncedArtistName = useDebounce(artistName, 300);
  
  // Detect viewport size and preview mode
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsSmallViewport(width < 1200);
      setIsPreviewMode(width < 800 || window.parent !== window);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    
    return () => window.removeEventListener('resize', checkViewport);
  }, []);
  
  const { loading, execute, error } = useAsyncOperation({
    showToast: false, // Disable to prevent issues in preview
    successMessage: "Catalog valuation completed successfully",
    errorMessage: "Failed to get catalog valuation"
  });

  const handleSearch = useCallback(async () => {
    console.log("=== SEARCH STARTED ===");
    console.log("Artist name:", artistName);
    console.log("Can access:", canAccess('catalogValuation'));
    console.log("Is preview mode:", isPreviewMode);
    
    // Check demo access before proceeding
    if (!canAccess('catalogValuation')) {
      console.log("Demo access denied");
      showUpgradeModalForModule('catalogValuation');
      return;
    }
    if (!artistName.trim()) {
      console.log("No artist name provided");
      toast({
        title: "Error",
        description: "Please enter an artist name",
        variant: "destructive",
      });
      return;
    }

    console.log("Clearing previous result");
    setResult(null);

    try {
      console.log("Starting execute function");
      const data = await execute(async () => {
        console.log("=== INSIDE EXECUTE FUNCTION ===");
        console.log("Calling advanced Spotify catalog valuation function...");
        
        const requestBody = { 
          artistName: artistName.trim(),
          valuationParams,
          catalogValuationId,
          userId: user?.id
        };
        console.log("Request body:", requestBody);
        
        // Add timeout for preview mode
        const timeoutMs = isPreviewMode ? 15000 : 30000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
          const { data, error } = await supabase.functions.invoke('spotify-catalog-valuation', {
            body: requestBody
          });

          clearTimeout(timeoutId);
          console.log("=== API RESPONSE ===");
          console.log("Data:", data);
          console.log("Error:", error);

          if (error) {
            console.error("Function error:", error);
            throw new Error(error.message || 'Failed to get catalog valuation');
          }

          if (data && data.error) {
            console.error("Data error:", data.error);
            throw new Error(data.error);
          }

          if (!data) {
            console.error("No data returned");
            throw new Error('No data returned from valuation service');
          }

          console.log("=== SUCCESS - RETURNING DATA ===");
          return data;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      });

      console.log("=== EXECUTE COMPLETED ===");
      console.log("Returned data:", data);

      if (data) {
        console.log("Valuation result:", data);
        setResult(data);

        // Increment demo usage AFTER successful search
        incrementUsage('catalogValuation');

        // Show appropriate message for low-value results
        if (data.valuation_amount === 0 && data.total_streams === 0) {
          toast({
            title: "Valuation Complete",
            description: `Found artist "${data.artist_name}" but they have limited streaming activity. Valuation shows $0 due to minimal data.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Valuation Complete",
            description: `Successfully analyzed ${data.artist_name}`,
            variant: "default",
          });
        }

        // Save enhanced data to database (only for authenticated users and not in preview mode)
        if (!isPreviewMode) {
          try {
            const { data: user } = await supabase.auth.getUser();
            if (user.user) {
              const { data: savedValuation, error: saveError } = await supabase
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
                   comparable_multiples: data.comparable_multiples,
                   // Enhanced valuation fields
                   has_additional_revenue: data.has_additional_revenue || false,
                   total_additional_revenue: data.total_additional_revenue || 0,
                   revenue_diversification_score: data.revenue_diversification_score || 0,
                   blended_valuation: data.blended_valuation,
                   valuation_methodology_v2: data.valuation_methodology_v2 || 'basic'
                })
                .select()
                .maybeSingle();

              if (saveError) {
                console.error("Error saving valuation:", saveError);
                // Don't throw here - saving is optional, the main result should still show
              } else if (savedValuation) {
                setCatalogValuationId(savedValuation.id);
              }
            }
          } catch (dbError) {
            console.error("Database operation failed:", dbError);
            // Don't propagate this error - the valuation succeeded
          }
        }
      }
    } catch (error) {
      console.error("Catalog valuation error:", error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [artistName, valuationParams, canAccess, showUpgradeModalForModule, toast, execute, incrementUsage, isPreviewMode, user?.id]);

  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat().format(num);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  const generateAdvancedReport = useCallback(() => {
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

COMPARABLE ARTISTS
==================
${result.comparable_artists.map(comp => 
  `${comp.name}: ${formatCurrency(comp.valuation)} (${formatNumber(comp.followers)} followers, ${comp.popularity}/100 popularity)`
).join('\n')}

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
  }, [result, formatCurrency, formatNumber, toast]);

  return (
    <div className="space-y-6 w-full" style={{ contain: 'layout' }}>
      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-destructive text-center">
              <p className="font-semibold">Error: {error.message}</p>
              <Button onClick={handleSearch} variant="outline" className="mt-2">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Loading Display */}
      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <div>Analyzing artist data...</div>
            <div className="text-sm text-muted-foreground mt-1">
              This may take up to 30 seconds...
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-2"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Main Form */}
      {!loading && (
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
      )}

      {/* Results Display */}
      {result && !loading && (
        <>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className={`grid w-full ${isSmallViewport ? 'grid-cols-3' : 'grid-cols-7'}`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {!isSmallViewport && <TabsTrigger value="analysis">DCF Analysis</TabsTrigger>}
              <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
              <TabsTrigger value="comparables">Comparables</TabsTrigger>
              {!isSmallViewport && <TabsTrigger value="revenue-sources">Revenue Sources</TabsTrigger>}
              {!isSmallViewport && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Grid - Responsive */}
              <div className={`grid gap-4 ${isSmallViewport ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-6'}`}>
                {/* Enhanced Valuation - Show if available */}
                {result.blended_valuation && result.has_additional_revenue ? (
                  <Card className="ring-2 ring-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Enhanced Value</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(result.blended_valuation)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Risk-Adjusted Value</p>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(result.risk_adjusted_value || result.valuation_amount)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Calculator className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">DCF Valuation</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(result.dcf_valuation || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-green-100">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Multiple Valuation</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(result.multiple_valuation || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-orange-100">
                        <Target className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Confidence Score</p>
                        <p className="text-2xl font-bold text-orange-600">{result.confidence_score || 0}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-purple-100">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">LTM Revenue</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(result.ltm_revenue || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-yellow-100">
                        <Star className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Popularity</p>
                        <p className="text-2xl font-bold text-yellow-600">{result.popularity_score || result.spotify_data.popularity}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Artist Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Artist Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Artist Name</p>
                      <p className="text-lg font-semibold">{result.artist_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Streams</p>
                      <p className="text-lg font-semibold">{formatNumber(result.total_streams)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Listeners</p>
                      <p className="text-lg font-semibold">{formatNumber(result.monthly_listeners)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primary Genre</p>
                      <p className="text-lg font-semibold capitalize">{result.genre || 'Unknown'}</p>
                    </div>
                  </div>

                  {result.top_tracks && result.top_tracks.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Top Tracks</h4>
                      <div className="space-y-2">
                        {result.top_tracks.slice(0, 5).map((track, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                            <span className="font-medium">{track.name}</span>
                            <Badge variant="outline">{track.popularity}/100</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fair Market Value Range */}
              <Card>
                <CardHeader>
                  <CardTitle>Fair Market Value Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Conservative</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(result.fair_market_value.low)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Target</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(result.fair_market_value.mid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Optimistic</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(result.fair_market_value.high)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comparable Artists</CardTitle>
                  <CardDescription>
                    Similar artists with comparable streaming metrics and valuations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.comparable_artists.map((artist, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold">{artist.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">{formatNumber(artist.followers)} followers</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Popularity: {artist.popularity}/100</span>
                              </div>
                              <div>
                                <span className="text-lg font-bold text-primary">{formatCurrency(artist.valuation)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forecasts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>5-Year Valuation Forecasts</CardTitle>
                  <CardDescription>
                    Projected valuations under different market scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedScenario} onValueChange={(value) => setSelectedScenario(value as any)}>
                    <TabsList>
                      <TabsTrigger value="pessimistic">Conservative</TabsTrigger>
                      <TabsTrigger value="base">Base Case</TabsTrigger>
                      <TabsTrigger value="optimistic">Optimistic</TabsTrigger>
                    </TabsList>
                    
                    {['pessimistic', 'base', 'optimistic'].map((scenario) => (
                      <TabsContent key={scenario} value={scenario}>
                        <div className="space-y-4">
                          {result.forecasts[scenario as keyof ScenarioForecasts]?.map((year, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <p className="font-medium">Year {year.year}</p>
                                <p className="text-sm text-muted-foreground">{formatNumber(year.streams)} streams</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(year.valuation)}</p>
                                <p className="text-sm text-muted-foreground">{formatCurrency(year.revenue)} revenue</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Reporting</CardTitle>
                  <CardDescription>
                    Generate comprehensive valuation reports and documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={generateAdvancedReport} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Advanced Valuation Report
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Report includes:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          <li>Executive summary</li>
                          <li>Detailed methodologies</li>
                          <li>Risk factor analysis</li>
                          <li>Comparable market data</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Valuation Method:</p>
                        <p className="text-muted-foreground">{result.valuation_methodology || 'Advanced DCF with Risk Adjustment'}</p>
                        <p className="font-medium mt-2">Confidence Level:</p>
                        <p className="text-muted-foreground">{result.confidence_score || 0}/100</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {!isSmallViewport && (
              <>
                <TabsContent value="analysis" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>DCF Analysis Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Discount Rate</p>
                            <p className="text-lg font-semibold">{((result.discount_rate || 0.12) * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Terminal Growth</p>
                            <p className="text-lg font-semibold">2.0%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Revenue Multiple</p>
                            <p className="text-lg font-semibold">{result.industry_benchmarks?.revenue_multiple.toFixed(1)}x</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="revenue-sources" className="space-y-6">
                  <RevenueSourcesForm catalogValuationId={catalogValuationId} />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Enhanced Analytics</CardTitle>
                      <CardDescription>Advanced valuation analytics and insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Enhanced analytics coming soon...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
});

export default CatalogValuation;