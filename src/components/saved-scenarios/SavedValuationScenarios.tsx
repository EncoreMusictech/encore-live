import React, { useState } from "react";
import { useSavedScenarios } from "@/hooks/useSavedScenarios";
import { ScenariosDashboard } from "./ScenariosDashboard";
import { ScenarioDetailsModal } from "./ScenarioDetailsModal";
import { ScenarioComparisonView } from "./ScenarioComparisonView";
import { SavedScenario } from "@/hooks/useSavedScenarios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";

type ViewMode = 'dashboard' | 'details' | 'comparison';

export const SavedValuationScenarios = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedScenario, setSelectedScenario] = useState<SavedScenario | null>(null);
  const [selectedScenariosForComparison, setSelectedScenariosForComparison] = useState<SavedScenario[]>([]);
  
  const {
    scenarios,
    loading,
    deleteScenario,
    updateScenario,
    duplicateScenario,
  } = useSavedScenarios();

  const handleViewDetails = (scenario: SavedScenario) => {
    setSelectedScenario(scenario);
    setViewMode('details');
  };

  const handleCompareScenarios = (scenarios: SavedScenario[]) => {
    setSelectedScenariosForComparison(scenarios);
    setViewMode('comparison');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedScenario(null);
    setSelectedScenariosForComparison([]);
  };

  if (viewMode === 'details' && selectedScenario) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <ScenarioDetailsModal
          scenario={selectedScenario}
          onUpdate={updateScenario}
          onDelete={deleteScenario}
          onDuplicate={duplicateScenario}
          onClose={handleBackToDashboard}
        />
      </div>
    );
  }

  if (viewMode === 'comparison' && selectedScenariosForComparison.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>Comparing {selectedScenariosForComparison.length} scenarios</span>
          </div>
        </div>
        
        <ScenarioComparisonView
          scenarios={selectedScenariosForComparison}
          onClose={handleBackToDashboard}
        />
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="space-y-6">
      {scenarios.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No saved scenarios yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start by using the Catalog Valuation tool and save your analysis results to build your scenarios library.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard/catalog-valuation'}
              >
                Go to Catalog Valuation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScenariosDashboard
          scenarios={scenarios}
          loading={loading}
          onViewDetails={handleViewDetails}
          onCompareScenarios={handleCompareScenarios}
          onDelete={deleteScenario}
          onUpdate={updateScenario}
          onDuplicate={duplicateScenario}
        />
      )}
    </div>
  );
};