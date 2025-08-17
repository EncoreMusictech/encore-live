import { useState, useEffect } from "react";
import { updatePageMetadata } from "@/utils/seo";
import { CatalogValuationWithSuspense } from "@/components/LazyComponents";
import { SongEstimatorTool } from "@/components/catalog-valuation/SongEstimatorTool";
import DealSimulator from "@/components/DealSimulator";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Calculator, Search, ArrowRight } from "lucide-react";

export default function CRMCatalogValuationPage() {
  const [activeTab, setActiveTab] = useState('catalog-valuation');
  const { canAccess } = useDemoAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAllowedSongEstimator = (user?.email?.toLowerCase() === 'info@encoremusic.tech');

  useEffect(() => {
    updatePageMetadata('catalog-valuation');
  }, []);

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
  };

  return (
    <div className="space-y-6">
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
          <TabsTrigger 
            value="song-estimator" 
            className="flex items-center gap-2"
            disabled={!isAllowedSongEstimator}
          >
            <Search className="h-4 w-4" />
            Song Estimator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog-valuation" className="space-y-6">
          <DemoLimitBanner module="catalogValuation" />
          
          <Card>
            <CardContent>
              <CatalogValuationWithSuspense />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deal-analysis" className="space-y-6">
          <DemoLimitBanner module="dealSimulator" />
          
          <Card>
            <CardContent>
              <DealSimulator 
                selectedTracks={[]}
                artistName=""
                onSaveScenario={(scenario) => {
                  toast({ 
                    title: 'Scenario saved', 
                    description: 'Your deal scenario has been saved successfully.' 
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="song-estimator" className="space-y-6">
          <DemoLimitBanner module="catalogValuation" />
          
          <Card>
            <CardContent>
              {isAllowedSongEstimator ? (
                <SongEstimatorTool />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Song Estimator is currently limited to a single test user.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}