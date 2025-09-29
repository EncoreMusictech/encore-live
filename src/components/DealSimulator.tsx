import React, { useState, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, DollarSign, Users, Database } from "lucide-react";
import { useCatalogCalculations } from "@/hooks/usePerformanceOptimization";
import { useRightsBasedCalculations } from "@/hooks/useRightsBasedCalculations";
import { useHistoricalStatements } from "@/hooks/useHistoricalStatements";
import { DealSimulatorSkeleton, AsyncLoading } from "@/components/LoadingStates";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface DealTerms {
  advance: number;
  royaltyRate: number;
  termLength: number;
  dealType: 'acquisition' | 'licensing' | 'co-publishing';
  rightsType: 'master' | 'publishing' | 'both';
  recoupmentRate: number;
  minimumGuarantee: number;
  ownershipPercentage: number;
}

interface DealProjection {
  year: number;
  grossRevenue: number;
  netRevenue: number;
  artistEarnings: number;
  acquirerEarnings: number;
  recoupmentBalance: number;
  roi: number;
}

interface DealSimulatorProps {
  selectedTracks: any[];
  artistName: string;
  onSaveScenario: (scenario: any) => void;
}

const DealSimulator = memo(({ selectedTracks, artistName, onSaveScenario }: DealSimulatorProps) => {
  const [dealTerms, setDealTerms] = useState<DealTerms>({
    advance: 100000,
    royaltyRate: 50,
    termLength: 5,
    dealType: 'acquisition',
    rightsType: 'both',
    recoupmentRate: 75,
    minimumGuarantee: 50000,
    ownershipPercentage: 100
  });

  const [scenarioName, setScenarioName] = useState("");
  const [projections, setProjections] = useState<DealProjection[]>([]);
  
  // Fetch historical statements for this artist
  const { statements, calculateMetrics } = useHistoricalStatements(artistName);
  const metrics = calculateMetrics();
  
  // Use rights-based calculations hook
  const rightsCalculation = useRightsBasedCalculations(selectedTracks, dealTerms, artistName);
  
  // Use optimized calculations hook with historical data
  const calculatedData = useCatalogCalculations(selectedTracks, dealTerms, dealTerms.termLength, statements);

  // Calculate base streams from selected tracks (memoized)
  const calculateBaseStreams = useCallback(() => {
    return selectedTracks.reduce((total, track) => {
      if (track.isAlbum) {
        // For albums, estimate based on popularity and track count
        const avgPopularity = track.popularity || 50;
        const estimatedStreamsPerTrack = avgPopularity * 100000;
        return total + (estimatedStreamsPerTrack * track.total_tracks);
      } else {
        // For singles, estimate based on popularity
        const popularity = track.popularity || 50;
        return total + (popularity * 200000); // Singles typically get more streams per track
      }
    }, 0);
  }, [selectedTracks]);

  const calculateProjections = useCallback(() => {
    // Use rights-based calculations as primary source
    if (rightsCalculation?.projections && rightsCalculation.projections.length > 0) {
      setProjections(rightsCalculation.projections);
    } else if (calculatedData?.projections) {
      setProjections(calculatedData.projections);
    }
  }, [rightsCalculation, calculatedData]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) {
      alert('Please enter a scenario name');
      return;
    }

    const scenario = {
      scenario_name: scenarioName,
      artist_name: artistName,
      selected_tracks: selectedTracks,
      deal_terms: dealTerms,
      projections: projections
    };

    onSaveScenario(scenario);
    setScenarioName("");
  }, [scenarioName, artistName, selectedTracks, dealTerms, projections, onSaveScenario]);

  // Use rights-based calculations or fallback to optimized calculations
  const totalProjectedRevenue = rightsCalculation?.totalProjectedRevenue || calculatedData?.totalProjectedRevenue || projections.reduce((sum, p) => sum + p.acquirerEarnings, 0);
  const finalROI = rightsCalculation?.finalROI || calculatedData?.finalROI || (projections.length > 0 ? projections[projections.length - 1].roi : 0);
  const paybackPeriod = rightsCalculation?.paybackPeriod || calculatedData?.paybackPeriod || (projections.findIndex(p => p.roi > 0) + 1) || null;

  return (
    <div className="space-y-6">
      {/* Historical Data Banner */}
      {statements.length > 0 && metrics && (
        <Alert className="bg-primary/5 border-primary/20">
          <Database className="h-4 w-4 text-primary" />
          <AlertTitle>Using Historical Statement Data</AlertTitle>
          <AlertDescription className="text-sm">
            Projections enhanced with {statements.length} quarters of actual data 
            (Avg: ${metrics.averageRevenue.toLocaleString()}/quarter, Growth: {metrics.quarterOverQuarterGrowth > 0 ? '+' : ''}{metrics.quarterOverQuarterGrowth.toFixed(1)}%)
          </AlertDescription>
        </Alert>
      )}

      {/* Rights Information Panel */}
      {rightsCalculation?.rightsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-music-purple" />
              Rights Analysis
            </CardTitle>
            <CardDescription>
              Based on copyright data in your system for selected tracks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Master Rights Info */}
              {(dealTerms.rightsType === 'master' || dealTerms.rightsType === 'both') && (
                <div className="space-y-3">
                  <h4 className="font-medium text-music-purple">Master/Recording Rights</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Recordings Found:</span>
                      <span className="font-medium">{rightsCalculation.rightsData.masterRights.recordings.length}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>• Streaming revenue from recorded performances</p>
                      <p>• Master sync licensing for film/TV/ads</p>
                      <p>• Digital sales and downloads</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Publishing Rights Info */}
              {(dealTerms.rightsType === 'publishing' || dealTerms.rightsType === 'both') && (
                <div className="space-y-3">
                  <h4 className="font-medium text-music-purple">Publishing/Composition Rights</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Compositions Found:</span>
                      <span className="font-medium">{rightsCalculation.rightsData.publishingRights.compositions.length}</span>
                    </div>
                    {rightsCalculation.rightsData.publishingRights.ownership > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Publishing Ownership:</span>
                        <span className="font-medium">{rightsCalculation.rightsData.publishingRights.ownership.toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <p>• Performance royalties (radio, streaming)</p>
                      <p>• Mechanical royalties (reproductions)</p>
                      <p>• Synchronization licensing</p>
                      <p>• Print and other rights</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rights Type Explanation */}
            <Separator className="my-4" />
            <div className="bg-accent/50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">Rights Type: {dealTerms.rightsType.charAt(0).toUpperCase() + dealTerms.rightsType.slice(1)}</h5>
              {dealTerms.rightsType === 'master' && (
                <p className="text-sm text-muted-foreground">
                  Master rights deals focus on the recorded performances. Revenue typically peaks earlier but may decline faster as recordings age.
                  Multiplier: ~12x annual revenue.
                </p>
              )}
              {dealTerms.rightsType === 'publishing' && (
                <p className="text-sm text-muted-foreground">
                  Publishing rights deals focus on the underlying compositions. Revenue is more stable long-term through covers, sync, and performance royalties.
                  Multiplier: ~18x annual revenue.
                </p>
              )}
              {dealTerms.rightsType === 'both' && (
                <p className="text-sm text-muted-foreground">
                  360 deals capturing both master and publishing rights provide complete revenue control but require higher investment.
                  Combined multiplier: ~25x annual revenue.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deal Terms Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-music-purple" />
            Deal Structure
          </CardTitle>
          <CardDescription>
            Configure the terms of your catalog acquisition or licensing deal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="dealType">Deal Type</Label>
                <Select 
                  value={dealTerms.dealType} 
                  onValueChange={(value: 'acquisition' | 'licensing' | 'co-publishing') => 
                    setDealTerms({...dealTerms, dealType: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acquisition">Full Acquisition (100%)</SelectItem>
                    <SelectItem value="licensing">Licensing Deal</SelectItem>
                    <SelectItem value="co-publishing">Co-Publishing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rightsType">Rights Type</Label>
                <Select 
                  value={dealTerms.rightsType} 
                  onValueChange={(value: 'master' | 'publishing' | 'both') => 
                    setDealTerms({...dealTerms, rightsType: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Master/Recording Rights</SelectItem>
                    <SelectItem value="publishing">Publishing/Composition Rights</SelectItem>
                    <SelectItem value="both">Both Rights (360 Deal)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {dealTerms.rightsType === 'master' && 'Rights to recorded performances (streaming, sales, sync of recordings)'}
                  {dealTerms.rightsType === 'publishing' && 'Rights to musical compositions (performance, mechanical, sync of songs)'}
                  {dealTerms.rightsType === 'both' && 'Complete rights package including both master and publishing'}
                </p>
              </div>

              <div>
                <Label htmlFor="advance">Upfront Advance</Label>
                <Input
                  id="advance"
                  type="number"
                  value={dealTerms.advance}
                  onChange={(e) => setDealTerms({...dealTerms, advance: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label htmlFor="termLength">Deal Term (Years)</Label>
                <div className="px-3">
                  <Slider
                    value={[dealTerms.termLength]}
                    onValueChange={(value) => setDealTerms({...dealTerms, termLength: value[0]})}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1 year</span>
                    <span>{dealTerms.termLength} years</span>
                    <span>10 years</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {dealTerms.dealType !== 'acquisition' && (
                <div>
                  <Label htmlFor="royaltyRate">Acquirer Share (%)</Label>
                  <div className="px-3">
                    <Slider
                      value={[dealTerms.royaltyRate]}
                      onValueChange={(value) => setDealTerms({...dealTerms, royaltyRate: value[0]})}
                      max={90}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>10%</span>
                      <span>{dealTerms.royaltyRate}%</span>
                      <span>90%</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="recoupmentRate">Recoupment Rate (%)</Label>
                <div className="px-3">
                  <Slider
                    value={[dealTerms.recoupmentRate]}
                    onValueChange={(value) => setDealTerms({...dealTerms, recoupmentRate: value[0]})}
                    max={100}
                    min={25}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>25%</span>
                    <span>{dealTerms.recoupmentRate}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="minimumGuarantee">Minimum Annual Guarantee</Label>
                <Input
                  id="minimumGuarantee"
                  type="number"
                  value={dealTerms.minimumGuarantee}
                  onChange={(e) => setDealTerms({...dealTerms, minimumGuarantee: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label htmlFor="ownershipPercentage">Your Catalog Ownership (%)</Label>
                <div className="px-3">
                  <Slider
                    value={[dealTerms.ownershipPercentage]}
                    onValueChange={(value) => setDealTerms({...dealTerms, ownershipPercentage: value[0]})}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1%</span>
                    <span>{dealTerms.ownershipPercentage}%</span>
                    <span>100%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of the catalog/songs you own
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button onClick={calculateProjections} className="bg-gradient-primary text-primary-foreground">
              Calculate Projections
            </Button>
            
            {projections.length > 0 && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Scenario name..."
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-48"
                />
                <Button variant="outline" onClick={handleSaveScenario}>
                  Save Scenario
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deal Summary */}
      {projections.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-music-purple" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Total Projected Revenue</p>
                    <p className="text-2xl font-bold text-music-purple">
                      {formatCurrency(totalProjectedRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-music-purple" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Final ROI</p>
                    <p className="text-2xl font-bold text-green-600">
                      {finalROI.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-music-purple" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Payback Period</p>
                    <p className="text-2xl font-bold">
                      {paybackPeriod || 'N/A'} years
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-music-purple" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Selected Assets</p>
                    <p className="text-2xl font-bold">
                      {selectedTracks.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Year by Year Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Projections</CardTitle>
              <CardDescription>
                Detailed revenue and ROI breakdown over the deal term
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projections.map((projection) => (
                  <div key={projection.year} className="grid grid-cols-6 gap-4 p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Year {projection.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Revenue</p>
                      <p className="font-medium">{formatCurrency(projection.grossRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Revenue</p>
                      <p className="font-medium">{formatCurrency(projection.netRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Earnings</p>
                      <p className="font-medium text-music-purple">{formatCurrency(projection.acquirerEarnings)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recoupment Balance</p>
                      <p className="font-medium">{formatCurrency(projection.recoupmentBalance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cumulative ROI</p>
                      <p className={`font-medium ${projection.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {projection.roi.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
});

export default DealSimulator;