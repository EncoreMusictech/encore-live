import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updatePageMetadata } from "@/utils/seo";
import { supabase } from "@/integrations/supabase/client";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useSubscription } from "@/hooks/useSubscription";
import Header from "@/components/Header";
import { TrackSelectorWithSuspense, DealSimulatorWithSuspense } from "@/components/LazyComponents";
import DealScenarios from "@/components/DealScenarios";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Calculator, Music, BarChart3, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTour } from "@/hooks/useTour";
import { useSearchParams } from "react-router-dom";

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

const DealSimulatorPage = () => {
  const { canAccess, incrementUsage, showUpgradeModalForModule } = useDemoAccess();
  const { subscribed } = useSubscription();
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Only show demo navigation for non-subscribers
  const showDemoNavigation = !subscribed;

  useEffect(() => {
    updatePageMetadata('dealSimulator');
  }, []);
  const { startTour } = useTour();
  const [searchParams] = useSearchParams();
  const [discographyData, setDiscographyData] = useState<{
    albums: Album[];
    singles: Album[];
  } | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [selectedTrackData, setSelectedTrackData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("search");
  const { toast } = useToast();

  const steps = [
    { target: "[data-tour='deal-artist-input']", content: "Search for an artist to load their catalog." },
    { target: "[data-tour='deal-search-btn']", content: "Start the search and load discography." },
    { target: "[data-tour='deal-tabs']", content: "Workflow steps: Search → Select Assets → Deal Terms → Saved Scenarios." },
  ];

  useEffect(() => {
    if (searchParams.get('tour') === '1') startTour(steps);
  }, [searchParams, startTour]);

  const handleArtistSearch = async () => {
    if (!artistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an artist name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, search for the artist to get their ID
      const { data: artistData, error: artistError } = await supabase.functions.invoke('spotify-catalog-valuation', {
        body: { artistName: artistName.trim() }
      });

      if (artistError || artistData.error) {
        throw new Error(artistError?.message || artistData.error || 'Failed to find artist');
      }

      const artist = {
        id: artistData.spotify_data.artist_id,
        name: artistData.artist_name
      };

      setCurrentArtist(artist);

      // Fetch discography
      const { data: discographyData, error: discographyError } = await supabase.functions.invoke('artist-discography', {
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

      setActiveTab("selection");

      toast({
        title: "Success",
        description: `Loaded discography for ${artist.name} - ${discographyData.albums?.length || 0} albums, ${discographyData.singles?.length || 0} singles`,
      });

    } catch (error) {
      console.error("Artist search error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search artist",
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    // Check demo access before saving
    if (!canAccess('dealSimulator')) {
      showUpgradeModalForModule('dealSimulator');
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save scenarios",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('deal_scenarios')
        .insert({
          user_id: user.user.id,
          artist_id: currentArtist.id,
          ...scenario
        });

      if (error) {
        throw error;
      }

      // Increment demo usage after successful save
      incrementUsage('dealSimulator');

      toast({
        title: "Success",
        description: "Deal scenario saved successfully",
      });

      setActiveTab("scenarios");

    } catch (error) {
      console.error("Save scenario error:", error);
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Navigation - Only show for non-subscribers */}
          {showDemoNavigation && (
            <div className="flex items-center gap-2 mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link to="/demo-modules">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Demo Modules
                </Link>
              </Button>
            </div>
          )}
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Deal Simulator
            </h1>
            <p className="text-muted-foreground">
              Analyze catalog acquisitions and licensing deals with detailed financial projections
            </p>
            <div className="mt-2"><Button variant="outline" size="sm" onClick={() => startTour(steps)}>Start Tour</Button></div>
          </div>

          <DemoLimitBanner module="dealSimulator" className="mb-6" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w/full grid-cols-4" data-tour="deal-tabs">
              <TabsTrigger value="search">
                <Search className="w-4 h-4 mr-2" />
                Search Artist
              </TabsTrigger>
              <TabsTrigger value="selection" disabled={!discographyData}>
                <Music className="w-4 h-4 mr-2" />
                Select Assets
                {selectedTracks.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTracks.length}
                  </Badge>
                )}
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

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-music-purple" />
                    Artist Search
                  </CardTitle>
                  <CardDescription>
                    Search for an artist to analyze their catalog for potential deals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter artist name..."
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleArtistSearch()}
                      disabled={loading}
                      data-tour="deal-artist-input"
                    />
                    <Button onClick={handleArtistSearch} disabled={loading || !artistName.trim()} data-tour="deal-search-btn">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {loading ? "Searching..." : "Search"}
                    </Button>
                  </div>

                  {currentArtist && (
                    <div className="p-4 border rounded-lg bg-secondary/30">
                      <p className="font-medium">Current Artist: {currentArtist.name}</p>
                      {discographyData && (
                        <p className="text-sm text-muted-foreground">
                          {discographyData.albums.length} albums, {discographyData.singles.length} singles available
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="selection">
              {discographyData && currentArtist && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5 text-music-purple" />
                      Select Catalog Assets - {currentArtist.name}
                    </CardTitle>
                    <CardDescription>
                      Choose the singles and albums you want to include in your deal analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TrackSelectorWithSuspense
                      albums={discographyData.albums}
                      singles={discographyData.singles}
                      selectedItems={selectedTracks}
                      onSelectionChange={handleSelectionChange}
                      onEstimateStreams={estimateStreams}
                    />
                    
                    {selectedTracks.length > 0 && (
                      <div className="mt-6 p-4 border rounded-lg bg-secondary/30">
                        <p className="font-medium mb-2">Selected for Analysis:</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
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
                        <Button 
                          className="mt-4" 
                          onClick={() => setActiveTab("simulation")}
                        >
                          Proceed to Deal Simulation
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="simulation">
              {selectedTracks.length > 0 && currentArtist && (
                <DealSimulatorWithSuspense
                  selectedTracks={selectedTrackData}
                  artistName={currentArtist.name}
                  onSaveScenario={handleSaveScenario}
                />
              )}
            </TabsContent>

            <TabsContent value="scenarios">
              <DealScenarios />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DealSimulatorPage;