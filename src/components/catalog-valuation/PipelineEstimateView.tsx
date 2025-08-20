import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertCircle, Music2, Radio, Disc, Film, BarChart3 } from 'lucide-react';
import { useSongEstimator } from '@/hooks/useSongEstimator';
import { computeCatalogPipeline, defaultPipelineConfig } from '@/utils/pipelineValuation';
import { supabase } from '@/integrations/supabase/client';

interface SongMetadata {
  id: string;
  song_title: string;
  songwriter_name: string;
  co_writers: string[];
  publishers: any;
  pro_registrations: any;
  iswc?: string;
  estimated_splits: any;
  registration_gaps: string[];
  metadata_completeness_score: number;
  verification_status: string;
}

interface PipelineEstimateViewProps {
  searchId: string;
  songMetadata: SongMetadata[];
}

export function PipelineEstimateView({ searchId, songMetadata }: PipelineEstimateViewProps) {
  const [selectedEstimateType, setSelectedEstimateType] = useState<'total' | 'performance' | 'mechanical' | 'sync'>('total');
  const { loading } = useSongEstimator();
  const lastSavedTotalRef = useRef<number>(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-success text-success-foreground">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-destructive text-destructive-foreground">Low Confidence</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Unknown</Badge>;
    }
  };

  // Deterministic rules-based calculation
  const catalog = useMemo(() => computeCatalogPipeline(songMetadata as any, defaultPipelineConfig), [songMetadata]);
  const confidenceLevel = useMemo(() => (catalog.confidenceScore >= 80 ? 'high' : catalog.confidenceScore >= 60 ? 'medium' : 'low'), [catalog.confidenceScore]);
  const totalBasePipeline = useMemo(() => catalog.songResults.reduce((s, r) => s + r.basePipeline, 0), [catalog.songResults]);
  const missingImpact = Math.max(0, totalBasePipeline - catalog.total);
  const potentialUpside = catalog.total * 0.2;

  // Build deterministic data for UI (replaces previous mock data)
  const computeFactors = () => {
    const missingISWC = songMetadata.filter(s => !s.iswc).length;
    const verifiedCount = songMetadata.filter(s => ['pro_verified','bmi_verified'].includes((s.verification_status || '').toLowerCase())).length;
    const avgCompleteness = songMetadata.length ? songMetadata.reduce((sum, s) => sum + (s.metadata_completeness_score || 0), 0) / songMetadata.length : 0;
    return [
      `${missingISWC} works missing ISWC`,
      `${verifiedCount}/${songMetadata.length} verified with PRO/BMI`,
      `Avg completeness ${(avgCompleteness * 100).toFixed(0)}%`
    ];
  };

  const mockPipelineData = {
    total: {
      annual_estimate: Math.round(catalog.total),
      confidence_level: confidenceLevel,
      breakdown: catalog.breakdown,
      missing_impact: Math.round(missingImpact),
      potential_upside: Math.round(potentialUpside)
    },
    performance: {
      annual_estimate: Math.round((catalog.breakdown as any).performance || 0),
      confidence_level: confidenceLevel,
      factors: computeFactors(),
      missing_impact: Math.round(catalog.total ? missingImpact * ((catalog.breakdown as any).performance || 0) / catalog.total : 0)
    },
    mechanical: {
      annual_estimate: Math.round((catalog.breakdown as any).mechanical || 0),
      confidence_level: confidenceLevel,
      factors: computeFactors(),
      missing_impact: Math.round(catalog.total ? missingImpact * ((catalog.breakdown as any).mechanical || 0) / catalog.total : 0)
    },
    sync: {
      annual_estimate: Math.round((catalog.breakdown as any).sync || 0),
      confidence_level: confidenceLevel,
      factors: computeFactors(),
      missing_impact: Math.round(catalog.total ? missingImpact * ((catalog.breakdown as any).sync || 0) / catalog.total : 0)
    }
  } as const;

  const songEstimates = useMemo(() => {
    const byId: Record<string, { estimate: number; confidence: 'high' | 'medium' | 'low' }> = {};
    for (const r of catalog.songResults) {
      byId[r.songId] = { estimate: Math.round(r.collectiblePipeline), confidence: r.confidence };
    }
    return songMetadata.map((s) => ({ id: s.id, ...(byId[s.id] || { estimate: 0, confidence: 'low' as const }) }));
  }, [catalog.songResults, songMetadata]);

  const handleRunPipelineAnalysis = async () => {
    // Deterministic mode: recalculates automatically from current data
    return;
  };

  // Persist total to search record (lightweight sync)
  useEffect(() => {
    const persist = async () => {
      const rounded = Math.round(catalog.total);
      if (!searchId) return;
      if (lastSavedTotalRef.current === rounded) return;
      await supabase
        .from('song_catalog_searches')
        .update({ pipeline_estimate_total: rounded, last_refreshed_at: new Date().toISOString() })
        .eq('id', searchId);
      lastSavedTotalRef.current = rounded;
    };
    persist();
  }, [catalog.total, searchId]);

  return (
    <div className="space-y-6">
      {/* Summary Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(mockPipelineData.total.annual_estimate)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Total Pipeline</div>
              </div>
              <DollarSign className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-500">
                  {formatCurrency(mockPipelineData.total.breakdown.performance)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Performance</div>
              </div>
              <Radio className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-500">
                  {formatCurrency(mockPipelineData.total.breakdown.mechanical)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Mechanical</div>
              </div>
              <Disc className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-500">
                  {formatCurrency(mockPipelineData.total.breakdown.sync)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Sync</div>
              </div>
              <Film className="h-8 w-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs value={selectedEstimateType} onValueChange={(value: any) => setSelectedEstimateType(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="total">Total Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="mechanical">Mechanical</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="total" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Pipeline Summary
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of estimated uncollected royalties across all revenue streams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Revenue Breakdown Chart */}
              <div className="space-y-4">
                <h4 className="font-semibold">Revenue Stream Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(mockPipelineData.total.breakdown).map(([type, amount]) => {
                    const percentage = (amount / mockPipelineData.total.annual_estimate) * 100;
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{type}</span>
                          <span>{formatCurrency(amount)} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Impact Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-destructive/10">
                  <h5 className="font-medium text-destructive mb-2">Missing Registrations Impact</h5>
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(mockPipelineData.total.missing_impact)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Annual revenue loss due to registration gaps
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-success/10">
                  <h5 className="font-medium text-success mb-2">Potential Upside</h5>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(mockPipelineData.total.potential_upside)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Additional revenue with optimization
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {['performance', 'mechanical', 'sync'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {type === 'performance' && <Radio className="h-5 w-5" />}
                  {type === 'mechanical' && <Disc className="h-5 w-5" />}
                  {type === 'sync' && <Film className="h-5 w-5" />}
                  {type} Royalties Pipeline
                </CardTitle>
                <CardDescription>
                  Detailed analysis of {type} royalty collection opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Estimate Details */}
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {formatCurrency(mockPipelineData[type].annual_estimate)}
                      </div>
                      <div className="text-sm text-muted-foreground">Annual Estimate</div>
                      <div className="mt-2">
                        {getConfidenceBadge(mockPipelineData[type].confidence_level)}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-warning/10">
                      <div className="text-xl font-bold text-warning">
                        {formatCurrency(mockPipelineData[type].missing_impact)}
                      </div>
                      <div className="text-sm text-muted-foreground">Lost to Registration Gaps</div>
                    </div>
                  </div>

                  {/* Factors Analysis */}
                  <div className="space-y-4">
                    <h5 className="font-semibold">Key Factors</h5>
                    <div className="space-y-2">
                      {mockPipelineData[type].factors?.map((factor, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 border rounded">
                          <AlertCircle className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Song-Level Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Song-Level Pipeline Breakdown</CardTitle>
          <CardDescription>
            Estimated pipeline contribution by individual songs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {songMetadata.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No song data available for pipeline analysis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {songMetadata.slice(0, 10).map((song, index) => {
                const songData = songEstimates.find(s => s.id === song.id) || { estimate: 0, confidence: 'low' };
                
                return (
                  <div key={song.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{song.song_title}</div>
                      <div className="text-sm text-muted-foreground">
                        Completeness: {Math.round(song.metadata_completeness_score * 100)}%
                        {song.registration_gaps?.length > 0 && (
                          <span className="ml-2 text-warning">
                            • {song.registration_gaps.length} registration gaps
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-semibold">{formatCurrency(songData.estimate)}</div>
                      <div className="text-sm">
                        {getConfidenceBadge(songData.confidence)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {songMetadata.length > 10 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... and {songMetadata.length - 10} more songs
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Analysis Actions</CardTitle>
          <CardDescription>
            Run enhanced AI analysis for more accurate pipeline estimates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleRunPipelineAnalysis}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <TrendingUp className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Run Enhanced Analysis
                </>
              )}
            </Button>
            
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Export Pipeline Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}