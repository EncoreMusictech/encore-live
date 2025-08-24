import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  Users2, 
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  PiggyBank
} from "lucide-react";
import { FinancialKPIDashboard } from "../financial/FinancialKPIDashboard";
import { CashFlowProjectionChart } from "../financial/CashFlowProjectionChart";

interface BusinessIntelligenceProps {
  metrics: any;
  aiInsights: any[];
  progressTargets: any[];
}

export function BusinessIntelligence({ metrics, aiInsights, progressTargets }: BusinessIntelligenceProps) {
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Revenue & Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-green-600" />
              <Badge variant="secondary">MRR</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              ${metrics.monthlyRecurringRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{metrics.growthRate}% this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-blue-600" />
              <Badge variant="outline">ARR</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.annualRecurringRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: $324K ({((metrics.annualRecurringRevenue / 324000) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <PiggyBank className="h-5 w-5 text-purple-600" />
              <Badge variant={metrics.profitMargin >= 68 ? "default" : "secondary"}>
                {metrics.profitMargin >= 68 ? "Target Met" : "Below Target"}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profitMargin?.toFixed(1) || '0'}%</div>
            <p className="text-xs text-muted-foreground">
              Target: 68% ({metrics.profitMargin >= 68 ? '✓' : `${(68 - metrics.profitMargin).toFixed(1)}% to go`})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users2 className="h-5 w-5 text-orange-600" />
              <Badge variant="secondary">LTV/CAC</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Customer Value Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.customerLifetimeValue / metrics.customerAcquisitionCost).toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">
              LTV: ${metrics.customerLifetimeValue} / CAC: ${metrics.customerAcquisitionCost}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Targets Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Business Targets Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {progressTargets.map((target, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{target.name}</h4>
                  <Badge variant={target.onTrack ? "default" : "destructive"}>
                    {target.onTrack ? "On Track" : "Behind"}
                  </Badge>
                </div>
                <Progress value={Math.min(target.progress, 100)} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {typeof target.current === 'number' && target.current % 1 !== 0 
                      ? target.current.toFixed(1) 
                      : target.current.toLocaleString()
                    } / {target.target.toLocaleString()}
                  </span>
                  <span>{target.progress.toFixed(1)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Due: {new Date(target.deadline).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Intelligence Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Business Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights
              .filter(insight => 
                insight.role.includes('financial') || 
                insight.role.includes('sales') || 
                insight.role.includes('admin')
              )
              .slice(0, 4)
              .map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 rounded-lg border bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      insight.priority === 'high' ? 'bg-red-500' :
                      insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                    {insight.suggestedAction && (
                      <div className="mt-2 p-2 bg-primary/10 rounded text-sm">
                        <strong>Recommended Action:</strong> {insight.suggestedAction}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Financial KPI Dashboard */}
      <FinancialKPIDashboard metrics={metrics} />

      {/* Cash Flow Projections */}
      <CashFlowProjectionChart 
        quarterlyData={[]} 
        revenueEvents={[]}
      />
    </div>
  );
}