import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  AlertTriangle, 
  Star,
  Heart,
  Target
} from "lucide-react";
import { CustomerHealthTable } from "../CustomerHealthTable";
import { CustomerSuccessIntelligence } from "../CustomerSuccessIntelligence";
import { CohortAnalysisDashboard } from "../CohortAnalysisDashboard";

interface CustomerSuccessTabProps {
  metrics: any;
  customerHealth: any[];
}

export function CustomerSuccessTab({ metrics, customerHealth }: CustomerSuccessTabProps) {
  const getHealthScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-success';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-success';
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Success Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Heart className="h-5 w-5 text-primary" />
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
      </div>

      {/* Customer Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
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

      {/* Customer Health Details */}
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

      {/* Customer Success Intelligence */}
      <CustomerSuccessIntelligence />

      {/* Cohort Analysis */}
      <CohortAnalysisDashboard />
    </div>
  );
}