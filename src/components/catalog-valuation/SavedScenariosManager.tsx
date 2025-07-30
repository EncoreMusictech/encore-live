import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Save, Trash2, Eye, Star, Calendar, TrendingUp, Music } from 'lucide-react';
import { useSavedValuations, SavedValuationScenario } from '@/hooks/useSavedValuations';
import { useToast } from '@/hooks/use-toast';

interface SavedScenariosManagerProps {
  currentValuation?: any; // Current valuation result
  onLoadScenario?: (scenario: SavedValuationScenario) => void;
}

export const SavedScenariosManager: React.FC<SavedScenariosManagerProps> = ({
  currentValuation,
  onLoadScenario,
}) => {
  const { savedScenarios, loading, saveScenario, deleteScenario, toggleFavorite } = useSavedValuations();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({
    scenario_name: '',
    notes: '',
    tags: '',
  });

  const filteredScenarios = savedScenarios.filter(scenario =>
    scenario.scenario_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scenario.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const handleSaveScenario = async () => {
    if (!currentValuation) {
      toast({
        title: 'Error',
        description: 'No valuation data to save',
        variant: 'destructive',
      });
      return;
    }

    if (!saveForm.scenario_name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a scenario name',
        variant: 'destructive',
      });
      return;
    }

    const scenarioData: SavedValuationScenario = {
      scenario_name: saveForm.scenario_name,
      artist_name: currentValuation.artist_name,
      
      // Core valuation data
      valuation_amount: currentValuation.valuation_amount,
      risk_adjusted_value: currentValuation.risk_adjusted_value,
      dcf_valuation: currentValuation.dcf_valuation,
      multiple_valuation: currentValuation.multiple_valuation,
      confidence_score: currentValuation.confidence_score,
      
      // Artist metrics
      total_streams: currentValuation.total_streams,
      monthly_listeners: currentValuation.monthly_listeners,
      popularity_score: currentValuation.popularity_score || currentValuation.spotify_data?.popularity,
      
      // Financial metrics
      ltm_revenue: currentValuation.ltm_revenue,
      discount_rate: currentValuation.discount_rate,
      catalog_age_years: currentValuation.catalog_age_years,
      genre: currentValuation.genre,
      
      // Methodology and additional data
      valuation_methodology: currentValuation.valuation_methodology,
      has_additional_revenue: currentValuation.has_additional_revenue,
      total_additional_revenue: currentValuation.total_additional_revenue,
      revenue_diversification_score: currentValuation.revenue_diversification_score,
      
      // JSON data for complex objects
      top_tracks: currentValuation.top_tracks,
      forecasts: currentValuation.forecasts,
      comparable_artists: currentValuation.comparable_artists,
      cash_flow_projections: currentValuation.cash_flow_projections,
      industry_benchmarks: currentValuation.industry_benchmarks,
      
      // Metadata
      notes: saveForm.notes,
      tags: saveForm.tags ? saveForm.tags.split(',').map(tag => tag.trim()) : [],
    };

    const success = await saveScenario(scenarioData);
    if (success) {
      setShowSaveDialog(false);
      setSaveForm({ scenario_name: '', notes: '', tags: '' });
    }
  };

  const handleDeleteScenario = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the scenario "${name}"?`)) {
      await deleteScenario(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Current Valuation */}
      {currentValuation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save Current Valuation
            </CardTitle>
            <CardDescription>
              Save this valuation as a scenario for future reference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Valuation Scenario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scenario_name">Scenario Name *</Label>
                    <Input
                      id="scenario_name"
                      value={saveForm.scenario_name}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, scenario_name: e.target.value }))}
                      placeholder={`${currentValuation.artist_name} - ${new Date().toLocaleDateString()}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={saveForm.notes}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this valuation scenario..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (Optional)</Label>
                    <Input
                      id="tags"
                      value={saveForm.tags}
                      onChange={(e) => setSaveForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="hip-hop, emerging, high-growth (comma-separated)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveScenario} disabled={loading}>
                      Save Scenario
                    </Button>
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Saved Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Saved Valuation Scenarios
          </CardTitle>
          <CardDescription>
            Manage your saved catalog valuation scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scenarios by name or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Scenarios List */}
          <div className="space-y-4">
            {filteredScenarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved valuation scenarios found.</p>
                <p className="text-sm">Save your first scenario to get started.</p>
              </div>
            ) : (
              filteredScenarios.map((scenario) => (
                <Card key={scenario.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{scenario.scenario_name}</h3>
                          {scenario.is_favorite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Music className="h-4 w-4" />
                            {scenario.artist_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(scenario.created_at!)}
                          </span>
                          {scenario.genre && (
                            <Badge variant="secondary">{scenario.genre}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Risk-Adjusted Value</p>
                            <p className="font-semibold">
                              {formatCurrency(scenario.risk_adjusted_value || scenario.valuation_amount || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Confidence</p>
                            <p className="font-semibold">{scenario.confidence_score || 0}/100</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Streams</p>
                            <p className="font-semibold">
                              {scenario.total_streams?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Listeners</p>
                            <p className="font-semibold">
                              {scenario.monthly_listeners?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {scenario.notes && (
                          <p className="text-sm text-muted-foreground mb-3">{scenario.notes}</p>
                        )}

                        {scenario.tags && scenario.tags.length > 0 && (
                          <div className="flex gap-1 mb-3">
                            {scenario.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleFavorite(scenario.id!, !scenario.is_favorite)}
                        >
                          <Star className={`h-4 w-4 ${scenario.is_favorite ? 'text-yellow-500 fill-current' : ''}`} />
                        </Button>
                        {onLoadScenario && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLoadScenario(scenario)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteScenario(scenario.id!, scenario.scenario_name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};