import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  Download
} from "lucide-react";

export function ExecutiveDashboard() {
  const executiveMetrics = {
    revenue: {
      current: 2450000,
      target: 3000000,
      growth: 23.5,
      forecast: 2850000
    },
    customers: {
      total: 1247,
      churn: 2.3,
      acquisition: 156,
      satisfaction: 4.6
    },
    operations: {
      efficiency: 87.2,
      costs: 450000,
      automation: 73,
      incidents: 3
    },
    team: {
      productivity: 91.5,
      utilization: 78.3,
      satisfaction: 4.4,
      retention: 94.2
    }
  };

  const strategicInitiatives = [
    {
      name: "AI Automation Rollout",
      progress: 68,
      status: "on-track",
      impact: "High",
      deadline: "Q2 2024",
      owner: "CTO"
    },
    {
      name: "International Expansion",
      progress: 34,
      status: "at-risk", 
      impact: "Critical",
      deadline: "Q3 2024",
      owner: "CEO"
    },
    {
      name: "Security Compliance Upgrade",
      progress: 89,
      status: "ahead",
      impact: "Medium",
      deadline: "Q1 2024", 
      owner: "CISO"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'default';
      case 'on-track': return 'secondary';
      case 'at-risk': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Executive Dashboard
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Review
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <Badge variant="default" className="text-success">
                +{executiveMetrics.revenue.growth}%
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Annual Revenue</h3>
              <div className="text-2xl font-bold">
                ${(executiveMetrics.revenue.current / 1000000).toFixed(1)}M
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Target: ${(executiveMetrics.revenue.target / 1000000).toFixed(1)}M</span>
                  <span>{((executiveMetrics.revenue.current / executiveMetrics.revenue.target) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(executiveMetrics.revenue.current / executiveMetrics.revenue.target) * 100} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Users className="h-8 w-8 text-primary" />
              <Badge variant={executiveMetrics.customers.churn < 3 ? "default" : "destructive"}>
                {executiveMetrics.customers.churn}% churn
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Customer Base</h3>
              <div className="text-2xl font-bold">
                {executiveMetrics.customers.total.toLocaleString()}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">New: </span>
                  <span className="font-medium">+{executiveMetrics.customers.acquisition}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CSAT: </span>
                  <span className="font-medium">{executiveMetrics.customers.satisfaction}/5</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Target className="h-8 w-8 text-primary" />
              <Badge variant={executiveMetrics.operations.efficiency > 85 ? "default" : "secondary"}>
                {executiveMetrics.operations.efficiency}%
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Operational Efficiency</h3>
              <div className="text-2xl font-bold">
                {executiveMetrics.operations.efficiency}%
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Costs: </span>
                  <span className="font-medium">${(executiveMetrics.operations.costs / 1000).toFixed(0)}K</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Automated: </span>
                  <span className="font-medium">{executiveMetrics.operations.automation}%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <Badge variant={executiveMetrics.team.retention > 90 ? "default" : "secondary"}>
                {executiveMetrics.team.retention}% retention
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Team Performance</h3>
              <div className="text-2xl font-bold">
                {executiveMetrics.team.productivity}%
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Utilization: </span>
                  <span className="font-medium">{executiveMetrics.team.utilization}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Satisfaction: </span>
                  <span className="font-medium">{executiveMetrics.team.satisfaction}/5</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Strategic Initiatives */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Strategic Initiatives</h3>
          <div className="space-y-3">
            {strategicInitiatives.map((initiative, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{initiative.name}</h4>
                    <Badge variant={getStatusColor(initiative.status)}>
                      {initiative.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Owner: {initiative.owner}</span>
                    <span>Due: {initiative.deadline}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Progress</span>
                    <span>{initiative.progress}% complete</span>
                  </div>
                  <Progress value={initiative.progress} />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Impact: {initiative.impact}</span>
                    <div className="flex items-center gap-1">
                      {initiative.status === 'ahead' && <CheckCircle className="h-3 w-3 text-success" />}
                      {initiative.status === 'at-risk' && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      {initiative.status === 'on-track' && <Target className="h-3 w-3 text-primary" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Executive Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <PieChart className="mr-2 h-4 w-4" />
              View Detailed Analytics
            </Button>
            <Button size="sm">
              Schedule Board Meeting
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}