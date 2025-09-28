import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, BarChart3, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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

  // Generate realistic historical performance data
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
        const growth = index > 0 ? ((streams / (baseStreams * 1.05 * (index - 1 || 1))) - 1) * 100 : 0;
        
        return {
          month,
          streams,
          revenue: Math.round(revenue),
          growth: Math.round(growth * 10) / 10
        };
      });
    };

    const generateComparables = () => {
      const genreMultiples = {
        'Hip-Hop': { min: 12, max: 18, avg: 14 },
        'Pop': { min: 9, max: 15, avg: 11.5 },
        'R&B': { min: 9, max: 16, avg: 12.5 },
        'Rock': { min: 7, max: 12, avg: 9.5 },
        'Electronic': { min: 6, max: 14, avg: 10 }
      };

      const similarArtists = {
        'Hip-Hop': ['Drake', 'Kendrick Lamar', 'Travis Scott', 'Future', 'Lil Wayne'],
        'Pop': ['Taylor Swift', 'Ariana Grande', 'Ed Sheeran', 'Dua Lipa', 'The Weeknd'],
        'R&B': ['The Weeknd', 'SZA', 'Frank Ocean', 'H.E.R.', 'Daniel Caesar'],
        'Rock': ['Imagine Dragons', 'OneRepublic', 'Maroon 5', 'Coldplay', 'Red Hot Chili Peppers'],
        'Electronic': ['Calvin Harris', 'David Guetta', 'Marshmello', 'Skrillex', 'Deadmau5']
      };

      const artists = similarArtists[genre as keyof typeof similarArtists] || similarArtists['Pop'];
      const multiples = genreMultiples[genre as keyof typeof genreMultiples] || genreMultiples['Pop'];
      
      return artists.map((artist, index) => {
        const multiple = multiples.min + (Math.random() * (multiples.max - multiples.min));
        const baseValue = 50000000 + (Math.random() * 200000000);
        
        return {
          artist,
          genre,
          valuation: Math.round(baseValue),
          multiple: Math.round(multiple * 10) / 10,
          date: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`,
          deal_type: Math.random() > 0.5 ? 'Full Acquisition' : 'Co-Publishing'
        };
      });
    };

    setHistoricalData(generateHistoricalData());
    setComparables(generateComparables());
    setLoading(false);
  }, [artistName, genre, popularity]);

  const totalStreams = historicalData.reduce((sum, data) => sum + data.streams, 0);
  const avgGrowth = historicalData.reduce((sum, data) => sum + data.growth, 0) / historicalData.length;
  const avgMultiple = comparables.reduce((sum, comp) => sum + comp.multiple, 0) / comparables.length;
  const avgValuation = comparables.reduce((sum, comp) => sum + comp.valuation, 0) / comparables.length;

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Streams (12M)</p>
                <p className="text-2xl font-bold">{(totalStreams / 1000000).toFixed(1)}M</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Growth Rate</p>
                <p className="text-2xl font-bold flex items-center">
                  {avgGrowth > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                  )}
                  {Math.abs(avgGrowth).toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Multiple</p>
                <p className="text-2xl font-bold">{avgMultiple.toFixed(1)}x</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Deal Size</p>
                <p className="text-2xl font-bold">${(avgValuation / 1000000).toFixed(0)}M</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Historical Trends</TabsTrigger>
          <TabsTrigger value="comparables">Market Comparables</TabsTrigger>
          <TabsTrigger value="analysis">Trend Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Performance Trend</CardTitle>
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
                    name="Monthly Streams"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Growth Rate by Month</CardTitle>
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
                    fill="hsl(var(--chart-3))"
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
              <CardTitle>Similar Artist Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-medium">Artist</th>
                      <th className="text-left p-2 font-medium">Deal Type</th>
                      <th className="text-right p-2 font-medium">Valuation</th>
                      <th className="text-right p-2 font-medium">Multiple</th>
                      <th className="text-left p-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparables.map((comp, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="p-2 font-medium">{comp.artist}</td>
                        <td className="p-2 text-muted-foreground">{comp.deal_type}</td>
                        <td className="p-2 text-right font-mono">
                          ${(comp.valuation / 1000000).toFixed(1)}M
                        </td>
                        <td className="p-2 text-right font-mono">{comp.multiple}x</td>
                        <td className="p-2 text-muted-foreground">{comp.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Deal Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Full Acquisition', value: comparables.filter(c => c.deal_type === 'Full Acquisition').length },
                        { name: 'Co-Publishing', value: comparables.filter(c => c.deal_type === 'Co-Publishing').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valuation Range Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Min Valuation</span>
                  <span className="font-mono">${(Math.min(...comparables.map(c => c.valuation)) / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Valuation</span>
                  <span className="font-mono">${(Math.max(...comparables.map(c => c.valuation)) / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Multiple</span>
                  <span className="font-mono">{avgMultiple.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Genre Premium</span>
                  <span className="font-mono text-green-600">
                    {genre === 'Hip-Hop' ? '+15%' : genre === 'Pop' ? 'Baseline' : '-8%'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Trend Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Performance Momentum</h4>
                  <p className="text-sm text-muted-foreground">
                    {avgGrowth > 5 ? 'Strong upward trend with consistent growth above 5%' :
                     avgGrowth > 0 ? 'Positive growth trend with moderate momentum' :
                     'Declining performance requires attention'}
                  </p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Seasonal Patterns</h4>
                  <p className="text-sm text-muted-foreground">
                    {genre === 'Pop' ? 'Shows typical seasonal peaks in summer months' :
                     genre === 'Hip-Hop' ? 'Consistent performance throughout the year' :
                     'Moderate seasonal variation observed'}
                  </p>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Market Position</h4>
                  <p className="text-sm text-muted-foreground">
                    {popularity > 80 ? 'Top-tier artist with premium valuation potential' :
                     popularity > 60 ? 'Mid-tier artist with solid market presence' :
                     'Emerging artist with growth potential'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Optimal Timing</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {avgGrowth > 5 ? 'Current momentum suggests favorable timing for valuation' :
                     'Consider waiting for improved performance metrics'}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Valuation Strategy</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Based on comparables, target multiple range: {(avgMultiple - 1).toFixed(1)}x - {(avgMultiple + 1).toFixed(1)}x
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">Risk Factors</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Monitor for market volatility and genre-specific trends
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketIntelligenceTab;