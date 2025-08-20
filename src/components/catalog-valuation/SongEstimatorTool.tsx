import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, Music, AlertTriangle, RefreshCw, Trash2, Shield, CheckCircle, Database } from 'lucide-react';
import { useSongEstimator } from '@/hooks/useSongEstimator';
import { SongMetadataView } from './SongMetadataView';
import { PipelineEstimateView } from './PipelineEstimateView';

export function SongEstimatorTool() {
  const [songwriterName, setSongwriterName] = useState('');
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  
  const {
    searches,
    currentSearch,
    songMetadata,
    loading,
    bmiVerificationLoading,
    error,
    createSearch,
    runAIResearch,
    fetchSongMetadata,
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
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          MLC-first discovery
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
                <CardTitle>{currentSearch.songwriter_name} - Registration Gap Analysis</CardTitle>
                <CardDescription>
                  MLC-first catalog discovery with PRO cross-verification to identify uncollected royalty opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="text-2xl font-bold text-primary">{currentSearch.total_songs_found}</div>
                    <div className="text-sm text-muted-foreground">Works in MLC</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="text-2xl font-bold text-success">{currentSearch.metadata_complete_count}</div>
                    <div className="text-sm text-muted-foreground">Complete Metadata</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="text-2xl font-bold text-warning">
                      {currentSearch.ai_research_summary?.registration_gap_analysis?.total_gaps || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Registration Gaps</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-card">
                    <div className={`text-2xl font-bold ${
                      currentSearch?.search_status === 'completed' ? 'text-success' :
                      currentSearch?.search_status === 'error' ? 'text-destructive' :
                      currentSearch?.search_status === 'processing' ? 'text-warning' :
                      'text-muted-foreground'
                    }`}>
                      {currentSearch?.search_status === 'completed' ? '✓' :
                       currentSearch?.search_status === 'error' ? '✗' :
                       currentSearch?.search_status === 'processing' ? '⏳' : '⏸'}
                    </div>
                    <div className="text-sm text-muted-foreground">Search Status</div>
                  </div>
                </div>

                {/* PRO Cross-Verification Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      PRO Cross-Verification Status
                    </h4>
                    <Button
                      onClick={() => runBulkBMIVerification(currentSearch.id)}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">MLC Verified</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          {currentSearch.ai_research_summary?.processing_summary?.mlc_verified || 0}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">BMI Cross-Verified</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {currentSearch.ai_research_summary?.processing_summary?.bmi_cross_verified || 0}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Registration Gaps</span>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          {currentSearch.ai_research_summary?.registration_gap_analysis?.total_gaps || 0}
                        </Badge>
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