
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";

interface AnalyticsData {
  monthlyTrends: Array<{
    month: string;
    received: number;
    allocated: number;
    reconciliationRate: number;
  }>;
  sourceBreakdown: Array<{
    source: string;
    count: number;
    amount: number;
    color: string;
  }>;
  reconciliationMetrics: {
    averageReconciliationRate: number;
    totalVariance: number;
    timeToReconcile: number;
    reconciliationTrend: 'up' | 'down' | 'stable';
  };
}

export function ReconciliationAnalytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const { batches } = useReconciliationBatches();
  const { allocations } = useRoyaltyAllocations();

  const sourceColors = {
    'DSP': '#8B5CF6',
    'PRO': '#06B6D4',
    'YouTube': '#EF4444',
    'Other': '#6B7280'
  };

  useEffect(() => {
    if (batches.length === 0) return;

    // Calculate monthly trends
    const monthlyData = new Map();
    const now = new Date();
    const monthsBack = timeRange === "6months" ? 6 : timeRange === "12months" ? 12 : 3;

    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      monthlyData.set(monthKey, {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        received: 0,
        allocated: 0,
        reconciliationRate: 0
      });
    }

    batches.forEach(batch => {
      const batchDate = new Date(batch.date_received);
      const monthKey = batchDate.toISOString().substring(0, 7);
      
      if (monthlyData.has(monthKey)) {
        const data = monthlyData.get(monthKey);
        data.received += batch.total_gross_amount;
        
        const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
        const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
        data.allocated += allocatedAmount;
        
        data.reconciliationRate = data.received > 0 ? (data.allocated / data.received) * 100 : 0;
      }
    });

    // Calculate source breakdown
    const sourceBreakdown = new Map();
    batches.forEach(batch => {
      if (!sourceBreakdown.has(batch.source)) {
        sourceBreakdown.set(batch.source, {
          source: batch.source,
          count: 0,
          amount: 0,
          color: sourceColors[batch.source as keyof typeof sourceColors] || '#6B7280'
        });
      }
      
      const data = sourceBreakdown.get(batch.source);
      data.count += 1;
      data.amount += batch.total_gross_amount;
    });

    // Calculate reconciliation metrics
    const reconciliationRates = batches.map(batch => {
      const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
      const allocatedAmount = batchAllocations.reduce((sum, a) => sum + a.gross_royalty_amount, 0);
      return batch.total_gross_amount > 0 ? (allocatedAmount / batch.total_gross_amount) * 100 : 0;
    });

    const averageReconciliationRate = reconciliationRates.length > 0 
      ? reconciliationRates.reduce((sum, rate) => sum + rate, 0) / reconciliationRates.length 
      : 0;

    const totalReceived = batches.reduce((sum, batch) => sum + batch.total_gross_amount, 0);
    const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.gross_royalty_amount, 0);
    const totalVariance = Math.abs(totalReceived - totalAllocated);

    setAnalyticsData({
      monthlyTrends: Array.from(monthlyData.values()),
      sourceBreakdown: Array.from(sourceBreakdown.values()),
      reconciliationMetrics: {
        averageReconciliationRate,
        totalVariance,
        timeToReconcile: 5.2, // This would be calculated from actual data
        reconciliationTrend: averageReconciliationRate > 85 ? 'up' : averageReconciliationRate < 70 ? 'down' : 'stable'
      }
    });
  }, [batches, allocations, timeRange]);

  if (!analyticsData) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reconciliation Analytics</h2>
          <p className="text-muted-foreground">Track performance and identify trends in your reconciliation process</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Reconciliation Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.reconciliationMetrics.averageReconciliationRate.toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.reconciliationMetrics.reconciliationTrend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : analyticsData.reconciliationMetrics.reconciliationTrend === 'down' ? (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              ) : (
                <div className="h-3 w-3 bg-gray-400 rounded-full mr-1" />
              )}
              {analyticsData.reconciliationMetrics.reconciliationTrend === 'up' ? 'Improving' : 
               analyticsData.reconciliationMetrics.reconciliationTrend === 'down' ? 'Declining' : 'Stable'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.reconciliationMetrics.totalVariance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Unreconciled amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Reconcile</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.reconciliationMetrics.timeToReconcile} days
            </div>
            <p className="text-xs text-muted-foreground">From receipt to allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Source Diversity</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.sourceBreakdown.length}</div>
            <p className="text-xs text-muted-foreground">Active revenue sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="sources">Source Breakdown</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Reconciliation Trends</CardTitle>
              <CardDescription>Track received vs allocated amounts over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString()}`,
                        name === 'received' ? 'Received' : 'Allocated'
                      ]}
                    />
                    <Bar dataKey="received" fill="#8884d8" name="received" />
                    <Bar dataKey="allocated" fill="#82ca9d" name="allocated" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Distribution of revenue across different sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.sourceBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {analyticsData.sourceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Summary</CardTitle>
                <CardDescription>Detailed breakdown by revenue source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.sourceBreakdown.map((source) => (
                    <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: source.color }}
                        />
                        <div>
                          <Badge variant="outline">{source.source}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {source.count} batch{source.count !== 1 ? 'es' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${source.amount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          ${(source.amount / source.count).toLocaleString()}/batch
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Rate Trends</CardTitle>
              <CardDescription>Monthly reconciliation performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Reconciliation Rate']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reconciliationRate" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
