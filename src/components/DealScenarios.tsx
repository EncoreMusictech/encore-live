import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Folder, Trash2, Eye, Calendar, DollarSign, TrendingUp } from "lucide-react";

interface DealScenario {
  id: string;
  scenario_name: string;
  artist_name: string;
  artist_id: string;
  selected_tracks: any;
  deal_terms: any;
  projections: any;
  created_at: string;
  updated_at: string;
}

const DealScenarios = () => {
  const [scenarios, setScenarios] = useState<DealScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<DealScenario | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('deal_scenarios')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      setScenarios((data || []).map(item => ({
        ...item,
        selected_tracks: Array.isArray(item.selected_tracks) ? item.selected_tracks : [],
        deal_terms: item.deal_terms || {},
        projections: Array.isArray(item.projections) ? item.projections : []
      })));
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast({
        title: "Error",
        description: "Failed to load scenarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteScenario = async (scenarioId: string) => {
    try {
      const { error } = await supabase
        .from('deal_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) {
        throw error;
      }

      setScenarios(scenarios.filter(s => s.id !== scenarioId));
      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast({
        title: "Error",
        description: "Failed to delete scenario",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getScenarioSummary = (scenario: DealScenario) => {
    const totalRevenue = scenario.projections.reduce((sum: number, p: any) => sum + p.acquirerEarnings, 0);
    const finalROI = scenario.projections.length > 0 ? scenario.projections[scenario.projections.length - 1].roi : 0;
    const albumCount = scenario.selected_tracks.filter((t: any) => t.isAlbum).length;
    const singleCount = scenario.selected_tracks.filter((t: any) => !t.isAlbum).length;

    return { totalRevenue, finalROI, albumCount, singleCount };
  };

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.scenario_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading scenarios...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-music-purple" />
            Saved Deal Scenarios
          </CardTitle>
          <CardDescription>
            Manage your saved catalog acquisition and licensing deal analyses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search scenarios by name or artist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {filteredScenarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {scenarios.length === 0 
                ? "No saved scenarios yet. Create your first deal analysis!"
                : "No scenarios match your search."
              }
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredScenarios.map((scenario) => {
                const summary = getScenarioSummary(scenario);
                return (
                  <Card key={scenario.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{scenario.scenario_name}</h3>
                            <p className="text-muted-foreground">{scenario.artist_name}</p>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(scenario.updated_at)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Assets: </span>
                              <span className="font-medium">
                                {summary.albumCount} albums, {summary.singleCount} singles
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Deal: </span>
                              <span className="font-medium capitalize">
                                {scenario.deal_terms.dealType}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-music-purple" />
                              <span className="font-semibold text-music-purple">
                                {formatCurrency(summary.totalRevenue)}
                              </span>
                              <span className="text-sm text-muted-foreground">projected revenue</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                {summary.finalROI.toFixed(1)}%
                              </span>
                              <span className="text-sm text-muted-foreground">ROI</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {scenario.deal_terms.termLength} year term
                            </Badge>
                            <Badge variant="secondary">
                              {formatCurrency(scenario.deal_terms.advance)} advance
                            </Badge>
                            {scenario.deal_terms.dealType !== 'acquisition' && (
                              <Badge variant="outline">
                                {scenario.deal_terms.royaltyRate}% share
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedScenario(scenario)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{scenario.scenario_name}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteScenario(scenario.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scenario Detail Modal */}
      {selectedScenario && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedScenario.scenario_name}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedScenario(null)}>
                Close
              </Button>
            </div>
            <CardDescription>
              {selectedScenario.artist_name} • {formatDate(selectedScenario.updated_at)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Selected Assets</h4>
              <div className="grid gap-2">
                {selectedScenario.selected_tracks.map((track: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{track.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {track.isAlbum ? 'Album' : 'Single'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {track.total_tracks} track{track.total_tracks !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Deal Terms</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Deal Type: </span>
                  <span className="font-medium capitalize">{selectedScenario.deal_terms.dealType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Advance: </span>
                  <span className="font-medium">{formatCurrency(selectedScenario.deal_terms.advance)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Term: </span>
                  <span className="font-medium">{selectedScenario.deal_terms.termLength} years</span>
                </div>
                {selectedScenario.deal_terms.dealType !== 'acquisition' && (
                  <div>
                    <span className="text-muted-foreground">Your Share: </span>
                    <span className="font-medium">{selectedScenario.deal_terms.royaltyRate}%</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Projected Performance</h4>
              <div className="space-y-2">
                {selectedScenario.projections.map((projection: any) => (
                  <div key={projection.year} className="grid grid-cols-5 gap-4 p-3 border rounded text-sm">
                    <div>
                      <span className="font-medium">Year {projection.year}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Revenue: </span>
                      <span className="font-medium">{formatCurrency(projection.acquirerEarnings)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ROI: </span>
                      <span className={`font-medium ${projection.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projection.roi.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recoupment: </span>
                      <span className="font-medium">{formatCurrency(projection.recoupmentBalance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DealScenarios;