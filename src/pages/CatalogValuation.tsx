import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { updatePageMetadata } from "@/utils/seo";
import { CatalogValuationWithSuspense } from "@/components/LazyComponents";
import { SongEstimatorTool } from "@/components/catalog-valuation/SongEstimatorTool";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, ArrowRight, Brain, Target, ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";

const CatalogValuationPage = () => {
  const [selectedModule, setSelectedModule] = useState<'selection' | 'valuation' | 'deals' | 'song-estimator'>('selection');
  const { canAccess } = useDemoAccess();
  const { subscribed } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAllowedSongEstimator = (user?.email?.toLowerCase() === 'info@encoremusic.tech');

  // Only show demo navigation for non-subscribers
  const showDemoNavigation = !subscribed;

  useEffect(() => {
    updatePageMetadata('catalogValuation');
  }, []);

  const renderModuleSelection = () => (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">
          Music IP Analytics Suite
        </h1>
        <p className="text-muted-foreground">
          Professional tools for catalog valuation and deal analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Catalog Valuation Module */}
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer group">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Catalog Valuation</CardTitle>
                <CardDescription>AI-powered music IP valuation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Get professional-grade valuations using advanced DCF modeling, risk assessment, and industry benchmarks.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-green-600" />
                Real-time streaming data analysis
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-green-600" />
                DCF modeling with risk adjustment
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-green-600" />
                Industry comparable analysis
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-green-600" />
                Comprehensive reporting suite
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-primary text-primary-foreground group-hover:shadow-lg transition-shadow"
              onClick={() => setSelectedModule('valuation')}
              disabled={!canAccess('catalogValuation')}
            >
              {canAccess('catalogValuation') ? 'Launch Catalog Valuation' : 'Demo Limit Reached'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Deal Analysis Module */}
        <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-colors cursor-pointer group">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <Calculator className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Deal Analysis</CardTitle>
                <CardDescription>Advanced deal simulation & modeling</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Model complex acquisition scenarios with track-level selection and custom deal structures.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-blue-600" />
                Track-by-track asset selection
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-blue-600" />
                Custom deal term modeling
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-blue-600" />
                ROI & payback analysis
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-blue-600" />
                Scenario comparison tools
              </div>
            </div>

            <Button 
              variant="secondary"
              className="w-full group-hover:shadow-lg transition-shadow"
              onClick={() => window.location.href = '/deal-simulator'}
            >
              Launch Deal Simulator
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Song Estimator Module */}
        <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors cursor-pointer group">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Search className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Song Estimator</CardTitle>
                <CardDescription>AI-powered songwriter catalog research</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Research songwriter catalogs, analyze metadata completeness, and estimate uncollected royalty pipeline income.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                AI-powered catalog research
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                Metadata completeness analysis
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                Pipeline income estimation
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                Registration gap identification
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full group-hover:shadow-lg transition-shadow border-accent text-foreground hover:bg-accent/10"
              onClick={() => {
                if (!isAllowedSongEstimator) {
                  toast({ title: 'Access restricted', description: 'Song Estimator is currently limited to a single test user.', variant: 'destructive' });
                  return;
                }
                setSelectedModule('song-estimator');
              }}
              disabled={!canAccess('catalogValuation')}
            >
              {canAccess('catalogValuation') ? 'Launch Song Estimator' : 'Demo Limit Reached'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Section */}
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground mb-4">
          Not sure which tool to use? Start with catalog valuation to get baseline metrics.
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedModule('valuation')}
          >
            Quick Valuation
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (!isAllowedSongEstimator) {
                toast({ title: 'Access restricted', description: 'Song Estimator is currently limited to a single test user.', variant: 'destructive' });
                return;
              }
              setSelectedModule('song-estimator');
            }}
          >
            Song Research
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/deal-simulator'}
          >
            Browse Deals
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Back to Demo Modules - Only show for non-subscribers */}
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
        
        <div className="max-w-6xl mx-auto">
          {selectedModule === 'selection' && renderModuleSelection()}
          
          {selectedModule === 'valuation' && (
            <>
              {/* Back Navigation */}
              <div className="flex items-center gap-2 mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedModule('selection')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Module Selection
                </Button>
              </div>

              {/* Demo Limit Banner */}
              <DemoLimitBanner module="catalogValuation" className="mb-6" />

              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Catalog Valuation
                </h1>
                <p className="text-muted-foreground">
                  Discover the estimated value of any artist's music catalog using real streaming data from Spotify.
                </p>
              </div>
              <CatalogValuationWithSuspense />
            </>
          )}

          {selectedModule === 'song-estimator' && (
            <>
              {/* Back Navigation */}
              <div className="flex items-center gap-2 mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedModule('selection')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Module Selection
                </Button>
              </div>

              {/* Demo Limit Banner */}
              <DemoLimitBanner module="catalogValuation" className="mb-6" />

              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Song Estimator Tool
                </h1>
                <p className="text-muted-foreground">
                  Research songwriter catalogs, analyze metadata completeness, and estimate uncollected royalty pipeline income using AI-powered analysis.
                </p>
              </div>
              {isAllowedSongEstimator ? (
                <SongEstimatorTool />
              ) : (
                <Card className="border-destructive/30">
                  <CardHeader>
                    <CardTitle>Access Restricted</CardTitle>
                    <CardDescription>Song Estimator is currently limited to a single test user.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">If you believe this is a mistake, please contact support.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogValuationPage;