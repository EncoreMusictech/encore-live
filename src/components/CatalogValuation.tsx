import React, { useState, useCallback, useMemo, memo } from "react";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [catalogValuationId, setCatalogValuationId] = useState<string | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<any>(null);
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
  
  const { loading, execute, error } = useAsyncOperation({
    showToast: true,
    successMessage: "Catalog valuation completed successfully",
    errorMessage: "Failed to get catalog valuation"
  });

  const handleSearch = useCallback(async () => {
    console.log("=== SEARCH STARTED ===");
    console.log("Artist name:", artistName);
    console.log("Can access:", canAccess('catalogValuation'));
    
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
        
        const { data, error } = await supabase.functions.invoke('spotify-catalog-valuation', {
          body: requestBody
        });

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
        }

        // Save enhanced data to database (only for authenticated users)
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
    } catch (error) {
      console.error("Catalog valuation error:", error);
    }
  }, [artistName, valuationParams, canAccess, showUpgradeModalForModule, toast, execute, incrementUsage]);

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
  }, [result, formatCurrency, formatNumber, toast]);

  return (
    <AsyncLoading 
      isLoading={loading} 
      error={error?.message} 
      skeleton={<CatalogValuationSkeleton />}
      retry={handleSearch}
    >
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
            {loading && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reset
              </Button>
            )}
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">DCF Analysis</TabsTrigger>
              <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
              <TabsTrigger value="comparables">Comparables</TabsTrigger>
              <TabsTrigger value="revenue-sources">Revenue Sources</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Enhanced Valuation - Show if available */}
                {result.blended_valuation && result.has_additional_revenue ? (
                  <Card className="ring-2 ring-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Enhanced Valuation</p>
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(result.blended_valuation)}
                          </p>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {((result.blended_valuation - (result.risk_adjusted_value || result.valuation_amount)) / (result.risk_adjusted_value || result.valuation_amount) * 100).toFixed(1)}% uplift
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
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
                )}

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


              {/* Enhanced Valuation Insights */}
              {result.has_additional_revenue && (
                <Card className="col-span-full border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Enhanced Valuation Insights
                    </CardTitle>
                    <CardDescription>
                      Advanced analysis incorporating additional revenue streams
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Revenue Diversification</p>
                        <div className="flex items-center gap-2">
                          <Progress value={(result.revenue_diversification_score || 0) * 100} className="flex-1" />
                          <span className="text-sm font-bold">{((result.revenue_diversification_score || 0) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Additional Revenue</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(result.total_additional_revenue || 0)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Methodology</p>
                        <Badge variant="outline" className="text-primary">
                          {result.valuation_methodology_v2 === 'enhanced' ? 'Enhanced Blended' : 'Traditional DCF'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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

            <TabsContent value="analytics" className="space-y-6">
              {/* Back Navigation */}
              <div className="flex items-center gap-2 mb-4">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setActiveTab("overview")}
                   className="text-muted-foreground hover:text-foreground"
                 >
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back to Overview
                 </Button>
              </div>
              
              {/* Comprehensive Analytics Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Valuation Components Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Valuation Components
                    </CardTitle>
                    <CardDescription>Breakdown of valuation methodologies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'DCF Valuation', value: result.dcf_valuation || 0, fill: '#3b82f6' },
                            { name: 'Multiple Valuation', value: result.multiple_valuation || 0, fill: '#10b981' },
                            { name: 'Risk Adjustment', value: Math.abs((result.risk_adjusted_value || result.valuation_amount) - ((result.dcf_valuation || 0) + (result.multiple_valuation || 0)) / 2), fill: '#f59e0b' }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'DCF Valuation', value: result.dcf_valuation || 0, fill: '#3b82f6' },
                            { name: 'Multiple Valuation', value: result.multiple_valuation || 0, fill: '#10b981' },
                            { name: 'Risk Adjustment', value: Math.abs((result.risk_adjusted_value || result.valuation_amount) - ((result.dcf_valuation || 0) + (result.multiple_valuation || 0)) / 2), fill: '#f59e0b' }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 5-Year Forecast Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-primary" />
                      Valuation Growth Trends
                    </CardTitle>
                    <CardDescription>5-year projection scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart
                        data={result.forecasts.base.map((baseYear, index) => ({
                          year: `Year ${baseYear.year}`,
                          pessimistic: result.forecasts.pessimistic[index]?.valuation || 0,
                          base: baseYear.valuation,
                          optimistic: result.forecasts.optimistic[index]?.valuation || 0
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line type="monotone" dataKey="pessimistic" stroke="#ef4444" strokeWidth={2} name="Pessimistic" />
                        <Line type="monotone" dataKey="base" stroke="#3b82f6" strokeWidth={3} name="Base Case" />
                        <Line type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={2} name="Optimistic" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue vs Streams Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Revenue vs Streams Analysis
                    </CardTitle>
                    <CardDescription>Forecast revenue efficiency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart
                        data={result.forecasts.base.map(year => ({
                          year: `Year ${year.year}`,
                          revenue: year.revenue,
                          streams: year.streams / 1000000, // Convert to millions
                          efficiency: (year.revenue / year.streams) * 1000000 // Revenue per million streams
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(1)}M`} />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(value as number) :
                            name === 'streams' ? `${(value as number).toFixed(1)}M streams` :
                            `$${(value as number).toFixed(2)}/M streams`,
                            name === 'revenue' ? 'Revenue' :
                            name === 'streams' ? 'Streams (M)' : 'Efficiency'
                          ]}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
                        <Line yAxisId="right" type="monotone" dataKey="streams" stroke="#10b981" strokeWidth={2} name="Streams (M)" />
                        <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={2} name="$/M Streams" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Risk vs Return Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Risk-Return Profile
                    </CardTitle>
                    <CardDescription>Investment risk assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          dataKey="risk" 
                          name="Risk Score" 
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="return" 
                          name="Expected Return" 
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value, name) => [
                            `${(value as number).toFixed(1)}%`,
                            name === 'return' ? 'Expected Return' : 'Risk Score'
                          ]}
                        />
                        <Scatter 
                          name="Scenarios" 
                          data={[
                            { 
                              risk: 100 - (result.confidence_score || 50), 
                              return: parseFloat(result.valuations.pessimistic.cagr),
                              scenario: 'Pessimistic'
                            },
                            { 
                              risk: 100 - (result.confidence_score || 50) - 20, 
                              return: parseFloat(result.valuations.base.cagr),
                              scenario: 'Base Case'
                            },
                            { 
                              risk: 100 - (result.confidence_score || 50) - 40, 
                              return: parseFloat(result.valuations.optimistic.cagr),
                              scenario: 'Optimistic'
                            }
                          ]} 
                          fill="#8884d8"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Market Comparables Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Market Position Analysis
                    </CardTitle>
                    <CardDescription>Artist positioning vs comparables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          dataKey="followers" 
                          name="Followers" 
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="valuation" 
                          name="Valuation" 
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value, name) => [
                            name === 'valuation' ? formatCurrency(value as number) : `${formatNumber(value as number)} followers`,
                            name === 'valuation' ? 'Valuation' : 'Followers'
                          ]}
                        />
                        <Scatter 
                          name="Target Artist" 
                          data={[{
                            followers: result.spotify_data.followers,
                            valuation: result.risk_adjusted_value || result.valuation_amount,
                            name: result.artist_name
                          }]} 
                          fill="#ef4444"
                        />
                        <Scatter 
                          name="Comparables" 
                          data={result.comparable_artists.map(comp => ({
                            followers: comp.followers,
                            valuation: comp.valuation,
                            name: comp.name
                          }))} 
                          fill="#3b82f6"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Confidence Score Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Confidence Score Breakdown
                    </CardTitle>
                    <CardDescription>Data quality assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadialBarChart innerRadius="30%" outerRadius="90%">
                        <RadialBar
                          dataKey="value"
                          data={[
                            { name: 'Overall Confidence', value: result.confidence_score || 0, fill: '#3b82f6' }
                          ]}
                          cornerRadius={10}
                          fill="#8884d8"
                        />
                        <Tooltip formatter={(value) => [`${value}%`, 'Confidence']} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Data Availability</span>
                        <span className="font-medium">{result.total_streams > 0 ? 'Good' : 'Limited'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Market Validation</span>
                        <span className="font-medium">{result.comparable_artists.length >= 3 ? 'Strong' : 'Moderate'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Revenue Visibility</span>
                        <span className="font-medium">{(result.ltm_revenue || 0) > 0 ? 'Good' : 'Estimated'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    AI-Powered Insights
                  </CardTitle>
                  <CardDescription>Automated analysis and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Growth Trajectory Insight */}
                    <div className="p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Growth Trajectory</span>
                      </div>
                      <p className="text-sm text-green-700">
                        {parseFloat(result.valuations.base.cagr) > 10 
                          ? "Strong growth potential with above-market CAGR projections"
                          : parseFloat(result.valuations.base.cagr) > 5
                          ? "Moderate growth expected, aligned with industry standards"
                          : "Conservative growth outlook, consider risk factors"}
                      </p>
                    </div>

                    {/* Market Position Insight */}
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Market Position</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        {result.spotify_data.followers > result.comparable_artists.reduce((sum, comp) => sum + comp.followers, 0) / result.comparable_artists.length
                          ? "Above-average market position with strong follower base"
                          : "Emerging artist with growth potential relative to peers"}
                      </p>
                    </div>

                    {/* Risk Assessment Insight */}
                    <div className="p-4 border rounded-lg bg-orange-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Risk Assessment</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        {(result.confidence_score || 0) >= 70 
                          ? "Low-risk investment with strong data confidence"
                          : (result.confidence_score || 0) >= 50
                          ? "Moderate risk profile, consider additional due diligence"
                          : "Higher risk investment, limited historical data available"}
                      </p>
                    </div>

                    {/* Valuation Method Insight */}
                    <div className="p-4 border rounded-lg bg-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">Valuation Quality</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        {result.dcf_valuation && result.multiple_valuation
                          ? "Comprehensive valuation using multiple methodologies"
                          : "Single-method valuation, consider cross-validation"}
                      </p>
                    </div>

                    {/* Revenue Efficiency Insight */}
                    <div className="p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Revenue Efficiency</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        {(result.ltm_revenue || 0) / result.total_streams * 1000000 > 3
                          ? "High revenue per million streams, strong monetization"
                          : (result.ltm_revenue || 0) / result.total_streams * 1000000 > 2
                          ? "Average monetization efficiency"
                          : "Opportunity to improve revenue per stream"}
                      </p>
                    </div>

                    {/* Genre Performance Insight */}
                    <div className="p-4 border rounded-lg bg-indigo-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-indigo-800">Genre Analysis</span>
                      </div>
                      <p className="text-sm text-indigo-700">
                        {result.industry_benchmarks
                          ? `${result.genre} genre shows ${result.industry_benchmarks.growth_assumption > 0.05 ? 'strong' : 'stable'} market dynamics`
                          : "Genre-specific benchmarks applied for accurate valuation"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

             <TabsContent value="revenue-sources" className="space-y-6">
               {/* Back Navigation */}
               <div className="flex items-center gap-2 mb-4">
                  <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setActiveTab("overview")}
                   className="flex items-center gap-2"
                 >
                   <ArrowLeft className="h-4 w-4" />
                   Back to Overview
                 </Button>
               </div>

               {/* Instructions */}
               {!result && (
                 <Card>
                   <CardContent className="p-6">
                     <div className="text-center space-y-2">
                       <h3 className="text-lg font-medium">Additional Revenue Analysis</h3>
                       <p className="text-muted-foreground">
                         First complete a catalog valuation, then add additional revenue sources for enhanced analysis.
                       </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("overview")}
                        >
                          Start Catalog Valuation
                        </Button>
                     </div>
                   </CardContent>
                 </Card>
               )}

                {/* Revenue Sources Form - Show when we have a valuation result */}
                {result && (
                  <>
                    <RevenueSourcesForm 
                      catalogValuationId={catalogValuationId}
                      onMetricsUpdate={(metrics) => {
                        console.log('Revenue metrics updated:', metrics);
                        setRevenueMetrics(metrics);
                      }}
                      onValuationUpdate={() => {
                        console.log('Revenue source updated, refreshing valuation with enhanced methodology');
                        console.log('Current catalogValuationId:', catalogValuationId);
                        if (artistName) {
                          handleSearch();
                        }
                      }}
                    />
                   
                   {/* Enhanced Valuation Engine */}
                   {revenueMetrics && revenueSources.length > 0 && (
                     <EnhancedValuationEngine
                       baseValuation={result}
                       revenueSources={revenueSources}
                       revenueMetrics={revenueMetrics}
                     />
                   )}
                 </>
               )}
              </TabsContent>


            <TabsContent value="reports" className="space-y-6">
              {/* Back Navigation */}
              <div className="flex items-center gap-2 mb-4">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setActiveTab("overview")}
                   className="text-muted-foreground hover:text-foreground"
                 >
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back to Overview
                 </Button>
              </div>
              
              {/* Comprehensive Reporting Suite */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileBarChart className="h-5 w-5 text-primary" />
                    Professional Reports Suite
                  </CardTitle>
                  <CardDescription>Generate detailed reports for different stakeholders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Executive Summary Report */}
                    <Card className="border-2 border-primary/20">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Executive Summary</CardTitle>
                        </div>
                        <CardDescription>High-level overview for investors</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Valuation</span>
                            <span className="font-medium">{formatCurrency(result.risk_adjusted_value || result.valuation_amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>5Y CAGR</span>
                            <span className="font-medium text-green-600">{result.valuations.base.cagr}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Confidence</span>
                            <span className="font-medium">{result.confidence_score || 0}/100</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-4"
                            onClick={() => {
                              const executiveSummary = `
EXECUTIVE SUMMARY - ${result.artist_name}
=============================================

INVESTMENT OVERVIEW
• Target Valuation: ${formatCurrency(result.risk_adjusted_value || result.valuation_amount)}
• 5-Year CAGR: ${result.valuations.base.cagr}%
• Confidence Score: ${result.confidence_score || 0}/100
• Risk Profile: ${(result.confidence_score || 0) >= 70 ? 'Low' : (result.confidence_score || 0) >= 50 ? 'Moderate' : 'High'}

KEY METRICS
• Monthly Listeners: ${formatNumber(result.monthly_listeners)}
• Total Streams: ${formatNumber(result.total_streams)}
• LTM Revenue: ${formatCurrency(result.ltm_revenue || 0)}
• Market Position: ${result.spotify_data.followers > 10000 ? 'Established' : 'Emerging'}

INVESTMENT THESIS
${parseFloat(result.valuations.base.cagr) > 10 
  ? '• Strong growth trajectory with above-market returns'
  : '• Stable asset with market-aligned performance'}
${(result.confidence_score || 0) >= 70 
  ? '• High data confidence supports valuation accuracy'
  : '• Additional due diligence recommended'}
• Genre: ${result.genre || 'Multi-genre'} market dynamics
• Comparable artists validation supports pricing

RECOMMENDATION: ${ 
  (result.confidence_score || 0) >= 70 && parseFloat(result.valuations.base.cagr) > 8 
    ? 'STRONG BUY - High confidence, attractive returns'
    : (result.confidence_score || 0) >= 50 && parseFloat(result.valuations.base.cagr) > 5
    ? 'BUY - Moderate confidence, fair returns'
    : 'HOLD - Requires further analysis'
}
                              `;
                              
                              const blob = new Blob([executiveSummary], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${result.artist_name.replace(/\s+/g, '_')}_executive_summary.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Technical Analysis Report */}
                    <Card className="border-2 border-blue-500/20">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">Technical Analysis</CardTitle>
                        </div>
                        <CardDescription>Detailed DCF and methodology</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>DCF Value</span>
                            <span className="font-medium">{formatCurrency(result.dcf_valuation || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Multiple Value</span>
                            <span className="font-medium">{formatCurrency(result.multiple_valuation || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Discount Rate</span>
                            <span className="font-medium">{((result.discount_rate || 0.12) * 100).toFixed(1)}%</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-4"
                            onClick={generateAdvancedReport}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Market Analysis Report */}
                    <Card className="border-2 border-green-500/20">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-green-600" />
                          <CardTitle className="text-lg">Market Analysis</CardTitle>
                        </div>
                        <CardDescription>Competitive landscape & positioning</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Comparables</span>
                            <span className="font-medium">{result.comparable_artists.length} artists</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Market Multiple</span>
                            <span className="font-medium">{result.growth_metrics.base_multiple.toFixed(1)}x</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Genre</span>
                            <span className="font-medium">{result.genre || 'Multi-genre'}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-4"
                            onClick={() => {
                              const marketAnalysis = `
MARKET ANALYSIS REPORT - ${result.artist_name}
==============================================

COMPETITIVE LANDSCAPE
• Total Comparable Artists: ${result.comparable_artists.length}
• Average Peer Valuation: ${formatCurrency(result.comparable_artists.reduce((sum, comp) => sum + comp.valuation, 0) / result.comparable_artists.length)}
• Artist Premium/Discount: ${(((result.risk_adjusted_value || result.valuation_amount) / (result.comparable_artists.reduce((sum, comp) => sum + comp.valuation, 0) / result.comparable_artists.length) - 1) * 100).toFixed(0)}%

MARKET POSITIONING
• Follower Ranking: ${result.spotify_data.followers > result.comparable_artists.reduce((sum, comp) => sum + comp.followers, 0) / result.comparable_artists.length ? 'Above Average' : 'Below Average'}
• Popularity Score: ${result.popularity_score || result.spotify_data.popularity}/100
• Genre Performance: ${result.genre || 'Multi-genre'}

COMPARABLE ARTISTS ANALYSIS
${result.comparable_artists.map((comp, index) => `
${index + 1}. ${comp.name}
   • Valuation: ${formatCurrency(comp.valuation)}
   • Followers: ${formatNumber(comp.followers)}
   • Popularity: ${comp.popularity || 'N/A'}/100`).join('')}

MARKET MULTIPLES
• Revenue Multiple Applied: ${result.growth_metrics.base_multiple.toFixed(1)}x
${result.comparable_multiples ? `• EV/Revenue Multiple: ${result.comparable_multiples.ev_revenue_multiple.toFixed(1)}x
• Peer Average Multiple: ${result.comparable_multiples.peer_average_multiple.toFixed(1)}x
• Market Premium/Discount: ${((result.comparable_multiples.market_premium_discount - 1) * 100).toFixed(0)}%` : ''}

INDUSTRY BENCHMARKS
${result.industry_benchmarks ? `• Genre: ${result.industry_benchmarks.genre}
• Industry Growth Rate: ${(result.industry_benchmarks.growth_assumption * 100).toFixed(1)}%
• Market Risk Factor: ${(result.industry_benchmarks.risk_factor * 100).toFixed(1)}%
• Benchmark Revenue Multiple: ${result.industry_benchmarks.revenue_multiple}x` : '• Industry benchmarks applied based on genre classification'}
                              `;
                              
                              const blob = new Blob([marketAnalysis], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${result.artist_name.replace(/\s+/g, '_')}_market_analysis.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Interactive Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Data Export Options
                  </CardTitle>
                  <CardDescription>Export valuation data in various formats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const csvData = [
                          ['Metric', 'Value'],
                          ['Artist Name', result.artist_name],
                          ['Risk-Adjusted Valuation', result.risk_adjusted_value || result.valuation_amount],
                          ['DCF Valuation', result.dcf_valuation || 0],
                          ['Multiple Valuation', result.multiple_valuation || 0],
                          ['Confidence Score', result.confidence_score || 0],
                          ['5-Year CAGR', result.valuations.base.cagr],
                          ['Total Streams', result.total_streams],
                          ['Monthly Listeners', result.monthly_listeners],
                          ['LTM Revenue', result.ltm_revenue || 0],
                          ['Popularity Score', result.popularity_score || result.spotify_data.popularity],
                          ['Discount Rate', (result.discount_rate || 0.12) * 100],
                          ...result.forecasts.base.map(year => [`Year ${year.year} Valuation`, year.valuation])
                        ];
                        
                        const csvContent = csvData.map(row => row.join(',')).join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${result.artist_name.replace(/\s+/g, '_')}_valuation_data.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export CSV
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const jsonData = {
                          artist_name: result.artist_name,
                          valuation_summary: {
                            risk_adjusted_value: result.risk_adjusted_value || result.valuation_amount,
                            dcf_valuation: result.dcf_valuation,
                            multiple_valuation: result.multiple_valuation,
                            confidence_score: result.confidence_score
                          },
                          key_metrics: {
                            total_streams: result.total_streams,
                            monthly_listeners: result.monthly_listeners,
                            ltm_revenue: result.ltm_revenue,
                            popularity_score: result.popularity_score || result.spotify_data.popularity
                          },
                          forecasts: result.forecasts,
                          comparable_artists: result.comparable_artists,
                          industry_benchmarks: result.industry_benchmarks,
                          methodology: {
                            discount_rate: result.discount_rate,
                            valuation_methodology: result.valuation_methodology,
                            cash_flow_projections: result.cash_flow_projections
                          },
                          generated_at: new Date().toISOString()
                        };
                        
                        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${result.artist_name.replace(/\s+/g, '_')}_valuation_data.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export JSON
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Create a comprehensive XML export
                        const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<catalog_valuation>
  <artist_name>${result.artist_name}</artist_name>
  <generated_date>${new Date().toISOString()}</generated_date>
  <valuation_summary>
    <risk_adjusted_value>${result.risk_adjusted_value || result.valuation_amount}</risk_adjusted_value>
    <dcf_valuation>${result.dcf_valuation || 0}</dcf_valuation>
    <multiple_valuation>${result.multiple_valuation || 0}</multiple_valuation>
    <confidence_score>${result.confidence_score || 0}</confidence_score>
  </valuation_summary>
  <forecasts>
    ${result.forecasts.base.map(year => `
    <year_${year.year}>
      <valuation>${year.valuation}</valuation>
      <revenue>${year.revenue}</revenue>
      <streams>${year.streams}</streams>
    </year_${year.year}>`).join('')}
  </forecasts>
  <comparable_artists>
    ${result.comparable_artists.map((comp, index) => `
    <artist_${index + 1}>
      <name>${comp.name}</name>
      <valuation>${comp.valuation}</valuation>
      <followers>${comp.followers}</followers>
      <popularity>${comp.popularity || 0}</popularity>
    </artist_${index + 1}>`).join('')}
  </comparable_artists>
</catalog_valuation>`;
                        
                        const blob = new Blob([xmlData], { type: 'application/xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${result.artist_name.replace(/\s+/g, '_')}_valuation_data.xml`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export XML
                    </Button>
                    
                    <Button 
                      onClick={generateAdvancedReport}
                      className="bg-gradient-primary text-primary-foreground"
                    >
                      Full PDF Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>


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
    </AsyncLoading>
  );
});

export default CatalogValuation;