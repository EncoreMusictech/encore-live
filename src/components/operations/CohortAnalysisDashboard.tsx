import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCohortAnalysis } from "@/hooks/useCohortAnalysis";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar, Users, TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";

export function CohortAnalysisDashboard() {
  const { cohorts, loading, generateCohortAnalysis } = useCohortAnalysis();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true);
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await generateCohortAnalysis(startDate, endDate);
    setIsGenerating(false);
  };

  // Prepare data for retention chart
  const retentionChartData = cohorts.map(cohort => ({
    period: cohort.cohort_period,
    month1: cohort.retention_data.month_1,
    month3: cohort.retention_data.month_3,
    month6: cohort.retention_data.month_6,
    month12: cohort.retention_data.month_12,
  }));

  // Prepare data for revenue chart
  const revenueChartData = cohorts.map(cohort => ({
    period: cohort.cohort_period,
    month1: cohort.revenue_data.month_1,
    month3: cohort.revenue_data.month_3,
    month6: cohort.revenue_data.month_6,
    month12: cohort.revenue_data.month_12,
  }));

  // Calculate key metrics
  const avgRetention = cohorts.length > 0 
    ? cohorts.reduce((acc, c) => acc + (c.retention_data.month_12 / c.cohort_size), 0) / cohorts.length * 100
    : 0;

  const totalCustomers = cohorts.reduce((acc, c) => acc + c.cohort_size, 0);
  
  const avgLTV = cohorts.length > 0
    ? cohorts.reduce((acc, c) => acc + (c.revenue_data.month_12 / c.cohort_size), 0) / cohorts.length
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cohort Analysis</h2>
          <p className="text-muted-foreground">Customer retention and revenue analysis by cohorts</p>
        </div>
        <Button 
          onClick={handleGenerateAnalysis} 
          disabled={isGenerating}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Refresh Analysis'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all cohorts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">12-Month Retention</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRetention.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average retention rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgLTV.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">12-month value per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cohorts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohorts.length}</div>
            <p className="text-xs text-muted-foreground">Tracking periods</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Customer Retention by Cohort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, `${String(name).replace('month', 'Month ')} retention`]}
                />
                <Line 
                  type="monotone" 
                  dataKey="month1" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name="month1"
                />
                <Line 
                  type="monotone" 
                  dataKey="month3" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="month3"
                />
                <Line 
                  type="monotone" 
                  dataKey="month6" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="month6"
                />
                <Line 
                  type="monotone" 
                  dataKey="month12" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={2}
                  name="month12"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue per Cohort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`$${value?.toLocaleString()}`, `${String(name).replace('month', 'Month ')} revenue`]}
                />
                <Bar dataKey="month1" fill="hsl(var(--chart-1))" />
                <Bar dataKey="month3" fill="hsl(var(--chart-2))" />
                <Bar dataKey="month6" fill="hsl(var(--chart-3))" />
                <Bar dataKey="month12" fill="hsl(var(--chart-4))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cohorts.map((cohort) => {
              const retentionRate = (cohort.retention_data.month_12 / cohort.cohort_size) * 100;
              const avgRevenue = cohort.revenue_data.month_12 / cohort.cohort_size;
              
              return (
                <div key={cohort.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{cohort.cohort_period}</div>
                    <div className="text-sm text-muted-foreground">
                      {cohort.cohort_size} customers
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={retentionRate > 30 ? "default" : retentionRate > 20 ? "secondary" : "destructive"}>
                      {retentionRate.toFixed(1)}% retention
                    </Badge>
                    
                    <Badge variant="outline">
                      ${avgRevenue.toFixed(0)} avg LTV
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}