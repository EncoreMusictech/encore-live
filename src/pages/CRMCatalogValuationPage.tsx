import { useState, useEffect } from "react";
import { updatePageMetadata } from "@/utils/seo";
import { supabase } from "@/integrations/supabase/client";
import { CatalogValuationWithSuspense, TrackSelectorWithSuspense, DealSimulatorWithSuspense } from "@/components/LazyComponents";
import { SongEstimatorTool } from "@/components/catalog-valuation/SongEstimatorTool";
import DealScenarios from "@/components/DealScenarios";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Brain, Calculator, Search, Music, BarChart3, Loader2, AlertTriangle } from "lucide-react";
interface Artist {
  id: string;
  name: string;
}
interface Album {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  popularity?: number;
  external_urls: {
    spotify: string;
  };
  tracks?: {
    items: any[];
  };
}
export default function CRMCatalogValuationPage() {
  const [activeTab, setActiveTab] = useState('catalog-valuation');
  const [dealSubTab, setDealSubTab] = useState('search');
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [discographyData, setDiscographyData] = useState<{
    albums: Album[];
    singles: Album[];
  } | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [selectedTrackData, setSelectedTrackData] = useState<any[]>([]);
  const {
    canAccess,
    incrementUsage,
    showUpgradeModalForModule
  } = useDemoAccess();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech'];
  const isAllowedSongEstimator = adminEmails.includes(user?.email?.toLowerCase() || '');
  useEffect(() => {
    updatePageMetadata('catalog-valuation');
  }, []);
  const handleArtistSearch = async () => {
    if (!artistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an artist name",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        data: artistData,
        error: artistError
      } = await supabase.functions.invoke('spotify-catalog-valuation', {
        body: {
          artistName: artistName.trim()
        }
      });
      if (artistError || artistData.error) {
        throw new Error(artistError?.message || artistData.error || 'Failed to find artist');
      }
      const artist = {
        id: artistData.spotify_data.artist_id,
        name: artistData.artist_name
      };
      setCurrentArtist(artist);
      const {
        data: discographyData,
        error: discographyError
      } = await supabase.functions.invoke('artist-discography', {
        body: {
          artistId: artist.id,
          artistName: artist.name
        }
      });
      if (discographyError || discographyData.error) {
        throw new Error(discographyError?.message || discographyData.error || 'Failed to fetch discography');
      }
      setDiscographyData({
        albums: discographyData.albums || [],
        singles: discographyData.singles || []
      });
      setDealSubTab("selection");
      toast({
        title: "Success",
        description: `Loaded discography for ${artist.name} - ${discographyData.albums?.length || 0} albums, ${discographyData.singles?.length || 0} singles`
      });
    } catch (error) {
      console.error("Artist search error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search artist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSelectionChange = (selectedIds: string[], selectedData: any[]) => {
    setSelectedTracks(selectedIds);
    setSelectedTrackData(selectedData);
  };
  const estimateStreams = (item: Album, isAlbum?: boolean) => {
    if (isAlbum) {
      const avgPopularity = item.popularity || 50;
      const estimatedStreamsPerTrack = avgPopularity * 100000;
      return estimatedStreamsPerTrack * item.total_tracks;
    } else {
      const popularity = item.popularity || 50;
      return popularity * 200000;
    }
  };
  const handleSaveScenario = async (scenario: any) => {
    if (!currentArtist) {
      toast({
        title: "Error",
        description: "No artist selected",
        variant: "destructive"
      });
      return;
    }
    if (!canAccess('dealSimulator')) {
      showUpgradeModalForModule('dealSimulator');
      return;
    }
    try {
      const {
        data: user
      } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save scenarios",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from('deal_scenarios').insert({
        user_id: user.user.id,
        artist_id: currentArtist.id,
        ...scenario
      });
      if (error) {
        throw error;
      }
      incrementUsage('dealSimulator');
      toast({
        title: "Success",
        description: "Deal scenario saved successfully"
      });
      setDealSubTab("scenarios");
    } catch (error) {
      console.error("Save scenario error:", error);
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "destructive"
      });
    }
  };
  const handleTabChange = (value: string) => {
    if (value === 'song-estimator' && !isAllowedSongEstimator) {
      toast({
        title: 'Access restricted',
        description: 'Song Estimator is currently limited to a single test user.',
        variant: 'destructive'
      });
      return;
    }
    setActiveTab(value);
    // Reset deal sub-tab when switching to deal analysis
    if (value === 'deal-analysis') {
      setDealSubTab('search');
    }
  };
  return <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Music IP Analytics Suite</h1>
        <p className="text-muted-foreground">
          Professional tools for catalog valuation and deal analysis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog-valuation" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Catalog Valuation
          </TabsTrigger>
          <TabsTrigger value="deal-analysis" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Deal Analysis
          </TabsTrigger>
          <TabsTrigger value="song-estimator" className="flex items-center gap-2" disabled={!isAllowedSongEstimator}>
            <Music className="h-4 w-4" />
            Song Estimator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog-valuation" className="space-y-6">
          <DemoLimitBanner module="catalogValuation" />
          
          
          
          <CatalogValuationWithSuspense />
        </TabsContent>

        <TabsContent value="deal-analysis" className="space-y-6">
          <DemoLimitBanner module="dealSimulator" />
          
          <Card>
            <CardContent className="p-0">
              <Tabs value={dealSubTab} onValueChange={setDealSubTab} className="space-y-6">
                <div className="p-6 pb-0">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="search">
                      <Search className="w-4 h-4 mr-2" />
                      Search Artist
                    </TabsTrigger>
                    <TabsTrigger value="selection" disabled={!discographyData}>
                      <Music className="w-4 h-4 mr-2" />
                      Select Assets
                      {selectedTracks.length > 0 && <Badge variant="secondary" className="ml-2">
                          {selectedTracks.length}
                        </Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="simulation" disabled={selectedTracks.length === 0}>
                      <Calculator className="w-4 h-4 mr-2" />
                      Deal Terms
                    </TabsTrigger>
                    <TabsTrigger value="scenarios">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Saved Scenarios
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="search" className="mt-0">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Search className="h-4 w-4 text-purple-500" />
                          Artist Search
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Search for an artist to analyze their catalog for potential deals
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input placeholder="Enter artist name..." value={artistName} onChange={e => setArtistName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleArtistSearch()} disabled={loading} />
                        <Button onClick={handleArtistSearch} disabled={loading || !artistName.trim()}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          {loading ? "Searching..." : "Search"}
                        </Button>
                      </div>

                      {currentArtist && <div className="p-4 border rounded-lg bg-secondary/30">
                          <p className="font-medium">Current Artist: {currentArtist.name}</p>
                          {discographyData && <p className="text-sm text-muted-foreground">
                              {discographyData.albums.length} albums, {discographyData.singles.length} singles available
                            </p>}
                        </div>}
                    </div>
                  </TabsContent>

                  <TabsContent value="selection" className="mt-0">
                    {discographyData && currentArtist && <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Select Catalog Assets - {currentArtist.name}</h3>
                          <p className="text-muted-foreground text-sm mb-4">
                            Choose the singles and albums you want to include in your deal analysis
                          </p>
                        </div>
                        
                        <TrackSelectorWithSuspense albums={discographyData.albums} singles={discographyData.singles} selectedItems={selectedTracks} onSelectionChange={handleSelectionChange} onEstimateStreams={estimateStreams} />
                        
                        {selectedTracks.length > 0 && <div className="p-4 border rounded-lg bg-secondary/30">
                            <p className="font-medium mb-2">Selected for Analysis:</p>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-muted-foreground">Albums: </span>
                                <span className="font-medium">
                                  {selectedTrackData.filter(item => item.isAlbum).length}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Singles: </span>
                                <span className="font-medium">
                                  {selectedTrackData.filter(item => !item.isAlbum).length}
                                </span>
                              </div>
                            </div>
                            <Button onClick={() => setDealSubTab("simulation")}>
                              Proceed to Deal Simulation
                            </Button>
                          </div>}
                      </div>}
                  </TabsContent>

                  <TabsContent value="simulation" className="mt-0">
                    {selectedTracks.length > 0 && currentArtist && <DealSimulatorWithSuspense selectedTracks={selectedTrackData} artistName={currentArtist.name} onSaveScenario={handleSaveScenario} />}
                  </TabsContent>

                  <TabsContent value="scenarios" className="mt-0">
                    <DealScenarios />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="song-estimator" className="space-y-6">
          <DemoLimitBanner module="catalogValuation" />
          
          {isAllowedSongEstimator ? <SongEstimatorTool /> : <div className="text-center py-8">
              <p className="text-muted-foreground">
                Song Estimator is currently limited to a single test user.
              </p>
            </div>}
        </TabsContent>
      </Tabs>
    </div>;
}