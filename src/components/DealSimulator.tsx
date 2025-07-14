import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, DollarSign, Users } from "lucide-react";

interface DealTerms {
  advance: number;
  royaltyRate: number;
  termLength: number;
  dealType: 'acquisition' | 'licensing' | 'co-publishing';
  recoupmentRate: number;
  minimumGuarantee: number;
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

const DealSimulator = ({ selectedTracks, artistName, onSaveScenario }: DealSimulatorProps) => {
  const [dealTerms, setDealTerms] = useState<DealTerms>({
    advance: 100000,
    royaltyRate: 50,
    termLength: 5,
    dealType: 'acquisition',
    recoupmentRate: 75,
    minimumGuarantee: 50000
  });

  const [scenarioName, setScenarioName] = useState("");
  const [projections, setProjections] = useState<DealProjection[]>([]);

  // Calculate base streams from selected tracks
  const calculateBaseStreams = () => {
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
  };

  const calculateProjections = () => {
    const baseStreams = calculateBaseStreams();
    const baseRevenue = baseStreams * 0.003; // $0.003 per stream
    
    const projections: DealProjection[] = [];
    let currentRecoupment = dealTerms.advance;
    
    for (let year = 1; year <= dealTerms.termLength; year++) {
      // Growth rate decreases over time (realistic decay)
      const growthRate = Math.max(0.02, 0.15 - (year * 0.02)); // 15% year 1, declining to 2%
      const yearlyStreams = baseStreams * Math.pow(1 + growthRate, year - 1);
      const grossRevenue = yearlyStreams * 0.003;
      
      // Calculate net revenue (after platform fees, etc.)
      const netRevenue = grossRevenue * 0.7; // 30% platform/distribution fees
      
      // Calculate earnings split
      const acquirerShare = dealTerms.dealType === 'acquisition' ? 100 : dealTerms.royaltyRate;
      const artistShare = 100 - acquirerShare;
      
      const acquirerEarnings = (netRevenue * acquirerShare) / 100;
      const artistEarnings = (netRevenue * artistShare) / 100;
      
      // Calculate recoupment
      const recoupmentPayment = Math.min(currentRecoupment, acquirerEarnings * (dealTerms.recoupmentRate / 100));
      currentRecoupment = Math.max(0, currentRecoupment - recoupmentPayment);
      
      // Calculate ROI
      const totalInvested = dealTerms.advance + (year * 10000); // Assume $10k annual costs
      const totalReturned = projections.reduce((sum, p) => sum + p.acquirerEarnings, 0) + acquirerEarnings;
      const roi = ((totalReturned - totalInvested) / totalInvested) * 100;
      
      projections.push({
        year,
        grossRevenue,
        netRevenue,
        artistEarnings,
        acquirerEarnings,
        recoupmentBalance: currentRecoupment,
        roi
      });
    }
    
    setProjections(projections);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSaveScenario = () => {
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
  };

  const totalProjectedRevenue = projections.reduce((sum, p) => sum + p.acquirerEarnings, 0);
  const finalROI = projections.length > 0 ? projections[projections.length - 1].roi : 0;

  return (
    <div className="space-y-6">
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
                      {projections.findIndex(p => p.roi > 0) + 1 || 'N/A'} years
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
};

export default DealSimulator;