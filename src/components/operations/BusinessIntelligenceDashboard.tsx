import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Users,
  DollarSign,
  Activity
} from "lucide-react";

export function BusinessIntelligenceDashboard() {
  const kpis = [
    {
      name: 'Customer Lifetime Value',
      current: '$2,450',
      target: '$3,000',
      progress: 81.7,
      trend: '+12%',
      icon: Users
    },
    {
      name: 'Monthly Recurring Revenue',
      current: '$47,200',
      target: '$50,000', 
      progress: 94.4,
      trend: '+8%',
      icon: DollarSign
    },
    {
      name: 'Product Adoption Rate',
      current: '73%',
      target: '80%',
      progress: 91.3,
      trend: '+5%',
      icon: Activity
    },
    {
      name: 'Conversion Rate',
      current: '4.2%',
      target: '5.0%',
      progress: 84.0,
      trend: '+2%',
      icon: Target
    }
  ];

  const insights = [
    {
      title: 'Revenue Growth Opportunity',
      description: 'Contract management module showing 23% higher retention rates',
      impact: 'High',
      recommendation: 'Promote contract features to existing customers'
    },
    {
      title: 'Customer Success Pattern',
      description: 'Users engaging with 3+ modules have 40% lower churn',
      impact: 'Medium', 
      recommendation: 'Create cross-module onboarding workflows'
    },
    {
      title: 'Support Efficiency',
      description: 'Average resolution time decreased by 15% this quarter',
      impact: 'Medium',
      recommendation: 'Document and scale successful support processes'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Business Intelligence Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kpis.map((kpi, index) => {
            const IconComponent = kpi.icon;
            return (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <Badge variant="outline" className="text-success">
                    {kpi.trend}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">{kpi.name}</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{kpi.current}</span>
                    <span className="text-sm text-muted-foreground">/ {kpi.target}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress to target</span>
                      <span>{kpi.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={kpi.progress} className="h-2" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 bg-accent/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <Badge variant={
                    insight.impact === 'High' ? 'destructive' : 
                    insight.impact === 'Medium' ? 'default' : 'secondary'
                  }>
                    {insight.impact} Impact
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {insight.description}
                </p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{insight.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}