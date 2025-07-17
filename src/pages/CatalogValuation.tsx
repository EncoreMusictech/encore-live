import { useState } from "react";
import Header from "@/components/Header";
import CatalogValuation from "@/components/CatalogValuation";
import DemoLimitBanner from "@/components/DemoLimitBanner";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, ArrowRight, Brain, Target } from "lucide-react";

const CatalogValuationPage = () => {
  const [selectedModule, setSelectedModule] = useState<'selection' | 'valuation' | 'deals'>('selection');
  const { canAccess } = useDemoAccess();

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
              <CatalogValuation />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogValuationPage;