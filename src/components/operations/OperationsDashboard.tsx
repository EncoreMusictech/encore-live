import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Star,
  Ticket,
  Activity,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { useOperationsData } from "@/hooks/useOperationsData";
import { CustomerHealthTable } from "./CustomerHealthTable";
import { SupportTicketsTable } from "./SupportTicketsTable";
import { RevenueChart } from "./RevenueChart";
import { DataSeedButton } from "./DataSeedButton";
import { TeamPerformanceDashboard } from "./TeamPerformanceDashboard";
import { WorkflowAutomationPanel } from "./WorkflowAutomationPanel";

export function OperationsDashboard() {
  const { metrics, customerHealth, supportTickets, loading, error, refreshData } = useOperationsData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">Operations Dashboard</h1>
            <p className="text-muted-foreground">Loading operations data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">Operations Dashboard</h1>
            <p className="text-destructive">Error loading data: {error}</p>
          </div>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-success';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-success';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor customer health, support performance, and revenue metrics
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Total</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.totalCustomers.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Customers</p>
            <p className="text-xs text-muted-foreground">
              {metrics.activeCustomers} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className={getHealthScoreColor(metrics.avgHealthScore)}>
                {(metrics.avgHealthScore * 100).toFixed(0)}%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.avgHealthScore.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Avg Health Score</p>
            <Progress value={metrics.avgHealthScore * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <Badge variant="destructive">
                {metrics.criticalRiskCustomers}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.criticalRiskCustomers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">High Risk Customers</p>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Ticket className="h-5 w-5 text-primary" />
              <Badge variant={metrics.openTickets > 10 ? "destructive" : "secondary"}>
                Open
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.openTickets}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Support Tickets</p>
            <p className="text-xs text-muted-foreground">
              Avg resolution: {metrics.avgResolutionTime}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-success">
                +MRR
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              ${metrics.monthlyRecurringRevenue.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Monthly Recurring Revenue</p>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Badge variant={metrics.churnRate > 5 ? "destructive" : "secondary"}>
                {metrics.churnRate}%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.churnRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Churn Rate</p>
            <p className="text-xs text-muted-foreground">
              Monthly average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Star className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-yellow-600">
                ★ {metrics.customerSatisfaction.toFixed(1)}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.customerSatisfaction.toFixed(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Customer Satisfaction</p>
            <p className="text-xs text-muted-foreground">
              Average rating (1-5)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-primary" />
              <Badge variant="secondary">
                {metrics.avgResolutionTime.toFixed(1)}h
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.avgResolutionTime.toFixed(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Avg Resolution Time</p>
            <p className="text-xs text-muted-foreground">
              Support ticket resolution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>
              Monthly revenue and customer acquisition trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        {/* Customer Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Customer Health Overview
            </CardTitle>
            <CardDescription>
              Top customers by health score and risk level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerHealth.slice(0, 5).map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Customer #{index + 1}</span>
                      <Badge 
                        variant="outline" 
                        className={getRiskColor(customer.risk_level)}
                      >
                        {customer.risk_level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {customer.modules_used?.length || 0} modules • {customer.contracts_created} contracts
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getHealthScoreColor(customer.health_score)}`}>
                      {(customer.health_score * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Health Score
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Seeder for Development */}
      <DataSeedButton />

      {/* Enhanced Operations Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>
              Team member performance and workload management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamPerformanceDashboard />
          </CardContent>
        </Card>

        {/* Workflow Automation */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Automation</CardTitle>
            <CardDescription>
              Automated business processes and triggers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowAutomationPanel />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Customer Health Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Health Details</CardTitle>
            <CardDescription>
              Detailed customer health metrics and risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerHealthTable customers={customerHealth} />
          </CardContent>
        </Card>

        {/* Support Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Support Tickets</CardTitle>
            <CardDescription>
              Latest support requests and resolution status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupportTicketsTable tickets={supportTickets.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}