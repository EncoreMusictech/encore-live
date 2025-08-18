import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingDown, AlertTriangle, Clock, PieChart as PieChartIcon } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";

export function ReconciliationAnalytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const { batches } = useReconciliationBatches();
  const { allocations } = useRoyaltyAllocations();
  
  const [analytics, setAnalytics] = useState({
    avgReconciliationRate: 0,
    totalVariance: 0,
    avgTimeToReconcile: 0,
    sourceDiversity: 0,
    monthlyTrends: [] as any[],
    sourceBreakdown: [] as any[],
    performanceMetrics: [] as any[]
  });

  useEffect(() => {
    if (batches.length > 0 && allocations.length > 0) {
      calculateAnalytics();
    }
  }, [batches, allocations, timeRange]);

  const calculateAnalytics = () => {
    // Calculate average reconciliation rate
    let totalRate = 0;
    let totalVariance = 0;
    let processedBatches = 0;

    batches.forEach(batch => {
      const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
      const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
      const rate = batch.total_gross_amount > 0 ? (allocatedAmount / batch.total_gross_amount) * 100 : 0;
      const variance = batch.total_gross_amount - allocatedAmount;
      
      totalRate += rate;
      totalVariance += Math.abs(variance);
      processedBatches++;
    });

    const avgReconciliationRate = processedBatches > 0 ? totalRate / processedBatches : 0;

    // Calculate source diversity
    const uniqueSources = new Set(batches.map(batch => batch.source).filter(Boolean));
    const sourceDiversity = uniqueSources.size;

    // Calculate monthly trends
    const monthlyData = calculateMonthlyTrends();
    
    // Calculate source breakdown
    const sourceData = calculateSourceBreakdown();

    setAnalytics({
      avgReconciliationRate,
      totalVariance,
      avgTimeToReconcile: 5.2, // Mock data for now
      sourceDiversity,
      monthlyTrends: monthlyData,
      sourceBreakdown: sourceData,
      performanceMetrics: []
    });
  };

  const calculateMonthlyTrends = () => {
    const monthlyMap = new Map();
    
    batches.forEach(batch => {
      const date = new Date(batch.date_received);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          received: 0,
          allocated: 0
        });
      }
      
      const monthData = monthlyMap.get(monthKey);
      monthData.received += batch.total_gross_amount;
      
      const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
      const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
      monthData.allocated += allocatedAmount;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateSourceBreakdown = () => {
    const sourceMap = new Map();
    
    batches.forEach(batch => {
      const source = batch.source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          name: source,
          value: 0,
          batches: 0,
          color: getSourceColor(source)
        });
      }
      
      const sourceData = sourceMap.get(source);
      sourceData.value += batch.total_gross_amount;
      sourceData.batches += 1;
    });

    return Array.from(sourceMap.values());
  };

  const getSourceColor = (source: string) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
    const index = Math.abs(source.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Reconciliation Analytics</h2>
          <p className="text-muted-foreground">
            Track performance and identify trends in your reconciliation process
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Reconciliation Rate</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgReconciliationRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-red-600">
              <TrendingDown className="h-3 w-3" />
              Declining
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalVariance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unreconciled amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Reconcile</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgTimeToReconcile} days</div>
            <p className="text-xs text-muted-foreground">From receipt to allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Source Diversity</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sourceDiversity}</div>
            <p className="text-xs text-muted-foreground">Active revenue sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="monthly-trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly-trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="source-breakdown">Source Breakdown</TabsTrigger>
          <TabsTrigger value="performance-analysis">Performance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly-trends">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Reconciliation Trends</CardTitle>
              <CardDescription>Track received vs allocated amounts over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, '']} />
                    <Bar dataKey="received" fill="#8b5cf6" name="Received" />
                    <Bar dataKey="allocated" fill="#10b981" name="Allocated" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="source-breakdown">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Distribution of reconciliation batches by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.sourceBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.sourceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Reconciliation metrics by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.sourceBreakdown.map((source) => (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${source.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {source.batches} batches
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance-analysis">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>Detailed reconciliation performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Performance analysis coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}