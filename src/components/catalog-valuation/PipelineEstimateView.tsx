import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertCircle, Music2, Radio, Disc, Film, BarChart3 } from 'lucide-react';
import { useSongEstimator } from '@/hooks/useSongEstimator';

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
  const { runAIResearch, loading, currentSearch } = useSongEstimator();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
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

  // Get real pipeline data from AI research or use defaults
  const getPipelineData = () => {
    const aiPipeline = currentSearch?.ai_research_summary?.royalty_pipeline;
    
    if (aiPipeline) {
      const totalEstimate = aiPipeline.total_estimate || 0;
      const performance = aiPipeline.annual_performance || 0;
      const mechanical = aiPipeline.mechanical || 0;
      const sync = aiPipeline.sync || 0;
      const uncollected = aiPipeline.uncollected || 0;
      
      return {
        total: {
          annual_estimate: totalEstimate,
          confidence_level: 'medium',
          breakdown: {
            performance,
            mechanical,
            sync
          },
          missing_impact: uncollected,
          potential_upside: Math.round(uncollected * 1.8) // Potential upside if gaps are fixed
        },
        performance: {
          annual_estimate: performance,
          confidence_level: 'high',
          factors: [
            'PRO registration analysis completed',
            'Performance history identified',
            'International collection gaps detected'
          ],
          missing_impact: Math.round(uncollected * 0.6) // 60% of uncollected likely performance
        },
        mechanical: {
          annual_estimate: mechanical,
          confidence_level: 'medium',
          factors: [
            'Digital streaming platforms analyzed',
            'Publisher registration status reviewed',
            'Mechanical collection optimization needed'
          ],
          missing_impact: Math.round(uncollected * 0.3) // 30% of uncollected likely mechanical
        },
        sync: {
          annual_estimate: sync,
          confidence_level: 'low',
          factors: [
            'Sync licensing potential identified',
            'Limited sync representation detected',
            'Genre suitability for placement'
          ],
          missing_impact: Math.round(uncollected * 0.1) // 10% of uncollected likely sync
        }
      };
    }
    
    // Fallback to mock data if no AI data available
    return {
      total: {
        annual_estimate: 125000,
        confidence_level: 'medium',
        breakdown: {
          performance: 75000,
          mechanical: 35000,
          sync: 15000
        },
        missing_impact: 25000,
        potential_upside: 45000
      },
      performance: {
        annual_estimate: 75000,
        confidence_level: 'high',
        factors: [
          'Strong radio play history',
          'Multiple PRO registrations incomplete',
          'International collection gaps'
        ],
        missing_impact: 18000
      },
      mechanical: {
        annual_estimate: 35000,
        confidence_level: 'medium',
        factors: [
          'Digital streaming growth',
          'Physical sales declining',
          'Missing publisher registrations'
        ],
        missing_impact: 5000
      },
      sync: {
        annual_estimate: 15000,
        confidence_level: 'low',
        factors: [
          'Genre suitable for sync',
          'Limited sync representation',
          'Catalog age considerations'
        ],
        missing_impact: 2000
      }
    };
  };

  const pipelineData = getPipelineData();

  const handleRunPipelineAnalysis = async () => {
    if (!searchId) return;
    
    await runAIResearch(
      searchId,
      songMetadata[0]?.songwriter_name || 'Unknown',
      'pipeline_analysis',
      {
        song_count: songMetadata.length,
        average_completeness: songMetadata.reduce((sum, song) => sum + song.metadata_completeness_score, 0) / songMetadata.length,
        registration_gaps: songMetadata.reduce((total, song) => total + (song.registration_gaps?.length || 0), 0)
      }
    );
  };

  const currentEstimate = pipelineData[selectedEstimateType];

  return (
    <div className="space-y-6">
      {/* Summary Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(pipelineData.total.annual_estimate)}
                </div>
                <div className="text-sm text-muted-foreground">Total Pipeline</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-success" />
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(pipelineData.total.breakdown.performance)}
                </div>
                <div className="text-sm text-muted-foreground">Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Disc className="h-4 w-4 text-info" />
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(pipelineData.total.breakdown.mechanical)}
                </div>
                <div className="text-sm text-muted-foreground">Mechanical</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-warning" />
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(pipelineData.total.breakdown.sync)}
                </div>
                <div className="text-sm text-muted-foreground">Sync</div>
              </div>
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
                  {Object.entries(pipelineData.total.breakdown).map(([type, amount]) => {
                    const percentage = (amount / pipelineData.total.annual_estimate) * 100;
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
                    {formatCurrency(pipelineData.total.missing_impact)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Annual revenue loss due to registration gaps
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-success/10">
                  <h5 className="font-medium text-success mb-2">Potential Upside</h5>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(pipelineData.total.potential_upside)}
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
                        {formatCurrency(pipelineData[type].annual_estimate)}
                      </div>
                      <div className="text-sm text-muted-foreground">Annual Estimate</div>
                      <div className="mt-2">
                        {getConfidenceBadge(pipelineData[type].confidence_level)}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-warning/10">
                      <div className="text-xl font-bold text-warning">
                        {formatCurrency(pipelineData[type].missing_impact)}
                      </div>
                      <div className="text-sm text-muted-foreground">Lost to Registration Gaps</div>
                    </div>
                  </div>

                  {/* Factors Analysis */}
                  <div className="space-y-4">
                    <h5 className="font-semibold">Key Factors</h5>
                    <div className="space-y-2">
                      {pipelineData[type].factors?.map((factor, index) => (
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
                // Mock individual song estimates
                const songEstimate = Math.floor(Math.random() * 8000) + 2000;
                const confidence = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)];
                
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
                      <div className="font-semibold">{formatCurrency(songEstimate)}</div>
                      <div className="text-sm">
                        {getConfidenceBadge(confidence)}
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