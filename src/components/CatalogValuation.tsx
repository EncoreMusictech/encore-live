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
import { Loader2, Search, Download, TrendingUp, DollarSign, Users, BarChart3, Music, Target, PieChart, Calculator, Shield, Star, Zap, Brain, LineChart, Activity, TrendingDown, FileBarChart, Eye, ArrowLeft } from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, Area, AreaChart, ComposedChart, ScatterChart, Scatter, RadialBarChart, RadialBar } from 'recharts';
import { CatalogValuationSkeleton, AsyncLoading } from "@/components/LoadingStates";
import { usePDFGeneration } from "@/hooks/usePDFGeneration";
import { useReportAI } from "@/hooks/useReportAI";
import MarketIntelligenceTab from "@/components/catalog-valuation/MarketIntelligenceTab";
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
  followers: number; // Spotify followers count, not monthly listeners
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
  territory?: 'global' | 'us-only' | 'international';
}
const CatalogValuation = memo(() => {
  const [artistName, setArtistName] = useState("");
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<"pessimistic" | "base" | "optimistic">("base");
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [catalogValuationId, setCatalogValuationId] = useState<string | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<any>(null);
  const [customCagr, setCustomCagr] = useState<number>(5);
  const [valuationParams, setValuationParams] = useState<ValuationParams>({
    discountRate: 0.12,
    catalogAge: 5, // Will be overridden by calculated age
    methodology: 'advanced',
    territory: 'global'
  });
  const {
    revenueSources,
    calculateRevenueMetrics,
    refetch
  } = useCatalogRevenueSources(catalogValuationId);
  const computedRevenueMetrics = useMemo(() => calculateRevenueMetrics(), [revenueSources]);

  // Calculate catalog age from discography data
  const calculateCatalogAge = useCallback(async (artistName: string) => {
    try {
      // First try to get discography from database
      const { data: discography } = await supabase
        .from('artist_discography')
        .select('*')
        .ilike('artist_name', artistName)
        .single();
      
      if (discography && discography.albums && discography.singles) {
        const albums = Array.isArray(discography.albums) ? discography.albums : [];
        const singles = Array.isArray(discography.singles) ? discography.singles : [];
        const allReleases = [...albums, ...singles];
        
        if (allReleases.length > 0) {
          const releaseDates = allReleases
            .map((release: any) => release?.release_date)
            .filter((date: any) => date && typeof date === 'string')
            .sort();
          
          if (releaseDates.length > 0) {
            const earliestDate = new Date(releaseDates[0]);
            const currentDate = new Date();
            const ageInYears = Math.max(1, Math.floor((currentDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
            return ageInYears;
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch discography for catalog age calculation:', error);
    }
    
    // Fallback to default
    return 5;
  }, []);

  // Auto-calculated catalog age
  const [calculatedCatalogAge, setCalculatedCatalogAge] = useState<number>(5);
  const [catalogAgeSource, setCatalogAgeSource] = useState<string>('default');

  // Industry CAGR benchmarks by genre
  const industryBenchmarks = useMemo(() => ({
    'hip-hop': 8,
    'hip hop': 8,
    'rap': 8,
    'r&b': 7,
    'rnb': 7,
    'pop': 5,
    'electronic': 6,
    'edm': 6,
    'country': 4,
    'rock': 3,
    'alternative': 4,
    'folk': 3,
    'classical': 2,
    'jazz': 2
  }), []);

  // Get default CAGR based on genre
  const getDefaultCagr = useMemo(() => {
    if (!result?.spotify_data?.genres?.length) return 5;
    
    for (const genre of result.spotify_data.genres) {
      const normalizedGenre = genre.toLowerCase();
      for (const [key, value] of Object.entries(industryBenchmarks)) {
        if (normalizedGenre.includes(key)) {
          return value;
        }
      }
    }
    return 5; // Default fallback
  }, [result?.spotify_data?.genres, industryBenchmarks]);

  // Update custom CAGR when result changes
  const prevResultRef = React.useRef<ValuationResult | null>(null);
  React.useEffect(() => {
    if (result && result !== prevResultRef.current) {
      setCustomCagr(getDefaultCagr);
      prevResultRef.current = result;
    }
  }, [result, getDefaultCagr]);

  // Calculate adjusted valuation based on custom CAGR
  const adjustedValuations = useMemo(() => {
    if (!result) return null;

    const baseCagr = result.growth_metrics.estimated_cagr || 7; // Default base case CAGR
    const cagrMultiplier = customCagr / baseCagr;
    
    // Calculate adjusted values for current scenario
    const baseValuation = result.valuations[selectedScenario].current;
    const baseYear5 = result.valuations[selectedScenario].year5;
    
    // Apply CAGR adjustment to year 5 valuation
    const adjustedYear5 = baseValuation * Math.pow(1 + (customCagr / 100), 5);
    
    // Calculate adjusted forecasts for the selected scenario
    const adjustedForecasts = result.forecasts[selectedScenario].map(year => ({
      ...year,
      valuation: baseValuation * Math.pow(1 + (customCagr / 100), year.year),
      revenue: year.revenue * Math.pow(1 + (customCagr / 100), year.year),
      streams: Math.round(year.streams * Math.pow(1 + (customCagr / 100), year.year))
    }));

    return {
      current: baseValuation,
      year5: adjustedYear5,
      cagr: customCagr.toFixed(1),
      forecasts: adjustedForecasts,
      totalReturn: ((adjustedYear5 / baseValuation - 1) * 100)
    };
  }, [result, selectedScenario, customCagr]);
  const {
    toast
  } = useToast();
  const {
    canAccess,
    incrementUsage,
    showUpgradeModalForModule
  } = useDemoAccess();
  const {
    user
  } = useAuth();
  const debouncedArtistName = useDebounce(artistName, 300);
  const {
    loading,
    execute,
    error
  } = useAsyncOperation({
    showToast: true,
    successMessage: "Catalog valuation completed successfully",
    errorMessage: "Failed to get catalog valuation"
  });
  const {
    loading: aiLoading,
    generateReport
  } = useReportAI();
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
        variant: "destructive"
      });
      return;
    }
    console.log("Clearing previous result");
    setResult(null);

    // Calculate catalog age from discography data
    console.log("Calculating catalog age from discography...");
    const catalogAge = await calculateCatalogAge(artistName.trim());
    setCalculatedCatalogAge(catalogAge);
    setCatalogAgeSource(catalogAge === 5 ? 'default' : 'calculated');
    console.log(`Catalog age: ${catalogAge} years (${catalogAge === 5 ? 'default' : 'calculated from releases'})`);

    // Update valuation params with calculated age
    setValuationParams(prev => ({
      ...prev,
      catalogAge: catalogAge
    }));
    try {
      console.log("Starting execute function");
      const data = await execute(async () => {
        console.log("=== INSIDE EXECUTE FUNCTION ===");
        console.log("Calling advanced Spotify catalog valuation function...");
        const requestBody = {
          artistName: artistName.trim(),
          valuationParams: {
            ...valuationParams,
            catalogAge: catalogAge, // Use the newly calculated age
            customCagr
          },
          catalogValuationId,
          userId: user?.id
        };
        console.log("Request body:", requestBody);
        console.log(`FRONTEND REQUEST DEBUG: Territory being sent: "${valuationParams.territory}"`);
        console.log(`FRONTEND REQUEST DEBUG: Full request body:`, requestBody);
        const {
          data,
          error
        } = await supabase.functions.invoke('spotify-catalog-valuation', {
          body: requestBody
        });
        console.log("=== API RESPONSE ===");
        console.log("Data:", data);
        console.log("Error:", error);
        console.log(`FRONTEND RESPONSE DEBUG: territory_multiplier received: ${data?.territory_multiplier}`);
        console.log(`FRONTEND RESPONSE DEBUG: territory_focus received: ${data?.territory_focus}`);
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
            variant: "default"
          });
        }

        // Save enhanced data to database (only for authenticated users)
        try {
          const {
            data: user
          } = await supabase.auth.getUser();
          if (user.user) {
            let savedValuation = null as any;
            let saveError = null as any;
            if (catalogValuationId) {
              const {
                data: updated,
                error: updateError
              } = await supabase.from('catalog_valuations').update({
                user_id: user.user.id,
                artist_name: data.artist_name,
                total_streams: data.total_streams,
                followers: data.followers, // Use followers count from API
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
              }).eq('id', catalogValuationId).select().maybeSingle();
              savedValuation = updated;
              saveError = updateError;
            } else {
              const {
                data: inserted,
                error: insertError
              } = await supabase.from('catalog_valuations').insert({
                user_id: user.user.id,
                artist_name: data.artist_name,
                total_streams: data.total_streams,
                followers: data.followers, // Use followers count from API
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
              }).select().maybeSingle();
              savedValuation = inserted;
              saveError = insertError;
            }
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
  }, [artistName, valuationParams, canAccess, showUpgradeModalForModule, toast, execute, incrementUsage, calculateCatalogAge, calculatedCatalogAge]);
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
Monthly Listeners: ${formatNumber(result.followers || 0)}
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
${result.cash_flow_projections ? result.cash_flow_projections.map(cf => `Year ${cf.year}: Revenue ${formatCurrency(cf.revenue)}, Growth ${cf.growth.toFixed(1)}%, PV ${formatCurrency(cf.discountedValue)}`).join('\n') : 'Cash flow projections not available'}

5-YEAR FORECAST (BASE CASE)
===========================
${result.forecasts.base.map(year => `Year ${year.year}: ${formatCurrency(year.valuation)} (${formatNumber(year.streams)} streams, ${formatCurrency(year.revenue)} revenue)`).join('\n')}

COMPARABLE ARTISTS
==================
${result.comparable_artists.map(comp => `${comp.name}: ${formatCurrency(comp.valuation)} (${formatNumber(comp.followers)} followers, ${comp.popularity}/100 popularity)`).join('\n')}

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
    const blob = new Blob([reportText], {
      type: 'text/plain'
    });
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
      description: "Comprehensive catalog valuation report has been downloaded successfully"
    });
  }, [result, formatCurrency, formatNumber, toast]);
  const {
    openPDFInNewWindow,
    downloadPDF
  } = usePDFGeneration();
  type ReportSection = 'executive' | 'technical' | 'market';
  const buildSectionHTML = useCallback((section: ReportSection) => {
    if (!result) return '<div>No data available</div>';

    // Helper formatters
    const pct = (v?: number) => v !== undefined && v !== null ? `${(v * 100).toFixed(1)}%` : 'N/A';

    // Build section bodies as HTML fragments (no <html>/<body> wrappers)
    if (section === 'executive') {
      const fmw = result.fair_market_value || {
        low: 0,
        mid: 0,
        high: 0
      };
      const comp = result.valuations?.base;
      const cagr = comp?.cagr || `${Math.round((result.growth_metrics?.estimated_cagr || 0) * 100) / 100}%`;
      return `
        <section>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
            <div>
              <h3>Key KPIs</h3>
              <ul>
                <li><strong>Risk-Adjusted Valuation:</strong> ${formatCurrency(result.risk_adjusted_value || result.valuation_amount)}</li>
                <li><strong>DCF Valuation:</strong> ${formatCurrency(result.dcf_valuation || 0)}</li>
                <li><strong>Multiple Valuation:</strong> ${formatCurrency(result.multiple_valuation || 0)}</li>
                <li><strong>Confidence:</strong> ${result.confidence_score || 0}/100</li>
              </ul>
            </div>
            <div>
              <h3>Catalog Snapshot</h3>
              <ul>
                <li><strong>Total Streams:</strong> ${formatNumber(result.total_streams || 0)}</li>
                <li><strong>Spotify Followers:</strong> ${formatNumber(result.followers || 0)}</li>
                <li><strong>Genre:</strong> ${result.genre || result.industry_benchmarks?.genre || 'N/A'}</li>
                <li><strong>Popularity:</strong> ${result.popularity_score || result.spotify_data?.popularity || 0}/100</li>
              </ul>
            </div>
          </div>

          <h3 style="margin-top:16px">Fair Market Value Range</h3>
          <ul>
            <li><strong>Low:</strong> ${formatCurrency(fmw.low)}</li>
            <li><strong>Mid:</strong> ${formatCurrency(fmw.mid)}</li>
            <li><strong>High:</strong> ${formatCurrency(fmw.high)}</li>
          </ul>

          <h3 style="margin-top:16px">Scenario Valuations</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">Scenario</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Current</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Year 5</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">CAGR</th>
              </tr>
            </thead>
            <tbody>
              ${['pessimistic', 'base', 'optimistic'].map(k => {
        const row = (result.valuations as any)?.[k] || {};
        return `<tr>
                  <td style="padding:6px;">${k[0].toUpperCase()}${k.slice(1)}</td>
                  <td style="padding:6px;text-align:right;">${row.current ? formatCurrency(row.current) : 'N/A'}</td>
                  <td style="padding:6px;text-align:right;">${row.year5 ? formatCurrency(row.year5) : 'N/A'}</td>
                  <td style="padding:6px;text-align:right;">${row.cagr || (k === 'base' ? cagr : 'N/A')}</td>
                </tr>`;
      }).join('')}
            </tbody>
          </table>

          <h3 style="margin-top:16px">Highlights</h3>
          <ul>
            ${result.has_additional_revenue ? `<li>Diversified revenue present; score ${result.revenue_diversification_score ?? 0}/100</li>` : ''}
            ${result.blended_valuation ? `<li>Enhanced blended valuation: ${formatCurrency(result.blended_valuation)}</li>` : ''}
            <li>Benchmark multiple: ${result.industry_benchmarks?.revenue_multiple || result.growth_metrics?.base_multiple || 0}x</li>
          </ul>
        </section>
      `;
    }
    if (section === 'technical') {
      return `
        <section>
          <h3>Methodology & Assumptions</h3>
          <ul>
            <li><strong>Method:</strong> ${result.valuation_methodology_v2 || result.valuation_methodology || 'Advanced (DCF + Risk)'}</li>
            <li><strong>Discount Rate:</strong> ${((result.discount_rate || 0.12) * 100).toFixed(1)}%</li>
            <li><strong>Catalog Age:</strong> ${result.catalog_age_years ?? 5} years</li>
            <li><strong>LTM Revenue:</strong> ${formatCurrency(result.ltm_revenue || 0)}</li>
          </ul>

          <h3 style="margin-top:16px">DCF Cash Flow Projections</h3>
          ${Array.isArray(result.cash_flow_projections) && result.cash_flow_projections.length ? `
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">Year</th>
                  <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Revenue</th>
                  <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Growth</th>
                  <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">PV</th>
                </tr>
              </thead>
              <tbody>
                ${result.cash_flow_projections.map(cf => `
                  <tr>
                    <td style="padding:6px;">${cf.year}</td>
                    <td style="padding:6px;text-align:right;">${formatCurrency(cf.revenue)}</td>
                    <td style="padding:6px;text-align:right;">${cf.growth?.toFixed(1)}%</td>
                    <td style="padding:6px;text-align:right;">${formatCurrency(cf.discountedValue)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div>Cash flow projections not available.</div>'}

          <h3 style="margin-top:16px">Benchmarks & Multiples</h3>
          <ul>
            <li><strong>Genre:</strong> ${result.industry_benchmarks?.genre || result.genre || 'N/A'}</li>
            <li><strong>Revenue Multiple:</strong> ${result.industry_benchmarks?.revenue_multiple || result.growth_metrics?.base_multiple || 0}x</li>
            <li><strong>Risk Factor:</strong> ${pct(result.industry_benchmarks?.risk_factor)}</li>
            <li><strong>Growth Assumption:</strong> ${pct(result.industry_benchmarks?.growth_assumption)}</li>
          </ul>

          ${result.comparable_multiples ? `
            <h3 style="margin-top:16px">Comparable Multiples</h3>
            <ul>
              <li><strong>EV/Revenue:</strong> ${result.comparable_multiples.ev_revenue_multiple}x</li>
              <li><strong>Peer Average:</strong> ${result.comparable_multiples.peer_average_multiple}x</li>
              <li><strong>Market Premium/Discount:</strong> ${result.comparable_multiples.market_premium_discount}x</li>
            </ul>
          ` : ''}

          <h3 style="margin-top:16px">Data Quality</h3>
          <ul>
            <li><strong>Confidence Score:</strong> ${result.confidence_score || 0}/100</li>
            <li><strong>Top Tracks Count:</strong> ${(result.top_tracks || []).length}</li>
          </ul>
        </section>
      `;
    }

    // market
    const comps = result.comparable_artists || [];
    const topTracks = result.top_tracks || [];
    const popularitySum = topTracks.reduce((s, t) => s + (t.popularity || 0), 0) || 1;
    const topShare = topTracks.length ? Math.round((topTracks[0].popularity || 0) / popularitySum * 100) : 0;
    return `
      <section>
        <h3>Positioning</h3>
        <ul>
          <li><strong>Followers:</strong> ${formatNumber(result.spotify_data?.followers || 0)}</li>
          <li><strong>Popularity:</strong> ${result.popularity_score || result.spotify_data?.popularity || 0}/100</li>
          <li><strong>Genre:</strong> ${result.genre || result.industry_benchmarks?.genre || 'N/A'}</li>
        </ul>

        <h3 style="margin-top:16px">Comparable Artists</h3>
        ${comps.length ? `
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">Artist</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Valuation</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Followers</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Popularity</th>
              </tr>
            </thead>
            <tbody>
              ${comps.map(c => `
                <tr>
                  <td style="padding:6px;">${c.name}</td>
                  <td style="padding:6px;text-align:right;">${formatCurrency(c.valuation || 0)}</td>
                  <td style="padding:6px;text-align:right;">${formatNumber(c.followers || 0)}</td>
                  <td style="padding:6px;text-align:right;">${c.popularity || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div>No comparable artists available.</div>'}

        <h3 style="margin-top:16px">Catalog Concentration</h3>
        <ul>
          <li><strong>Top Track Share (by popularity):</strong> ${topShare}%</li>
          <li><strong>Top Tracks Analyzed:</strong> ${topTracks.length}</li>
        </ul>

        <h3 style="margin-top:16px">Forecast Summary (Base)</h3>
        ${Array.isArray(result.forecasts?.base) && result.forecasts.base.length ? `
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">Year</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Streams</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Revenue</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:6px;">Valuation</th>
              </tr>
            </thead>
            <tbody>
              ${result.forecasts.base.map(y => `
                <tr>
                  <td style="padding:6px;">${y.year}</td>
                  <td style="padding:6px;text-align:right;">${formatNumber(y.streams || 0)}</td>
                  <td style="padding:6px;text-align:right;">${formatCurrency(y.revenue || 0)}</td>
                  <td style="padding:6px;text-align:right;">${formatCurrency(y.valuation || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div>No forecast data available.</div>'}

        <p style="margin-top:16px;color:#666;">Note: Market conditions and platform policies may impact future performance.</p>
      </section>
    `;
  }, [result, formatCurrency, formatNumber]);
  const buildPageHTML = useCallback((pageTitle: string, body: string) => {
    const safeBody = body || '<div>No content</div>';
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${pageTitle}</title>
          <style>
            body { font-family: Inter, ui-sans-serif, system-ui; padding: 24px; }
            h1 { margin: 0 0 8px; }
            h2 { margin: 16px 0 8px; }
            h3 { margin: 12px 0 6px; }
            ul { margin: 6px 0 0 16px; }
            table { font-size: 14px; }
            .muted { color: #666; }
            .section { margin-top: 16px; }
          </style>
        </head>
        <body>
          ${safeBody}
        </body>
      </html>`;
  }, []);
  const handleGenerateSectionReport = useCallback(async (section: ReportSection) => {
    if (!result) {
      toast({
        title: 'No data',
        description: 'Run a valuation first.'
      });
      return;
    }
    const sectionTitleMap: Record<ReportSection, string> = {
      executive: 'Executive Summary',
      technical: 'Technical Analysis',
      market: 'Market Analysis'
    };
    try {
      toast({
        title: 'Generating AI report',
        description: 'Fetching sourced analysis (this may take up to a few minutes)...'
      });
      const aiHtml = await generateReport({
        section,
        valuation: result,
        minWords: 2500
      });
      const body = `
      <h1>${sectionTitleMap[section]}</h1>
      <div class="muted">Artist: ${result.artist_name}</div>
      ${buildSectionHTML(section)}
      <h2 class="section">AI-Sourced Narrative</h2>
      ${aiHtml || '<p>No AI content generated.</p>'}
    `;
      const html = buildPageHTML(`${result.artist_name} - ${sectionTitleMap[section]}`, body);
      openPDFInNewWindow(html, `${result.artist_name} - ${section} report`);
    } catch (e) {
      console.error(e);
      toast({
        title: 'AI generation failed',
        description: 'Showing structured report without AI narrative.'
      });
      const body = `
        <h1>${sectionTitleMap[section]}</h1>
        <div class="muted">Artist: ${result.artist_name}</div>
        ${buildSectionHTML(section)}
      `;
      const htmlFallback = buildPageHTML(`${result.artist_name} - ${sectionTitleMap[section]}`, body);
      openPDFInNewWindow(htmlFallback, `${result.artist_name} - ${section} report`);
    }
  }, [result, buildSectionHTML, buildPageHTML, openPDFInNewWindow, toast, generateReport]);
  const exportJSON = useCallback(() => {
    if (!result) {
      toast({
        title: 'No data',
        description: 'Run a valuation first.'
      });
      return;
    }
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.artist_name.replace(/\s+/g, '_')}_valuation.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, toast]);
  const exportCSV = useCallback(() => {
    if (!result) {
      toast({
        title: 'No data',
        description: 'Run a valuation first.'
      });
      return;
    }
    const rows: Array<string[]> = [];
    rows.push(['Artist', 'Valuation', 'Confidence', 'Total Streams', 'Spotify Followers', 'Genre', 'Popularity']);
    rows.push([result.artist_name, String(result.risk_adjusted_value || result.valuation_amount || 0), String(result.confidence_score || 0), String(result.total_streams || 0), String(result.followers || 0), result.genre || result.industry_benchmarks?.genre || '', String(result.popularity_score || result.spotify_data?.popularity || 0)]);
    rows.push([]);
    rows.push(['Top Tracks']);
    rows.push(['Name', 'Popularity', 'Spotify URL']);
    (result.top_tracks || []).forEach(t => rows.push([t.name, String(t.popularity), t.spotify_url]));
    const csv = rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}` + '"').join(',')).join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.artist_name.replace(/\s+/g, '_')}_valuation.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, toast]);
  const exportXML = useCallback(() => {
    if (!result) {
      toast({
        title: 'No data',
        description: 'Run a valuation first.'
      });
      return;
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<valuation>
  <artist>${result.artist_name}</artist>
  <valuationAmount>${result.risk_adjusted_value || result.valuation_amount || 0}</valuationAmount>
  <confidence>${result.confidence_score || 0}</confidence>
  <totalStreams>${result.total_streams || 0}</totalStreams>
  <spotifyFollowers>${result.followers || 0}</spotifyFollowers>
  <genre>${result.genre || result.industry_benchmarks?.genre || ''}</genre>
</valuation>`;
    const blob = new Blob([xml], {
      type: 'application/xml'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.artist_name.replace(/\s+/g, '_')}_valuation.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, toast]);
  const handleFullPDFReport = useCallback(async () => {
    if (!result) {
      toast({
        title: 'No data',
        description: 'Run a valuation first.'
      });
      return;
    }
    try {
      toast({
        title: 'Generating full AI report',
        description: 'Fetching sourced narratives for all sections...'
      });
      const [execHtml, techHtml, marketHtml] = await Promise.all([generateReport({
        section: 'executive',
        valuation: result,
        minWords: 2500
      }), generateReport({
        section: 'technical',
        valuation: result,
        minWords: 2500
      }), generateReport({
        section: 'market',
        valuation: result,
        minWords: 2500
      })]);
      const body = `
        <h1>Full Valuation Report</h1>
        <div class="muted">Artist: ${result.artist_name}</div>
        <h2>Executive Summary</h2>
        ${buildSectionHTML('executive')}
        <h3>AI-Sourced Narrative</h3>
        ${execHtml || ''}
        <h2>Technical Analysis</h2>
        ${buildSectionHTML('technical')}
        <h3>AI-Sourced Narrative</h3>
        ${techHtml || ''}
        <h2>Market Analysis</h2>
        ${buildSectionHTML('market')}
        <h3>AI-Sourced Narrative</h3>
        ${marketHtml || ''}
      `;
      const html = buildPageHTML(`${result.artist_name} - Full Valuation Report`, body);
      openPDFInNewWindow(html, `${result.artist_name} - Full Valuation Report`);
    } catch (e) {
      console.error(e);
      toast({
        title: 'AI generation failed',
        description: 'Showing structured report without AI narratives.'
      });
      const body = `
        <h1>Full Valuation Report</h1>
        <div class="muted">Artist: ${result.artist_name}</div>
        <h2>Executive Summary</h2>
        ${buildSectionHTML('executive')}
        <h2>Technical Analysis</h2>
        ${buildSectionHTML('technical')}
        <h2>Market Analysis</h2>
        ${buildSectionHTML('market')}
      `;
      const html = buildPageHTML(`${result.artist_name} - Full Valuation Report`, body);
      openPDFInNewWindow(html, `${result.artist_name} - Full Valuation Report`);
    }
  }, [result, buildSectionHTML, buildPageHTML, openPDFInNewWindow, toast, generateReport]);
  return <AsyncLoading isLoading={loading} error={error?.message} skeleton={<CatalogValuationSkeleton />} retry={handleSearch}>
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Advanced Catalog Valuation
          </CardTitle>
          <CardDescription>
            Discover the estimated value of any artist's music catalog using publicly available data and industry benchmarks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Enter artist or songwriter name..." value={artistName} onChange={e => setArtistName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} disabled={loading} className="flex-1" />
            <Button onClick={handleSearch} disabled={loading || !artistName.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
            {loading && <Button variant="outline" onClick={() => window.location.reload()}>
                Reset
              </Button>}
          </div>
          
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}>
              {showAdvancedInputs ? "Hide" : "Show"} Advanced Parameters
            </Button>
          </div>

          {showAdvancedInputs && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-secondary/30">
              <div className="space-y-2">
                <Label htmlFor="territory">Territory Focus</Label>
                <Select value={valuationParams.territory || 'global'} onValueChange={(value: 'global' | 'us-only' | 'international') => setValuationParams(prev => ({
                ...prev,
                territory: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">
                      <div className="flex items-center gap-2">
                        <span>🌍</span>
                        <span>Global Markets</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="us-only">
                      <div className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>US-Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="international">
                      <div className="flex items-center gap-2">
                        <span>🌐</span>
                        <span>International</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-rate">Discount Rate (%)</Label>
                <Input id="discount-rate" type="number" min="8" max="20" step="0.5" value={(valuationParams.discountRate || 0.12) * 100} onChange={e => setValuationParams(prev => ({
                ...prev,
                discountRate: parseFloat(e.target.value) / 100
              }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalog-age">Catalog Age</Label>
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{calculatedCatalogAge} years</span>
                    <Badge variant={catalogAgeSource === 'calculated' ? 'default' : 'secondary'}>
                      {catalogAgeSource === 'calculated' ? 'Auto-calculated' : 'Default estimate'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {catalogAgeSource === 'calculated' 
                      ? 'Based on earliest release date from discography' 
                      : 'Using industry standard default (no release data available)'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodology">Valuation Method</Label>
                <Select value={valuationParams.methodology || 'advanced'} onValueChange={value => setValuationParams(prev => ({
                ...prev,
                methodology: value
              }))}>
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
            </div>}
        </CardContent>
      </Card>

      {result && <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">DCF Analysis</TabsTrigger>
              <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
              <TabsTrigger value="comparables">Comparables</TabsTrigger>
              <TabsTrigger value="revenue-sources">Revenue Sources</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="market-intelligence">Market Intelligence</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Data Accuracy Disclaimer */}
              <Alert className="border-yellow-400 bg-gray-900 text-white">
                <Eye className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-sm font-medium leading-relaxed text-white">
                  <strong className="font-semibold text-red-400">Data Accuracy Notice:</strong> This valuation combines direct Spotify data (followers, popularity scores, genres) with proprietary estimates (streams, revenue calculations) and industry benchmarks. All financial projections are estimates based on modeling assumptions and should not be considered as investment advice or guaranteed values.
                </AlertDescription>
              </Alert>

              {/* Key Metrics Grid */}
              <TooltipProvider>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {(() => {
                  // Calculate territory multiplier
                  const selectedTerritory = result.territory_focus || valuationParams.territory;
                  const territoryMultiplier = selectedTerritory === 'international' ? 0.8 : selectedTerritory === 'us-only' ? 1.2 : 1.0;

                  // Apply territory adjustment to all valuations
                  const adjustedBlendedValuation = result.blended_valuation ? result.blended_valuation * territoryMultiplier : null;
                  const adjustedRiskAdjustedValue = (result.risk_adjusted_value || result.valuation_amount) * territoryMultiplier;
                  const adjustedDcfValuation = (result.dcf_valuation || 0) * territoryMultiplier;
                  const adjustedMultipleValuation = (result.multiple_valuation || 0) * territoryMultiplier;
                  return <>
                        {/* Enhanced Valuation - Show if available */}
                        {adjustedBlendedValuation && result.has_additional_revenue ? 
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Card className="ring-2 ring-primary/20 cursor-help">
                                <CardContent className="p-6">
                                  <div className="flex items-center space-x-2">
                                    <Zap className="h-4 w-4 text-primary" />
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium leading-none">Enhanced Valuation</p>
                                      <p className="text-xl font-bold text-primary">
                                        {formatCurrency(adjustedBlendedValuation)}
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <Badge variant="secondary" className="text-xs">
                                          {((adjustedBlendedValuation - adjustedRiskAdjustedValue) / adjustedRiskAdjustedValue * 100).toFixed(1)}% uplift
                                        </Badge>
                                        {territoryMultiplier !== 1.0 && <Badge variant="outline" className="text-xs">
                                            {selectedTerritory} {(territoryMultiplier * 100).toFixed(0)}%
                                          </Badge>}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p><strong>Enhanced Valuation</strong></p>
                              <p><strong>⚠️ ESTIMATE:</strong> Combines estimated streaming revenue (70% weight) with user-declared additional revenue (30% weight). Stream counts and revenue conversion rates are proprietary calculations, not actual platform data.</p>
                            </TooltipContent>
                          </UITooltip>
                         : 
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Card className="cursor-help">
                                <CardContent className="p-6">
                                  <div className="flex items-center space-x-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium leading-none">Risk-Adjusted Value</p>
                                      <p className="text-xl font-bold text-primary">
                                        {formatCurrency(adjustedRiskAdjustedValue)}
                                      </p>
                                      {territoryMultiplier !== 1.0 && <Badge variant="outline" className="text-xs">
                                          {selectedTerritory} {(territoryMultiplier * 100).toFixed(0)}%
                                        </Badge>}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p><strong>Risk-Adjusted Value</strong></p>
                              <p><strong>⚠️ ESTIMATE:</strong> Based on estimated streaming calculations adjusted for verified Spotify popularity scores and proprietary risk factors. Revenue projections use modeled conversion rates, not actual platform payouts.</p>
                            </TooltipContent>
                          </UITooltip>
                        }

                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Card className="cursor-help">
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                  <Calculator className="h-4 w-4 text-blue-600" />
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">DCF Valuation</p>
                                    <p className="text-xl font-bold text-blue-600">
                                      {formatCurrency(adjustedDcfValuation)}
                                    </p>
                                    {territoryMultiplier !== 1.0 && <Badge variant="outline" className="text-xs">
                                        {selectedTerritory} {(territoryMultiplier * 100).toFixed(0)}%
                                      </Badge>}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p><strong>DCF (Discounted Cash Flow) Valuation</strong></p>
                            <p>10-year revenue projection using Spotify streaming trends, discounted at 12% risk rate. Based on verified streaming history and exponential decay models from industry transaction data.</p>
                          </TooltipContent>
                        </UITooltip>

                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Card className="cursor-help">
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                  <BarChart3 className="h-4 w-4 text-green-600" />
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Multiple Valuation</p>
                                    <p className="text-xl font-bold text-green-600">
                                      {formatCurrency(adjustedMultipleValuation)}
                                    </p>
                                    {territoryMultiplier !== 1.0 && <Badge variant="outline" className="text-xs">
                                        {selectedTerritory} {(territoryMultiplier * 100).toFixed(0)}%
                                      </Badge>}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p><strong>Multiple Valuation</strong></p>
                            <p>Spotify-derived LTM revenue × genre-specific industry multiples (4x-18x). Based on public catalog transaction data and streaming-to-revenue conversion rates by genre.</p>
                          </TooltipContent>
                        </UITooltip>

                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Card className="cursor-help">
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
                          </TooltipTrigger>
                           <TooltipContent className="max-w-xs">
                             <p><strong>Confidence Score</strong></p>
                             <p>Data completeness metric based on Spotify API coverage, track history depth, and revenue verification. 90+ indicates institutional-grade data quality for transactions.</p>
                           </TooltipContent>
                        </UITooltip>

                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Card className="cursor-help">
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
                          </TooltipTrigger>
                           <TooltipContent className="max-w-xs">
                             <p><strong>LTM Revenue</strong></p>
                             <p>Calculated from Spotify streaming data using verified genre-specific per-stream rates ($0.002-$0.004). Additional revenues user-reported and confidence-weighted.</p>
                           </TooltipContent>
                        </UITooltip>

                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Card className="cursor-help">
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
                          </TooltipTrigger>
                           <TooltipContent className="max-w-xs">
                             <p><strong>Popularity Score</strong></p>
                             <p>Direct from Spotify API (0-100 scale). Reflects current market heat based on recent plays, playlist adds, and algorithmic performance. Key risk factor for catalog sustainability.</p>
                           </TooltipContent>
                        </UITooltip>
                      </>;
                })()}
                </div>
              </TooltipProvider>

              {/* Territory Analysis */}
              {(() => {
              // Calculate territory multiplier
              const selectedTerritory = result.territory_focus || valuationParams.territory;
              const territoryMultiplier = selectedTerritory === 'international' ? 0.8 : selectedTerritory === 'us-only' ? 1.2 : 1.0;

              // Apply territory adjustment to all valuations
              const adjustedValuation = (result.risk_adjusted_value || result.valuation_amount) * territoryMultiplier;
              return <TerritoryBreakdownCard territory={selectedTerritory} territoryMultiplier={territoryMultiplier} totalValuation={adjustedValuation} domesticShare={0.7} internationalShare={0.3} />;
            })()}

              {/* Artist Spotify Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Spotify Artist Information
                  </CardTitle>
                  <CardDescription>
                    Artist profile data from Spotify API (followers count, not monthly listeners)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Primary Genre</p>
                      <Badge variant="secondary" className="text-sm">
                        {result.genre || result.industry_benchmarks?.genre || 'N/A'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Spotify Followers</p>
                      <p className="text-lg font-bold text-primary">
                        {formatNumber(result.spotify_data?.followers || 0)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Total Streams</p>
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          ESTIMATED
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {formatNumber(result.total_streams || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Calculated from track popularity scores, not actual streaming data
                      </p>
                    </div>
                  </div>
                  
                  {result.top_tracks && result.top_tracks.length > 0 && <div className="space-y-3">
                      <h4 className="font-medium text-sm">Top Tracks</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.top_tracks.slice(0, 10).map((track, index) => <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-secondary/20">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{track.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {track.popularity}/100
                                </Badge>
                                {track.spotify_url && <a href={track.spotify_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                    View on Spotify
                                  </a>}
                              </div>
                            </div>
                          </div>)}
                      </div>
                    </div>}
                </CardContent>
              </Card>


              {/* Enhanced Valuation Insights */}
              {result.has_additional_revenue && <Card className="col-span-full border-primary/20">
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
                </Card>}

              {/* Confidence Meter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Valuation Confidence Analysis
                  </CardTitle>
                  <CardDescription>
                    Proprietary confidence scoring based on data availability and model assumptions
                  </CardDescription>
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
              {result.industry_benchmarks && <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Industry Benchmarks
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        HISTORICAL DATA
                      </Badge>
                    </CardTitle>
                    <CardDescription>Genre-specific market data for {result.industry_benchmarks.genre} - based on historical transaction multiples</CardDescription>
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
                </Card>}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {/* Cash Flow Projections Disclaimer */}
              <Alert className="border-yellow-200 bg-yellow-50">
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <strong>Forward-Looking Estimates:</strong> All cash flow projections are theoretical calculations based on estimated current performance and industry decay models. Actual future performance may vary significantly from these projections.
                </AlertDescription>
              </Alert>

              {/* DCF Components */}
              <Card>
                <CardHeader>
                  <CardTitle>Discounted Cash Flow Analysis</CardTitle>
                  <CardDescription>
                    Intrinsic value based on projected future cash flows - all projections are estimates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.cash_flow_projections && result.cash_flow_projections.length > 0 ? <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">Cash Flow Projections</h4>
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            PROJECTIONS
                          </Badge>
                        </div>
                        {result.cash_flow_projections.map(cf => <div key={cf.year} className="flex items-center justify-between p-3 border rounded-lg">
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
                          </div>)}
                      </div> : <p className="text-muted-foreground">Cash flow projections not available for this valuation</p>}
                    
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
                      {(["pessimistic", "base", "optimistic"] as const).map(scenario => <Button key={scenario} variant={selectedScenario === scenario ? "default" : "outline"} size="sm" onClick={() => setSelectedScenario(scenario)} className="capitalize">
                          {scenario === "base" ? "Base Case" : scenario}
                        </Button>)}
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
                    {/* CAGR Control Slider */}
                    <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-semibold">Growth Rate (CAGR)</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Compound Annual Growth Rate - Industry benchmark: {getDefaultCagr}%
                              {customCagr !== getDefaultCagr && (
                                <span className="ml-2 text-primary font-medium">
                                  (Custom: {customCagr.toFixed(1)}%)
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-primary">{customCagr.toFixed(1)}%</span>
                            <p className="text-xs text-muted-foreground">Current Rate</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Slider
                            value={[customCagr]}
                            onValueChange={([value]) => setCustomCagr(value)}
                            max={20}
                            min={-5}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>-5%</span>
                            <span>0%</span>
                            <span>5%</span>
                            <span>10%</span>
                            <span>15%</span>
                            <span>20%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCustomCagr(getDefaultCagr)}
                            className="h-7 text-xs"
                          >
                            Reset to Industry Benchmark
                          </Button>
                          <div className="flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                              Conservative: 0-3%
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Market: 4-8%
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Aggressive: 9%+
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Current Valuation</p>
                        <p className="text-xl font-bold text-primary">
                          {adjustedValuations ? formatCurrency(adjustedValuations.current) : formatCurrency(result.valuations[selectedScenario].current)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Year 5 Valuation</p>
                        <p className="text-xl font-bold text-primary">
                          {adjustedValuations ? formatCurrency(adjustedValuations.year5) : formatCurrency(result.valuations[selectedScenario].year5)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">5-Year CAGR</p>
                        <p className="text-xl font-bold text-green-600">
                          {adjustedValuations ? adjustedValuations.cagr : result.valuations[selectedScenario].cagr}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Return</p>
                        <p className="text-xl font-bold text-green-600">
                          {adjustedValuations ? adjustedValuations.totalReturn.toFixed(0) : ((result.valuations[selectedScenario].year5 / result.valuations[selectedScenario].current - 1) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium">Year-by-Year Breakdown</p>
                      {(adjustedValuations ? adjustedValuations.forecasts : result.forecasts[selectedScenario]).map(year => <div key={year.year} className="flex items-center justify-between p-3 border rounded-lg">
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
                        </div>)}
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
                      {result.comparable_artists.map((comp, index) => <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{comp.name}</p>
                            {comp.spotify_id && <Button variant="outline" size="sm" onClick={() => window.open(`https://open.spotify.com/artist/${comp.spotify_id}`, '_blank')}>
                                View
                              </Button>}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {formatNumber(comp.followers)} followers
                            </p>
                            {comp.popularity && <p className="text-sm text-muted-foreground">
                                Popularity: {comp.popularity}/100
                              </p>}
                            <p className="font-bold text-primary">
                              {formatCurrency(comp.valuation)}
                            </p>
                            {comp.genres && comp.genres.length > 0 && <div className="flex flex-wrap gap-1 mt-2">
                                {comp.genres.slice(0, 2).map((genre, genreIndex) => <Badge key={genreIndex} variant="outline" className="text-xs">
                                    {genre}
                                  </Badge>)}
                              </div>}
                          </div>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Valuation Multiples</CardTitle>
                    <CardDescription>Market multiples and premiums</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.comparable_multiples ? <>
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
                      </> : <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                        <p className="text-sm font-medium">Base Revenue Multiple</p>
                        <p className="text-lg font-bold">
                          {result.growth_metrics.base_multiple.toFixed(1)}x Revenue
                        </p>
                      </div>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Back Navigation */}
              <div className="flex items-center gap-2 mb-4">
                 <Button variant="ghost" size="sm" onClick={() => setActiveTab("overview")} className="text-muted-foreground hover:text-foreground">
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
                        <Pie data={[{
                        name: 'DCF Valuation',
                        value: result.dcf_valuation || 0,
                        fill: '#3b82f6'
                      }, {
                        name: 'Multiple Valuation',
                        value: result.multiple_valuation || 0,
                        fill: '#10b981'
                      }, {
                        name: 'Risk Adjustment',
                        value: Math.abs((result.risk_adjusted_value || result.valuation_amount) - ((result.dcf_valuation || 0) + (result.multiple_valuation || 0)) / 2),
                        fill: '#f59e0b'
                      }].filter(item => item.value > 0)} cx="50%" cy="50%" labelLine={false} label={({
                        name,
                        percent
                      }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                          {[{
                          name: 'DCF Valuation',
                          value: result.dcf_valuation || 0,
                          fill: '#3b82f6'
                        }, {
                          name: 'Multiple Valuation',
                          value: result.multiple_valuation || 0,
                          fill: '#10b981'
                        }, {
                          name: 'Risk Adjustment',
                          value: Math.abs((result.risk_adjusted_value || result.valuation_amount) - ((result.dcf_valuation || 0) + (result.multiple_valuation || 0)) / 2),
                          fill: '#f59e0b'
                        }].filter(item => item.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip formatter={value => formatCurrency(value as number)} />
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
                      <RechartsLineChart data={result.forecasts.base.map((baseYear, index) => ({
                      year: `Year ${baseYear.year}`,
                      pessimistic: result.forecasts.pessimistic[index]?.valuation || 0,
                      base: baseYear.valuation,
                      optimistic: result.forecasts.optimistic[index]?.valuation || 0
                    }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={value => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={value => formatCurrency(value as number)} />
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
                      <ComposedChart data={result.forecasts.base.map(year => ({
                      year: `Year ${year.year}`,
                      revenue: year.revenue,
                      streams: year.streams / 1000000,
                      // Convert to millions
                      efficiency: year.revenue / year.streams * 1000000 // Revenue per million streams
                    }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" tickFormatter={value => `$${value.toFixed(0)}`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={value => `${value.toFixed(1)}M`} />
                        <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(value as number) : name === 'streams' ? `${(value as number).toFixed(1)}M streams` : `$${(value as number).toFixed(2)}/M streams`, name === 'revenue' ? 'Revenue' : name === 'streams' ? 'Streams (M)' : 'Efficiency']} />
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
                        <XAxis type="number" dataKey="risk" name="Risk Score" domain={[0, 100]} tickFormatter={value => `${value}%`} />
                        <YAxis type="number" dataKey="return" name="Expected Return" tickFormatter={value => `${value}%`} />
                        <Tooltip cursor={{
                        strokeDasharray: '3 3'
                      }} formatter={(value, name) => [`${(value as number).toFixed(1)}%`, name === 'return' ? 'Expected Return' : 'Risk Score']} />
                        <Scatter name="Scenarios" data={[{
                        risk: 100 - (result.confidence_score || 50),
                        return: parseFloat(result.valuations.pessimistic.cagr),
                        scenario: 'Pessimistic'
                      }, {
                        risk: 100 - (result.confidence_score || 50) - 20,
                        return: parseFloat(result.valuations.base.cagr),
                        scenario: 'Base Case'
                      }, {
                        risk: 100 - (result.confidence_score || 50) - 40,
                        return: parseFloat(result.valuations.optimistic.cagr),
                        scenario: 'Optimistic'
                      }]} fill="#8884d8" />
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
                        <XAxis type="number" dataKey="followers" name="Followers" tickFormatter={value => `${(value / 1000).toFixed(0)}K`} />
                        <YAxis type="number" dataKey="valuation" name="Valuation" tickFormatter={value => formatCurrency(value)} />
                        <Tooltip cursor={{
                        strokeDasharray: '3 3'
                      }} formatter={(value, name) => [name === 'valuation' ? formatCurrency(value as number) : `${formatNumber(value as number)} followers`, name === 'valuation' ? 'Valuation' : 'Followers']} />
                        <Scatter name="Target Artist" data={[{
                        followers: result.spotify_data.followers,
                        valuation: result.risk_adjusted_value || result.valuation_amount,
                        name: result.artist_name
                      }]} fill="#ef4444" />
                        <Scatter name="Comparables" data={result.comparable_artists.map(comp => ({
                        followers: comp.followers,
                        valuation: comp.valuation,
                        name: comp.name
                      }))} fill="#3b82f6" />
                      </ScatterChart>
                    </ResponsiveContainer>
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
                        {parseFloat(result.valuations.base.cagr) > 10 ? "Strong growth potential with above-market CAGR projections" : parseFloat(result.valuations.base.cagr) > 5 ? "Moderate growth expected, aligned with industry standards" : "Conservative growth outlook, consider risk factors"}
                      </p>
                    </div>

                    {/* Market Position Insight */}
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Market Position</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        {result.spotify_data.followers > result.comparable_artists.reduce((sum, comp) => sum + comp.followers, 0) / result.comparable_artists.length ? "Above-average market position with strong follower base" : "Emerging artist with growth potential relative to peers"}
                      </p>
                    </div>

                    {/* Risk Assessment Insight */}
                    <div className="p-4 border rounded-lg bg-orange-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Risk Assessment</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        {(result.confidence_score || 0) >= 70 ? "Low-risk investment with strong data confidence" : (result.confidence_score || 0) >= 50 ? "Moderate risk profile, consider additional due diligence" : "Higher risk investment, limited historical data available"}
                      </p>
                    </div>

                    {/* Valuation Method Insight */}
                    <div className="p-4 border rounded-lg bg-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">Valuation Quality</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        {result.dcf_valuation && result.multiple_valuation ? "Comprehensive valuation using multiple methodologies" : "Single-method valuation, consider cross-validation"}
                      </p>
                    </div>

                    {/* Revenue Efficiency Insight */}
                    <div className="p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Revenue Efficiency</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        {(result.ltm_revenue || 0) / result.total_streams * 1000000 > 3 ? "High revenue per million streams, strong monetization" : (result.ltm_revenue || 0) / result.total_streams * 1000000 > 2 ? "Average monetization efficiency" : "Opportunity to improve revenue per stream"}
                      </p>
                    </div>

                    {/* Genre Performance Insight */}
                    <div className="p-4 border rounded-lg bg-indigo-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-indigo-800">Genre Analysis</span>
                      </div>
                      <p className="text-sm text-indigo-700">
                        {result.industry_benchmarks ? `${result.genre} genre shows ${result.industry_benchmarks.growth_assumption > 0.05 ? 'strong' : 'stable'} market dynamics` : "Genre-specific benchmarks applied for accurate valuation"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

             <TabsContent value="revenue-sources" className="space-y-6">
               {/* Back Navigation */}
               <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("overview")} className="flex items-center gap-2">
                   <ArrowLeft className="h-4 w-4" />
                   Back to Overview
                 </Button>
               </div>

               {/* Instructions */}
               {!result && <Card>
                   <CardContent className="p-6">
                     <div className="text-center space-y-2">
                       <h3 className="text-lg font-medium">Additional Revenue Analysis</h3>
                       <p className="text-muted-foreground">
                         First complete a catalog valuation, then add additional revenue sources for enhanced analysis.
                       </p>
                        <Button variant="outline" onClick={() => setActiveTab("overview")}>
                          Start Catalog Valuation
                        </Button>
                     </div>
                   </CardContent>
                 </Card>}

                {/* Revenue Sources Form - Show when we have a valuation result */}
                {result && <>
                    <RevenueSourcesForm catalogValuationId={catalogValuationId} onMetricsUpdate={metrics => {
                console.log('Revenue metrics updated:', metrics);
                setRevenueMetrics(metrics);
              }} onValuationUpdate={() => {
                console.log('Revenue source updated, refreshing valuation with enhanced methodology');
                console.log('Current catalogValuationId:', catalogValuationId);
                // First refresh parent revenue sources, then recompute valuation
                try {
                  refetch?.();
                } catch (e) {
                  console.warn('Refetch revenue sources failed', e);
                }
                if (artistName) {
                  handleSearch();
                }
              }} />
                   
                   {/* Enhanced Valuation Engine */}
                   {revenueMetrics && revenueSources.length > 0 && <EnhancedValuationEngine baseValuation={result} revenueSources={revenueSources} revenueMetrics={computedRevenueMetrics} />}
                 </>}
              </TabsContent>


            <TabsContent value="reports" className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Professional Reports Suite</h2>
                <p className="text-muted-foreground">Generate detailed reports for different stakeholders</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-electric-lavender/40">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      <CardTitle>Executive Summary</CardTitle>
                    </div>
                    <CardDescription>High-level overview for investors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>Valuation</span><span className="font-semibold">{formatCurrency(result.risk_adjusted_value || result.valuation_amount)}</span></div>
                      <div className="flex justify-between"><span>5Y CAGR</span><span className="font-semibold">{result.valuations?.base?.cagr || `${Math.round((result.growth_metrics?.estimated_cagr || 0) * 100) / 100}%`}</span></div>
                      <div className="flex justify-between"><span>Confidence</span><span className="font-semibold">{result.confidence_score || 0}/100</span></div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => handleGenerateSectionReport('executive')} className="w-full sm:w-auto">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-music-blue/40">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      <CardTitle>Technical Analysis</CardTitle>
                    </div>
                    <CardDescription>Detailed DCF and methodology</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>DCF Value</span><span className="font-semibold">{formatCurrency(result.dcf_valuation || 0)}</span></div>
                      <div className="flex justify-between"><span>Multiple Value</span><span className="font-semibold">{formatCurrency(result.multiple_valuation || 0)}</span></div>
                      <div className="flex justify-between"><span>Discount Rate</span><span className="font-semibold">{((result.discount_rate || 0.12) * 100).toFixed(1)}%</span></div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => handleGenerateSectionReport('technical')} className="w-full sm:w-auto">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-success/40">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-success" />
                      <CardTitle>Market Analysis</CardTitle>
                    </div>
                    <CardDescription>Competitive landscape & positioning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>Comparables</span><span className="font-semibold">{result.comparable_artists?.length || 0} artists</span></div>
                      <div className="flex justify-between"><span>Market Multiple</span><span className="font-semibold">{result.industry_benchmarks?.revenue_multiple || result.growth_metrics?.base_multiple || 0}x</span></div>
                      <div className="flex justify-between"><span>Genre</span><span className="font-semibold">{result.genre || result.industry_benchmarks?.genre || 'N/A'}</span></div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => handleGenerateSectionReport('market')} className="w-full sm:w-auto">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Professional Valuation Report</CardTitle>
                      <CardDescription>Export valuation data in various formats</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
                    <Button variant="outline" onClick={exportJSON}>Export JSON</Button>
                    <Button variant="outline" onClick={exportXML}>Export XML</Button>
                    <div className="flex-1" />
                    <Button variant="fader" onClick={handleFullPDFReport}>Full PDF Report</Button>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Analytics content placeholder */}
              <div className="text-center py-8 text-muted-foreground">
                
              </div>
            </TabsContent>

            <TabsContent value="market-intelligence" className="space-y-6">
              <MarketIntelligenceTab 
                artistName={artistName}
                genre={result?.genre || 'Pop'}
                popularity={result?.popularity_score || 50}
              />
            </TabsContent>
          </Tabs>
        </>}
    </div>
    </AsyncLoading>;
});
export default CatalogValuation;