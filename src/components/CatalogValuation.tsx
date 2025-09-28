import React, { useState, useCallback, useMemo, memo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import { RevenueSourcesForm } from "@/components/catalog-valuation/RevenueSourcesForm";
import { EnhancedValuationEngine } from "@/components/catalog-valuation/EnhancedValuationEngine";
import { TerritoryBreakdownCard } from "@/components/catalog-valuation/TerritoryBreakdownCard";
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
import { Slider } from "@/components/ui/slider";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Search, Download, TrendingUp, DollarSign, Users, BarChart3, Music, Target, PieChart, Calculator, Shield, Star, Zap, Brain, LineChart, Activity, TrendingDown, FileBarChart, Eye, ArrowLeft, ChevronDown } from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, Area, AreaChart, ComposedChart, ScatterChart, Scatter, RadialBarChart, RadialBar } from 'recharts';
import { CatalogValuationSkeleton, AsyncLoading } from "@/components/LoadingStates";
import { usePDFGeneration } from "@/hooks/usePDFGeneration";
import { useReportAI } from "@/hooks/useReportAI";

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
  pessimistic: {
    current: number;
    year5: number;
    cagr: string;
  };
  base: {
    current: number;
    year5: number;
    cagr: string;
  };
  optimistic: {
    current: number;
    year5: number;
    cagr: string;
  };
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
  followers: number;
  territory_focus?: 'global' | 'us-only' | 'international';
  territory_multiplier?: number;
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
  fair_market_value: {
    low: number;
    mid: number;
    high: number;
  };
  comparable_artists: ComparableArtist[];
  growth_metrics: {
    estimated_cagr: number;
    industry_growth: number;
    base_multiple: number;
  };
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
  territory?: 'global' | 'us-only' | 'international';
}

const CatalogValuation = memo(() => {
  const [artistName, setArtistName] = useState("");
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [catalogSubTab, setCatalogSubTab] = useState("search");
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [catalogValuationId, setCatalogValuationId] = useState<string | null>(null);
  const [valuationParams, setValuationParams] = useState<ValuationParams>({
    discountRate: 0.12,
    catalogAge: 5,
    methodology: 'advanced',
    territory: 'global'
  });

  const { revenueSources, calculateRevenueMetrics, refetch } = useCatalogRevenueSources(catalogValuationId);
  const computedRevenueMetrics = useMemo(() => calculateRevenueMetrics(), [revenueSources]);

  const { toast } = useToast();
  const { canAccess, incrementUsage, showUpgradeModalForModule } = useDemoAccess();
  const { user } = useAuth();
  const { loading, execute, error } = useAsyncOperation({
    showToast: true,
    successMessage: "Catalog valuation completed successfully",
    errorMessage: "Failed to get catalog valuation"
  });

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!canAccess('catalogValuation')) {
      showUpgradeModalForModule('catalogValuation');
      return;
    }
    if (!artistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an artist name",
        variant: "destructive"
      });
      return;
    }

    setResult(null);

    try {
      const data = await execute(async () => {
        const requestBody = {
          artistName: artistName.trim(),
          valuationParams,
          catalogValuationId,
          userId: user?.id
        };

        const { data, error } = await supabase.functions.invoke('spotify-catalog-valuation', {
          body: requestBody
        });

        if (error) throw new Error(error.message || 'Failed to get catalog valuation');
        if (data && data.error) throw new Error(data.error);
        if (!data) throw new Error('No data returned from valuation service');

        return data;
      });

      if (data) {
        setResult(data);
        incrementUsage('catalogValuation');
        setCatalogSubTab("results");

        // Save to database for authenticated users
        try {
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            const { data: inserted } = await supabase.from('catalog_valuations').insert({
              user_id: user.user.id,
              artist_name: data.artist_name,
              total_streams: data.total_streams,
              followers: data.followers,
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
              has_additional_revenue: data.has_additional_revenue || false,
              total_additional_revenue: data.total_additional_revenue || 0,
              revenue_diversification_score: data.revenue_diversification_score || 0,
              blended_valuation: data.blended_valuation,
              valuation_methodology_v2: data.valuation_methodology_v2 || 'basic'
            }).select().single();

            if (inserted) {
              setCatalogValuationId(inserted.id);
            }
          }
        } catch (saveError) {
          console.log('Could not save valuation to database:', saveError);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [artistName, canAccess, showUpgradeModalForModule, toast, execute, valuationParams, catalogValuationId, user?.id, incrementUsage]);

  return (
    <AsyncLoading isLoading={loading} error={error?.message} skeleton={<CatalogValuationSkeleton />} retry={handleSearch}>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-0">
            <Tabs value={catalogSubTab} onValueChange={setCatalogSubTab} className="space-y-6">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="search">
                    <Search className="w-4 h-4 mr-2" />
                    Advanced Search
                  </TabsTrigger>
                  <TabsTrigger value="results" disabled={!result}>
                    <Target className="w-4 h-4 mr-2" />
                    Valuation Results
                    {result && (
                      <Badge variant="secondary" className="ml-2">
                        {formatCurrency(result.blended_valuation || result.risk_adjusted_value || result.valuation_amount)}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="analysis" disabled={!result}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    DCF Analysis
                  </TabsTrigger>
                  <TabsTrigger value="revenue-sources" disabled={!result}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Revenue Sources
                    {revenueSources?.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {revenueSources.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="reports" disabled={!result}>
                    <FileBarChart className="w-4 h-4 mr-2" />
                    Reports
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="search" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Advanced Catalog Valuation
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Discover the estimated value of any artist's music catalog using publicly available data and industry benchmarks.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter artist or songwriter name..." 
                        value={artistName} 
                        onChange={e => setArtistName(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && handleSearch()} 
                        disabled={loading} 
                        className="flex-1" 
                      />
                      <Button 
                        onClick={handleSearch} 
                        disabled={loading || !artistName.trim()}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        {loading ? "Analyzing..." : "Analyze"}
                      </Button>
                      {loading && (
                        <Button variant="outline" onClick={() => window.location.reload()}>
                          Reset
                        </Button>
                      )}
                    </div>

                    {result && (
                      <div className="p-4 border rounded-lg bg-secondary/30">
                        <p className="font-medium mb-2">Latest Analysis: {result.artist_name}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-muted-foreground">Valuation: </span>
                            <span className="font-medium">
                              {formatCurrency(result.blended_valuation || result.risk_adjusted_value || result.valuation_amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence: </span>
                            <span className="font-medium">
                              {result.confidence_score || 0}/100
                            </span>
                          </div>
                        </div>
                        <Button onClick={() => setCatalogSubTab("results")}>
                          View Full Results
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  {result && (
                    <div className="space-y-6">
                      <Alert className="border-yellow-400 bg-gray-900 text-white">
                        <Eye className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-sm font-medium leading-relaxed text-white">
                          <strong className="font-semibold text-red-400">Data Accuracy Notice:</strong> This valuation combines direct Spotify data with proprietary estimates and industry benchmarks.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="mt-0">
                  {result && <div className="text-center py-8 text-muted-foreground">DCF Analysis content will be implemented here</div>}
                </TabsContent>

                <TabsContent value="revenue-sources" className="mt-0">
                  {result && (
                    <div className="space-y-6">
                      <RevenueSourcesForm 
                        catalogValuationId={catalogValuationId} 
                        onMetricsUpdate={() => {}} 
                        onValuationUpdate={() => {
                          refetch?.();
                          if (artistName) {
                            handleSearch();
                          }
                        }} 
                      />
                      
                      {revenueSources.length > 0 && (
                        <EnhancedValuationEngine 
                          baseValuation={result} 
                          revenueSources={revenueSources} 
                          revenueMetrics={computedRevenueMetrics} 
                        />
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  {result && <div className="text-center py-8 text-muted-foreground">Reports section will be implemented here</div>}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AsyncLoading>
  );
});

export default CatalogValuation;