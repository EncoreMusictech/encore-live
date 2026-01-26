import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, Music, AlertTriangle, RefreshCw, Trash2, Shield, CheckCircle, Database, Presentation } from 'lucide-react';
import { useSongEstimator } from '@/hooks/useSongEstimator';
import { SongMetadataView } from './SongMetadataView';
import { PipelineEstimateView } from './PipelineEstimateView';

export function SongEstimatorTool() {
  const navigate = useNavigate();
  const [songwriterName, setSongwriterName] = useState('');
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  
  const {
    searches,
    currentSearch,
    songMetadata,
    loading,
    bmiVerificationLoading,
    careerSummary,
    careerSummaryLoading,
    error,
    createSearch,
    runAIResearch,
    fetchSongMetadata,
    fetchCareerSummary,
    refreshSearch,
    deleteSearch,
    runBulkBMIVerification,
    setCurrentSearch
  } = useSongEstimator();

  // Automatically fetch song metadata when currentSearch changes
  React.useEffect(() => {
    if (currentSearch) {
      fetchSongMetadata(currentSearch.id);
    }
  }, [currentSearch, fetchSongMetadata]);

  const handleCreateSearch = async () => {
    if (!songwriterName.trim()) return;
    
    const search = await createSearch(songwriterName.trim());
    if (search) {
      // Automatically start AI research
      await runAIResearch(search.id, search.songwriter_name, 'initial_search');
      setSongwriterName('');
    }
  };

  const handleSelectSearch = async (search: any) => {
    setCurrentSearch(search);
    setSelectedSearchId(search.id);
    await fetchSongMetadata(search.id);
  };

  const handleRefreshSearch = async (search: any) => {
    await refreshSearch(search.id, search.songwriter_name);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'processing': return 'bg-warning text-warning-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="border rounded-lg bg-card">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Music className="h-5 w-5 text-purple-500" />
                New Songwriter Research
              </h2>
              <p className="text-muted-foreground">
                Research songwriter catalogs, analyze metadata completeness, and estimate uncollected royalty pipeline income using AI-powered analysis.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="songwriter">Songwriter Name</Label>
                <Input
                  id="songwriter"
                  value={songwriterName}
                  onChange={(e) => setSongwriterName(e.target.value)}
                  placeholder="e.g., Max Martin, Diane Warren, Ryan Tedder"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateSearch()}
                />
              </div>
              <div className="flex items-end">
                  <Button 
                    onClick={handleCreateSearch}
                    disabled={!songwriterName.trim() || loading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting Research...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Start Research
                      </>
                    )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Searches List */}
      {searches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Searches</CardTitle>
            <CardDescription>
              Click on a search to view detailed results and pipeline estimates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searches.map((search) => (
                <div
                  key={search.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedSearchId === search.id ? 'bg-muted border-primary' : ''
                  }`}
                  onClick={() => handleSelectSearch(search)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-foreground">{search.songwriter_name}</h4>
                        <Badge className={getStatusColor(search.search_status)}>
                          {search.search_status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          {search.total_songs_found} songs found
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {search.ai_research_summary?.registration_gap_analysis?.total_gaps || 0} gaps detected
                        </span>
                        <span>
                          Created {new Date(search.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/catalog-audit?searchId=${search.id}`);
                        }}
                        disabled={search.search_status !== 'completed'}
                        className="text-primary hover:text-primary gap-1"
                        title="Generate Audit Presentation"
                      >
                        <Presentation className="h-3 w-3" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefreshSearch(search);
                        }}
                        disabled={loading}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSearch(search.id);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed View */}
      {currentSearch && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="catalog">Song Catalog</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Registration Analysis</CardTitle>
                <CardDescription>
                  MLC-first catalog discovery with PRO cross-verification to identify uncollected royalty opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="text-2xl font-bold text-primary">{currentSearch.total_songs_found}</div>
                    <div className="text-sm text-muted-foreground">Songs in Catalog</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="text-2xl font-bold text-warning">{currentSearch.total_songs_found - currentSearch.metadata_complete_count}</div>
                    <div className="text-sm text-muted-foreground">Incomplete Metadata</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                     <div className="text-2xl font-bold text-destructive">
                       {currentSearch.ai_research_summary?.registration_gap_analysis?.total_gaps || 0}
                     </div>
                    <div className="text-sm text-muted-foreground">Unregistered Works</div>
                  </div>
                </div>

                {/* Career Summary Card */}
                <Card className="bg-gradient-career border-primary/20 text-white">{/*Using career-specific gradient with dark navy colors*/}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Career Highlights
                      </CardTitle>
                      <Button
                        onClick={() => {
                          const additionalContext = currentSearch.ai_research_summary ? 
                            `Songs found: ${currentSearch.total_songs_found}, Registration gaps: ${currentSearch.ai_research_summary?.registration_gap_analysis?.total_gaps || 0}` : 
                            undefined;
                          fetchCareerSummary(currentSearch.songwriter_name, additionalContext);
                        }}
                        disabled={careerSummaryLoading}
                        variant="outline"
                        size="sm"
                      >
                        {careerSummaryLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2" />
                            Generate Summary
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      AI-powered career overview and industry insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {careerSummary && careerSummary.songwriterName === currentSearch.songwriter_name ? (
                      <div className="space-y-4">
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-line text-sm text-muted-foreground">
                            {careerSummary.careerSummary}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground border-t pt-2">
                          Generated on {new Date(careerSummary.generatedAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground text-sm">
                          Click "Generate Summary" to get AI-powered career insights for {currentSearch.songwriter_name}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* PRO Cross-Verification Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      PRO Registrations
                    </h4>
                    <Button
                      onClick={async () => {
                        // Run verification across all major PROs
                        await runBulkBMIVerification(currentSearch.id);
                        // TODO: Add ASCAP, SESAC, and other PRO verifications when available
                        await runAIResearch(currentSearch.id, currentSearch.songwriter_name, 'metadata_enhancement', {
                          verification_focus: 'all_pros',
                          pros_to_verify: ['ASCAP', 'BMI', 'SESAC', 'PRS', 'SOCAN', 'GEMA', 'SACEM']
                        });
                      }}
                      disabled={bmiVerificationLoading || !songMetadata.length}
                      variant="outline"
                      size="sm"
                    >
                      {bmiVerificationLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Re-verify All PROs
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* US PROs */}
                    <div>
                      <h5 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">US PROs</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 border rounded-lg bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">ASCAP</span>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                              {currentSearch.ai_research_summary?.pro_registration_counts?.ascap || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">BMI</span>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              {currentSearch.ai_research_summary?.pro_registration_counts?.bmi || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">SESAC</span>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                              {currentSearch.ai_research_summary?.pro_registration_counts?.sesac || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* International PROs */}
                    <div>
                      <h5 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">International PROs</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 border rounded-lg bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">PRS (UK)</span>
                            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                              {currentSearch.ai_research_summary?.pro_registration_counts?.prs || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">SOCAN (CA)</span>  
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                              {currentSearch.ai_research_summary?.pro_registration_counts?.socan || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">GEMA (DE)</span>
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              {currentSearch.ai_research_summary?.pro_registration_counts?.gema || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">SACEM (FR)</span>
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20">
                              {currentSearch.ai_research_summary?.pro_registration_counts?.sacem || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration Gap Analysis Summary */}
                {currentSearch.ai_research_summary?.registration_gap_analysis && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Registration Gap Analysis</h4>
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h5 className="font-medium mb-2">Common Registration Gaps</h5>
                      <div className="space-y-2">
                        {Object.entries(currentSearch.ai_research_summary.registration_gap_analysis.most_common_gaps || {}).map(([gap, count]) => (
                          <div key={gap} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground capitalize">{gap.replace(/_/g, ' ')}</span>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {currentSearch.ai_research_summary.registration_gap_analysis.recommendations && (
                      <div className="p-4 border rounded-lg bg-card">
                        <h5 className="font-medium mb-2">Recommendations</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {currentSearch.ai_research_summary.registration_gap_analysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog">
            <SongMetadataView 
              searchId={currentSearch.id}
              songMetadata={songMetadata}
            />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineEstimateView 
              searchId={currentSearch.id}
              songMetadata={songMetadata}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}