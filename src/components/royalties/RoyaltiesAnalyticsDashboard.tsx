import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { Download, Brain, Calendar, Users, Globe, Radio, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export function RoyaltiesAnalyticsDashboard() {
  const { allocations, loading } = useRoyaltyAllocations();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [aiInsights, setAiInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Process data for analytics
  const analyticsData = useMemo(() => {
    let filtered = allocations;

    // Apply filters
    if (selectedPeriod !== "all") {
      const periodStart = new Date();
      switch (selectedPeriod) {
        case "q1":
          periodStart.setMonth(0, 1);
          break;
        case "q2":
          periodStart.setMonth(3, 1);
          break;
        case "q3":
          periodStart.setMonth(6, 1);
          break;
        case "q4":
          periodStart.setMonth(9, 1);
          break;
      }
      filtered = filtered.filter(allocation => {
        const createdDate = new Date(allocation.created_at);
        return createdDate >= periodStart;
      });
    }

    // Generate quarterly data
    const quarterlyData = [
      { quarter: "Q1 2024", amount: filtered.filter(a => new Date(a.created_at).getMonth() < 3).reduce((sum, a) => sum + a.gross_royalty_amount, 0) },
      { quarter: "Q2 2024", amount: filtered.filter(a => new Date(a.created_at).getMonth() >= 3 && new Date(a.created_at).getMonth() < 6).reduce((sum, a) => sum + a.gross_royalty_amount, 0) },
      { quarter: "Q3 2024", amount: filtered.filter(a => new Date(a.created_at).getMonth() >= 6 && new Date(a.created_at).getMonth() < 9).reduce((sum, a) => sum + a.gross_royalty_amount, 0) },
      { quarter: "Q4 2024", amount: filtered.filter(a => new Date(a.created_at).getMonth() >= 9).reduce((sum, a) => sum + a.gross_royalty_amount, 0) },
    ];

    // Generate controlled status data
    const controlledData = filtered.reduce((acc, allocation) => {
      const status = allocation.controlled_status || 'Non-Controlled';
      acc[status] = (acc[status] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const controlledPieData = Object.entries(controlledData).map(([name, value]) => ({ name, value }));

    // Generate top songs data
    const songData = filtered.reduce((acc, allocation) => {
      acc[allocation.song_title] = (acc[allocation.song_title] || 0) + allocation.gross_royalty_amount;
      return acc;
    }, {} as Record<string, number>);

    const topSongs = Object.entries(songData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([song, amount]) => ({ song, amount }));

    return {
      quarterly: quarterlyData,
      controlled: controlledPieData,
      topSongs,
      total: filtered.reduce((sum, a) => sum + a.gross_royalty_amount, 0),
      count: filtered.length
    };
  }, [allocations, selectedPeriod, selectedTerritory, selectedSource]);

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('royalties-ai-insights', {
        body: { 
          analyticsData,
          filters: { selectedPeriod, selectedTerritory, selectedSource }
        }
      });

      if (error) throw error;
      setAiInsights(data.insights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        title: "Error generating insights",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const exportData = () => {
    const dataToExport = {
      summary: {
        totalAmount: analyticsData.total,
        totalCount: analyticsData.count,
        filters: { selectedPeriod, selectedTerritory, selectedSource }
      },
      quarterly: analyticsData.quarterly,
      controlled: analyticsData.controlled,
      topSongs: analyticsData.topSongs
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `royalties-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Analytics data has been exported successfully."
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Royalties Analytics</h2>
          <p className="text-muted-foreground">Comprehensive analysis of your royalty performance</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              <SelectItem value="q1">Q1 2024</SelectItem>
              <SelectItem value="q2">Q2 2024</SelectItem>
              <SelectItem value="q3">Q3 2024</SelectItem>
              <SelectItem value="q4">Q4 2024</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={generateAIInsights} disabled={loadingInsights} variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            {loadingInsights ? "Generating..." : "AI Insights"}
          </Button>

          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.total.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Royalties</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Royalty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.count > 0 ? (analyticsData.total / analyticsData.count).toFixed(2) : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {selectedPeriod !== "all" && <Badge variant="secondary">{selectedPeriod}</Badge>}
              {selectedTerritory !== "all" && <Badge variant="secondary">{selectedTerritory}</Badge>}
              {selectedSource !== "all" && <Badge variant="secondary">{selectedSource}</Badge>}
              {selectedPeriod === "all" && selectedTerritory === "all" && selectedSource === "all" && (
                <Badge variant="outline">No filters</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{aiInsights}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="quarterly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quarterly">Quarterly Trends</TabsTrigger>
          <TabsTrigger value="controlled">Controlled Status</TabsTrigger>
          <TabsTrigger value="topsongs">Top Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="quarterly">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Revenue Trends</CardTitle>
              <CardDescription>Revenue performance across quarters</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.quarterly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controlled">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Controlled Status</CardTitle>
              <CardDescription>Distribution of revenue by writer control status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={analyticsData.controlled}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.controlled.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topsongs">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Songs</CardTitle>
              <CardDescription>Songs generating the highest royalties</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.topSongs} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="song" type="category" width={150} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}