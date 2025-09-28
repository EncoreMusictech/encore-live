import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, PieChart, Calculator, Target, HelpCircle } from 'lucide-react';
import { RevenueSource } from '@/hooks/useCatalogRevenueSources';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface EnhancedValuationEngineProps {
  baseValuation: {
    risk_adjusted_value?: number;
    dcf_valuation?: number;
    multiple_valuation?: number;
    confidence_score?: number;
    valuation_amount?: number;
  };
  revenueSources: RevenueSource[];
  revenueMetrics: {
    totalAdditionalRevenue: number;
    revenueDiversificationScore: number;
    revenueBreakdown: Record<string, number>;
  };
}

export const EnhancedValuationEngine: React.FC<EnhancedValuationEngineProps> = ({
  baseValuation,
  revenueSources,
  revenueMetrics,
}) => {
  // Calculate confidence-adjusted additional revenue value
  const calculateConfidenceAdjustedAdditionalValue = () => {
    const multipliers = {
      streaming: 12,
      sync: 8,
      performance: 10,
      mechanical: 15,
      merchandise: 5,
      touring: 3,
      publishing: 18,
      master_licensing: 12,
      other: 6,
    };

    const confidenceMultipliers = {
      high: 1.1,
      medium: 1.0,
      low: 0.8,
    };

    let totalAdditionalValue = 0;
    let totalRevenue = 0;
    let weightedMultiplier = 0;

    // Apply confidence multipliers to each individual revenue source
    revenueSources.forEach((source) => {
      const baseMultiplier = multipliers[source.revenue_type as keyof typeof multipliers] || 6;
      const confidenceMultiplier = confidenceMultipliers[source.confidence_level] || 1.0;
      
      // Apply confidence multiplier to the revenue, then multiply by type multiplier
      const adjustedRevenue = source.annual_revenue * confidenceMultiplier;
      const sourceValue = adjustedRevenue * baseMultiplier;
      
      totalAdditionalValue += sourceValue;
      totalRevenue += source.annual_revenue;
    });

    // Calculate weighted multiplier for display purposes
    if (totalRevenue > 0) {
      Object.entries(revenueMetrics.revenueBreakdown).forEach(([type, revenue]) => {
        const weight = revenue / totalRevenue;
        weightedMultiplier += (multipliers[type as keyof typeof multipliers] || 6) * weight;
      });
    }

    return {
      additionalValue: totalAdditionalValue,
      weightedMultiplier,
    };
  };

  // Calculate blended valuation
  const calculateBlendedValuation = () => {
    const { additionalValue, weightedMultiplier } = calculateConfidenceAdjustedAdditionalValue();
    
    // Diversification bonus (up to 20% increase for fully diversified portfolio)
    const diversificationBonus = revenueMetrics.revenueDiversificationScore * 0.2;
    
    // Calculate weighted valuation
    const baseWeight = 0.7; // 70% weight to base valuation
    const additionalWeight = 0.3; // 30% weight to additional revenue
    
    const baseValue = baseValuation.risk_adjusted_value || baseValuation.valuation_amount || 0;
    const blendedValue = (baseValue * baseWeight) + (additionalValue * additionalWeight);
    
    // Apply diversification bonus
    const finalValue = blendedValue * (1 + diversificationBonus);
    
    return {
      blendedValue: finalValue,
      additionalValue,
      diversificationBonus: diversificationBonus * 100,
      confidenceBoost: calculateConfidenceBoost(),
      baseValue,
    };
  };

  // Get revenue type multipliers based on industry standards
  const getRevenueTypeMultiplier = () => {
    const multipliers = {
      streaming: 12, // 12x annual streaming revenue
      sync: 8, // 8x annual sync revenue
      performance: 10, // 10x annual performance revenue
      mechanical: 15, // 15x annual mechanical revenue
      merchandise: 5, // 5x annual merchandise revenue
      touring: 3, // 3x annual touring revenue (more volatile)
      publishing: 18, // 18x annual publishing revenue
      master_licensing: 12, // 12x annual master licensing
      other: 6, // 6x other revenue (conservative)
    };

    let weightedMultiplier = 0;
    let totalRevenue = revenueMetrics.totalAdditionalRevenue;

    if (totalRevenue === 0) return 0;

    Object.entries(revenueMetrics.revenueBreakdown).forEach(([type, revenue]) => {
      const weight = revenue / totalRevenue;
      weightedMultiplier += (multipliers[type as keyof typeof multipliers] || 6) * weight;
    });

    return weightedMultiplier;
  };

  // Calculate confidence boost from additional data
  const calculateConfidenceBoost = () => {
    const dataPoints = revenueSources.length;
    const highConfidenceCount = revenueSources.filter(s => s.confidence_level === 'high').length;
    const mediumConfidenceCount = revenueSources.filter(s => s.confidence_level === 'medium').length;
    
    // Base boost from having additional data points
    const dataBoost = Math.min(dataPoints * 5, 25); // Max 25% boost
    
    // Quality boost from confidence levels
    const qualityBoost = (highConfidenceCount * 3) + (mediumConfidenceCount * 1.5);
    
    return Math.min(dataBoost + qualityBoost, 30); // Max 30% total boost
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const blendedResults = calculateBlendedValuation();
  const baseConfidence = baseValuation.confidence_score || 0;
  const enhancedConfidence = Math.min(baseConfidence + blendedResults.confidenceBoost, 100);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Enhanced Valuation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="methodology">Methodology</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Valuation Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                          {formatCurrency(blendedResults.blendedValue)}
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground">Enhanced Fair Market Value</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Enhanced Fair Market Value</p>
                      <p className="text-sm">
                        Calculated as: (Base Valuation × 70%) + (Additional Revenue Value × 30%) × (1 + Diversification Bonus).
                        Combines traditional catalog valuation with additional revenue streams using industry-standard multipliers.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Badge variant="secondary" className="mt-2">
                    {blendedResults.baseValue > 0 ? 
                      ((blendedResults.blendedValue / blendedResults.baseValue - 1) * 100).toFixed(1) : 
                      'N/A'
                    }% vs Base Valuation
                  </Badge>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xl font-bold flex items-center justify-center gap-2">
                          {enhancedConfidence.toFixed(1)}%
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">Enhanced Confidence Score</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Enhanced Confidence Score</p>
                      <p className="text-sm">
                        Base confidence score enhanced by additional data quality. Boost calculated from: 
                        number of revenue sources (up to +25%) + quality weighting (high confidence = +3%, medium = +1.5% each). 
                        Maximum total boost: +30%.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Progress value={enhancedConfidence} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart className="h-4 w-4" />
                    <span className="font-medium">Revenue Diversification</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-2xl font-bold mb-1 flex items-center gap-2">
                          {Math.round(revenueMetrics.revenueDiversificationScore * 100)}%
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Diversification Score
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Revenue Diversification Score</p>
                      <p className="text-sm">
                        Calculated as: (Number of unique revenue types ÷ 9 possible types) × 100%. 
                        Higher diversification reduces risk and provides up to 20% valuation bonus. 
                        Maximum 9 revenue types: Streaming, Sync, Performance, Mechanical, Merch, Touring, Publishing, Master Licensing, Other.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Badge variant="outline" className="mt-2">
                    +{blendedResults.diversificationBonus.toFixed(1)}% Valuation Bonus
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Additional Revenue Value</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xl font-bold flex items-center gap-2">
                          {formatCurrency(blendedResults.additionalValue)}
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          From {revenueSources.length} additional sources
                        </div>
                      </div>
                    </TooltipTrigger>
                     <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Additional Revenue Value</p>
                      <p className="text-sm">
                        Calculated by applying confidence multipliers (High: 1.1x, Medium: 1.0x, Low: 0.8x) 
                        to individual revenue sources, then applying industry-standard revenue multiples: 
                        Publishing (18x), Mechanical (15x), Streaming (12x), Master Licensing (12x), 
                        Performance (10x), Sync (8x), Other (6x), Merchandise (5x), Touring (3x). 
                        Total value = Sum of (Confidence-Adjusted Annual Revenue × Type Multiplier).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Valuation Range */}
            <div className="p-4 border rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="font-medium mb-3 flex items-center gap-2 cursor-help">
                    Valuation Range Analysis
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </h4>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Valuation Range Analysis</p>
                  <p className="text-sm">
                    Conservative: 80% of enhanced valuation (accounts for market volatility).
                    Fair Market: Full enhanced valuation calculation.
                    Optimistic: 125% of enhanced valuation (best-case scenario with favorable market conditions).
                  </p>
                </TooltipContent>
              </Tooltip>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(blendedResults.blendedValue * 0.8)}
                  </div>
                  <div className="text-sm text-muted-foreground">Conservative</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(blendedResults.blendedValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Fair Market</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(blendedResults.blendedValue * 1.25)}
                  </div>
                  <div className="text-sm text-muted-foreground">Optimistic</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="methodology" className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <h4>Enhanced Valuation Methodology</h4>
              <p>
                The enhanced valuation combines traditional catalog valuation methods with 
                comprehensive additional revenue analysis to provide a more accurate fair market value.
              </p>
              
               <h5>Valuation Components:</h5>
               <ul>
                 <li><strong>Base Catalog Valuation (70% weight):</strong> Traditional DCF and comparable analysis</li>
                 <li><strong>Additional Revenue Valuation (30% weight):</strong> Confidence-adjusted revenue with type-specific multipliers</li>
                 <li><strong>Diversification Bonus:</strong> Up to 20% increase for revenue diversification</li>
                 <li><strong>Confidence Enhancement:</strong> Data quality improvements at source level</li>
               </ul>

               <h5>Confidence Multipliers (Applied to Individual Sources):</h5>
               <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                 <div>• High confidence: 1.1x</div>
                 <div>• Medium confidence: 1.0x</div>
                 <div>• Low confidence: 0.8x</div>
               </div>

              <h5>Revenue Type Multipliers:</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>• Publishing: 18x annual revenue</div>
                <div>• Mechanical: 15x annual revenue</div>
                <div>• Streaming: 12x annual revenue</div>
                <div>• Master Licensing: 12x annual revenue</div>
                <div>• Performance: 10x annual revenue</div>
                <div>• Sync/Licensing: 8x annual revenue</div>
                <div>• Other: 6x annual revenue</div>
                <div>• Merchandise: 5x annual revenue</div>
                <div>• Touring: 3x annual revenue</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Valuation Components</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Base Valuation (70%)</span>
                    <span className="font-medium">{formatCurrency(blendedResults.baseValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Additional Revenue (30%)</span>
                    <span className="font-medium">{formatCurrency(blendedResults.additionalValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Diversification Bonus</span>
                    <span className="font-medium text-green-600">
                      +{blendedResults.diversificationBonus.toFixed(1)}%
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-bold">
                    <span>Enhanced Valuation</span>
                    <span>{formatCurrency(blendedResults.blendedValue)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Revenue Source Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(revenueMetrics.revenueBreakdown).map(([type, revenue]) => {
                    const percentage = (revenue / revenueMetrics.totalAdditionalRevenue) * 100;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <span>{formatCurrency(revenue)}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-3">All Additional Revenue Sources</h4>
              {revenueSources.length === 0 ? (
                <div className="text-sm text-muted-foreground">No additional revenue sources added yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Annual Revenue</TableHead>
                      <TableHead className="text-right">Growth</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Recurring</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueSources.map((s) => {
                      const growth = typeof s.growth_rate === 'number' ? s.growth_rate : 0;
                      const growthPct = growth <= 1 ? growth * 100 : growth;
                      return (
                        <TableRow key={s.id || `${s.revenue_type}-${s.revenue_source}`}>
                          <TableCell className="capitalize">{s.revenue_type.replace('_', ' ')}</TableCell>
                          <TableCell>{s.revenue_source}</TableCell>
                          <TableCell className="text-right">{formatCurrency(s.annual_revenue)}</TableCell>
                          <TableCell className="text-right">{growthPct.toFixed(1)}%</TableCell>
                          <TableCell className="capitalize">{s.confidence_level}</TableCell>
                          <TableCell>{s.is_recurring ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sensitivity" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Revenue Growth Sensitivity</h4>
                <div className="space-y-2 text-sm">
                  {[-10, -5, 0, 5, 10, 20].map(growthRate => {
                    const adjustedRevenue = revenueMetrics.totalAdditionalRevenue * (1 + growthRate / 100);
                    const adjustedValue = blendedResults.blendedValue + 
                      ((adjustedRevenue - revenueMetrics.totalAdditionalRevenue) * getRevenueTypeMultiplier() * 0.3);
                    return (
                      <div key={growthRate} className="flex justify-between">
                        <span>{growthRate > 0 ? '+' : ''}{growthRate}% Revenue Growth</span>
                        <span>{formatCurrency(adjustedValue)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Multiple Sensitivity</h4>
                <div className="space-y-2 text-sm">
                  {[0.8, 0.9, 1.0, 1.1, 1.2, 1.3].map(multiplier => {
                    const adjustedValue = blendedResults.blendedValue * multiplier;
                    return (
                      <div key={multiplier} className="flex justify-between">
                        <span>{multiplier}x Multiple</span>
                        <span>{formatCurrency(adjustedValue)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};