import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Heart,
  Users,
  AlertTriangle,
  TrendingUp,
  Star,
  UserCheck,
  UserX,
  Clock
} from "lucide-react";

interface CustomerExperienceProps {
  metrics: any;
  aiInsights: any[];
}

export function CustomerExperience({ metrics, aiInsights }: CustomerExperienceProps) {
  const healthScoreColor = metrics.avgHealthScore >= 80 ? "text-green-600" :
                          metrics.avgHealthScore >= 60 ? "text-yellow-600" : "text-red-600";

  const satisfactionColor = metrics.customerSatisfaction >= 4.0 ? "text-green-600" :
                           metrics.customerSatisfaction >= 3.5 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Customer Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Heart className="h-5 w-5 text-green-600" />
              <Badge variant="secondary">Health</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Average Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={healthScoreColor}>{metrics.avgHealthScore}/100</span>
            </div>
            <p className="text-xs text-muted-foreground">Across all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <Badge variant={metrics.criticalRiskCustomers > 0 ? "destructive" : "secondary"}>
                {metrics.criticalRiskCustomers > 0 ? "Action Required" : "Good"}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium">At-Risk Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalRiskCustomers}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary">Retention</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{metrics.retentionRate?.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Churn rate: {metrics.churnRate?.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Star className="h-5 w-5 text-yellow-500" />
              <Badge variant={metrics.customerSatisfaction >= 4.0 ? "default" : "secondary"}>
                {metrics.customerSatisfaction >= 4.0 ? "Excellent" : "Good"}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={satisfactionColor}>{metrics.customerSatisfaction?.toFixed(1)}/5.0</span>
            </div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Success Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Success Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights
              .filter(insight => insight.role.includes('customer-success') || insight.role.includes('admin'))
              .slice(0, 3)
              .map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 rounded-lg border-l-4 border-l-primary bg-primary/5">
                  <div className="flex-shrink-0 mt-1">
                    {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {insight.type === 'action_required' && <UserX className="h-5 w-5 text-red-500" />}
                    {insight.type === 'success' && <UserCheck className="h-5 w-5 text-green-500" />}
                    {insight.type === 'opportunity' && <TrendingUp className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                    {insight.suggestedAction && (
                      <div className="mt-3 p-3 bg-white/80 rounded-md border">
                        <p className="text-sm text-primary font-medium">
                          🎯 Suggested Action: {insight.suggestedAction}
                        </p>
                      </div>
                    )}
                  </div>
                  <Badge variant={
                    insight.priority === 'high' ? 'destructive' : 
                    insight.priority === 'medium' ? 'secondary' : 'outline'
                  }>
                    {insight.priority}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Cohort Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Healthy Customers (80-100)</h4>
              <div className="space-y-2">
                {[
                  { segment: "Power Users", count: 23, trend: "+5%" },
                  { segment: "Regular Users", count: 45, trend: "+2%" },
                  { segment: "New Adopters", count: 18, trend: "+12%" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm">{item.segment}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{item.count}</Badge>
                      <span className="text-xs text-green-600">{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-yellow-700">Moderate Health (60-79)</h4>
              <div className="space-y-2">
                {[
                  { segment: "Declining Engagement", count: 12, trend: "-3%" },
                  { segment: "Feature Explorers", count: 8, trend: "+1%" },
                  { segment: "Support Dependent", count: 15, trend: "0%" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span className="text-sm">{item.segment}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{item.count}</Badge>
                      <span className={`text-xs ${item.trend.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                        {item.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">At Risk (&lt;60)</h4>
              <div className="space-y-2">
                {[
                  { segment: "Inactive Users", count: metrics.criticalRiskCustomers, trend: "-8%", action: "Immediate outreach" },
                  { segment: "Trial Expired", count: 3, trend: "-15%", action: "Conversion campaign" },
                  { segment: "Support Issues", count: 2, trend: "-5%", action: "Priority support" }
                ].map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{item.segment}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">{item.count}</Badge>
                        <span className="text-xs text-red-600">{item.trend}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pl-2">
                      Action: {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Response Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Support Response Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">First Response Time</h4>
              <p className="text-2xl font-bold mt-1">{metrics.firstResponseTime?.toFixed(1) || '0'}h</p>
              <Badge variant={metrics.firstResponseTime <= 2 ? "default" : "secondary"} className="mt-2">
                {metrics.firstResponseTime <= 2 ? "Target Met" : "Needs Improvement"}
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">Avg Resolution Time</h4>
              <p className="text-2xl font-bold mt-1">{metrics.avgResolutionTime?.toFixed(1) || '0'}h</p>
              <Badge variant={metrics.avgResolutionTime <= 24 ? "default" : "secondary"} className="mt-2">
                {metrics.avgResolutionTime <= 24 ? "Target Met" : "Needs Improvement"}
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">Open Tickets</h4>
              <p className="text-2xl font-bold mt-1">{metrics.openTickets}</p>
              <Badge variant={metrics.openTickets <= 5 ? "default" : "destructive"} className="mt-2">
                {metrics.openTickets <= 5 ? "Manageable" : "High Volume"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}