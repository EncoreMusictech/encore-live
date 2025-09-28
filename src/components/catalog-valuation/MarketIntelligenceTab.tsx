import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, BarChart3, Activity, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MarketTrend {
  month: string;
  streams: number;
  revenue: number;
  growth: number;
}

interface Comparable {
  artist: string;
  genre: string;
  valuation: number;
  multiple: number;
  date: string;
  deal_type: string;
}

interface MarketIntelligenceTabProps {
  artistName: string;
  genre: string;
  popularity: number;
}

const MarketIntelligenceTab: React.FC<MarketIntelligenceTabProps> = ({ 
  artistName, 
  genre, 
  popularity 
}) => {
  const [historicalData, setHistoricalData] = useState<MarketTrend[]>([]);
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate estimated historical performance data based on artist characteristics
  useEffect(() => {
    const generateHistoricalData = () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const baseStreams = Math.floor(popularity * 10000);
      
      return months.map((month, index) => {
        const seasonalFactor = genre === 'Pop' ? (1 + Math.sin(index * Math.PI / 6) * 0.2) : 1;
        const trendFactor = 1 + (index * 0.05); // Growth trend
        const volatility = (Math.random() - 0.5) * 0.3;
        
        const streams = Math.floor(baseStreams * seasonalFactor * trendFactor * (1 + volatility));
        const revenue = streams * (genre === 'Hip-Hop' ? 0.004 : genre === 'Pop' ? 0.003 : 0.0025);
        const growth = index === 0 ? 0 : ((streams - baseStreams) / baseStreams) * 100;
        
        return {
          month,
          streams,
          revenue: Math.floor(revenue),
          growth: Math.floor(growth)
        };
      });
    };

    // Generate estimated comparable deals (with clear disclaimers)
    const generateComparables = () => {
      const genreMultiples = {
        'Hip-Hop': { min: 12, max: 18 },
        'Pop': { min: 8, max: 15 },
        'R&B': { min: 9, max: 16 },
        'Electronic': { min: 6, max: 14 },
        'Rock': { min: 7, max: 12 },
        'unknown': { min: 5, max: 10 }
      };
      
      const currentMultiple = genreMultiples[genre as keyof typeof genreMultiples] || genreMultiples.unknown;
      
      return [
        {
          artist: `Similar ${genre} Artist A`,
          genre,
          valuation: Math.floor(popularity * 50000 * (currentMultiple.min + Math.random() * (currentMultiple.max - currentMultiple.min))),
          multiple: currentMultiple.min + Math.random() * (currentMultiple.max - currentMultiple.min),
          date: '2024',
          deal_type: 'Estimated Based on Genre Benchmarks'
        },
        {
          artist: `Comparable ${genre} Artist B`,
          genre,
          valuation: Math.floor(popularity * 45000 * (currentMultiple.min + Math.random() * (currentMultiple.max - currentMultiple.min))),
          multiple: currentMultiple.min + Math.random() * (currentMultiple.max - currentMultiple.min),
          date: '2024',
          deal_type: 'Industry Benchmark Estimate'
        },
        {
          artist: `Industry Peer C`,
          genre,
          valuation: Math.floor(popularity * 55000 * (currentMultiple.min + Math.random() * (currentMultiple.max - currentMultiple.min))),
          multiple: currentMultiple.min + Math.random() * (currentMultiple.max - currentMultiple.min),
          date: '2024',
          deal_type: 'Market Analysis Projection'
        }
      ];
    };

    setHistoricalData(generateHistoricalData());
    setComparables(generateComparables());
    setLoading(false);
  }, [artistName, genre, popularity]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading market intelligence...</div>;
  }

  const totalStreams = historicalData.reduce((sum, data) => sum + data.streams, 0);
  const avgStreams = Math.floor(totalStreams / 12);
  const totalRevenue = historicalData.reduce((sum, data) => sum + data.revenue, 0);
  const avgGrowth = historicalData.reduce((sum, data) => sum + data.growth, 0) / 12;
  const avgValuation = comparables.reduce((sum, comp) => sum + comp.valuation, 0) / comparables.length;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      {/* Data Quality Disclaimer */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Quality Notice:</strong> This Market Intelligence tab shows estimated data based on industry benchmarks and statistical modeling. 
          Historical trends and comparable deals are projections for illustrative purposes only and should not be used as the sole basis for investment decisions. 
          Only the Spotify follower data in the main valuation is from real-time API sources.
        </AlertDescription>
      </Alert>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Total Streams (12mo)</p>
                <p className="text-2xl font-bold">{(totalStreams / 1000000).toFixed(1)}M</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Monthly Avg</p>
                <p className="text-2xl font-bold">{(avgStreams / 1000).toFixed(0)}K</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Growth Rate</p>
                <p className="text-2xl font-bold flex items-center">
                  {avgGrowth > 0 ? <TrendingUp className="h-5 w-5 text-green-500 mr-1" /> : <TrendingDown className="h-5 w-5 text-red-500 mr-1" />}
                  {avgGrowth.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Avg Valuation</p>
                <p className="text-2xl font-bold">${(avgValuation / 1000000).toFixed(0)}M</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Estimated Trends</TabsTrigger>
          <TabsTrigger value="comparables">Benchmark Estimates</TabsTrigger>
          <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estimated 12-Month Performance Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                Projected based on artist popularity score and genre benchmarks
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="streams" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Est. Monthly Streams"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Est. Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estimated Growth Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="growth" 
                    fill="hsl(var(--primary))" 
                    name="Growth Rate (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmark Estimates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Estimated comparable valuations based on genre-specific market multiples
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparables.map((comp, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{comp.artist}</h4>
                      <p className="text-sm text-muted-foreground">
                        {comp.genre} • {comp.deal_type} • {comp.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(comp.valuation / 1000000).toFixed(1)}M</p>
                      <p className="text-sm text-muted-foreground">{comp.multiple.toFixed(1)}x Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valuation Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={comparables.map((comp, index) => ({
                      name: comp.artist,
                      value: comp.valuation,
                      fill: COLORS[index % COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  />
                  <Tooltip formatter={(value: number) => [`$${(value / 1000000).toFixed(1)}M`, 'Valuation']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Key Observations</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Based on {genre} genre benchmarks with estimated {(avgGrowth > 0 ? 'positive' : 'negative')} growth trajectory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Estimated revenue multiple range: {Math.min(...comparables.map(c => c.multiple)).toFixed(1)}x - {Math.max(...comparables.map(c => c.multiple)).toFixed(1)}x</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Artist popularity score of {popularity} suggests {popularity > 70 ? 'premium' : popularity > 40 ? 'market-rate' : 'discount'} valuation potential</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Methodology Notes</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Historical trends are statistical projections based on genre patterns</li>
                    <li>• Comparable deals are estimated using industry benchmark multiples</li>
                    <li>• Revenue calculations use genre-specific streaming rate estimates</li>
                    <li>• Growth rates factor in seasonal variations and market trends</li>
                    <li>• All data is for informational purposes only</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Factors & Considerations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <strong className="text-yellow-800 dark:text-yellow-200">Market Volatility:</strong>
                  <span className="text-yellow-700 dark:text-yellow-300 ml-2">
                    Music valuations can fluctuate significantly based on streaming trends, artist activity, and market conditions.
                  </span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <strong className="text-blue-800 dark:text-blue-200">Genre-Specific Risks:</strong>
                  <span className="text-blue-700 dark:text-blue-300 ml-2">
                    {genre} music carries specific market risks including changing consumer preferences and competitive landscape dynamics.
                  </span>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <strong className="text-purple-800 dark:text-purple-200">Data Limitations:</strong>
                  <span className="text-purple-700 dark:text-purple-300 ml-2">
                    These estimates are based on statistical models and public benchmarks. Actual performance may vary significantly.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketIntelligenceTab;