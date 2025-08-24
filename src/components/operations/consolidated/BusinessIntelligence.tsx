import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Users2, 
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  PiggyBank,
  Package,
  Crown,
  CreditCard,
  BarChart3,
  RefreshCw,
  Calendar,
  UserCheck
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
      {/* Enhanced Business Intelligence Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Management</TabsTrigger>
          <TabsTrigger value="financial">Financial Tracking</TabsTrigger>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          {/* Subscription Management Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Module Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { module: "Catalog Valuation", subscribers: 87, revenue: "$34,800", growth: "+12%" },
                  { module: "Royalties Processing", subscribers: 65, revenue: "$52,000", growth: "+8%" },
                  { module: "Contract Management", subscribers: 42, revenue: "$29,400", growth: "+15%" },
                  { module: "Copyright Module", subscribers: 58, revenue: "$40,600", growth: "+6%" },
                  { module: "Sync Licensing", subscribers: 31, revenue: "$21,700", growth: "+18%" },
                  { module: "Client Dashboard", subscribers: 94, revenue: "$18,800", growth: "+22%" }
                ].map((module, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{module.module}</h4>
                        <Badge variant="secondary" className="text-xs">{module.growth}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subscribers:</span>
                          <span className="font-semibold">{module.subscribers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-semibold text-green-600">{module.revenue}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tiered Package Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Package Tier Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { tier: "Standalone Module", subscribers: 145, avgRevenue: "$89", churn: "2.3%" },
                  { tier: "Essentials", subscribers: 78, avgRevenue: "$199", churn: "1.8%" },
                  { tier: "Publishing", subscribers: 42, avgRevenue: "$399", churn: "1.2%" },
                  { tier: "Licensing", subscribers: 28, avgRevenue: "$599", churn: "0.9%" },
                  { tier: "Enterprise", subscribers: 12, avgRevenue: "$1,299", churn: "0.3%" }
                ].map((tier, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-3">{tier.tier}</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{tier.subscribers}</p>
                          <p className="text-xs text-muted-foreground">Subscribers</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-green-600">{tier.avgRevenue}</p>
                          <p className="text-xs text-muted-foreground">Avg/Month</p>
                        </div>
                        <div>
                          <Badge variant={parseFloat(tier.churn) < 2 ? "default" : "destructive"} className="text-xs">
                            {tier.churn} churn
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enterprise API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Enterprise API & Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { client: "Harmony Records", apiCalls: "1.2M", uptime: "99.9%", status: "Active", integration: "Full Suite" },
                  { client: "Beat Street Publishing", apiCalls: "850K", uptime: "99.8%", status: "Active", integration: "Royalties + Copyright" },
                  { client: "Melody Music Group", apiCalls: "650K", uptime: "99.7%", status: "Active", integration: "Contract Management" },
                  { client: "Rhythm Digital", apiCalls: "420K", uptime: "100%", status: "Testing", integration: "Catalog Valuation" }
                ].map((enterprise, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm">{enterprise.client}</h4>
                      <p className="text-xs text-muted-foreground">{enterprise.integration}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{enterprise.apiCalls}</p>
                      <p className="text-xs text-muted-foreground">API Calls/Month</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-600">{enterprise.uptime}</p>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={enterprise.status === 'Active' ? 'default' : 'secondary'}>
                        {enterprise.status}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Button size="sm" variant="outline">Monitor</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Monthly Revenue Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Revenue by Module (This Month)</h4>
                  {[
                    { module: "Royalties Processing", revenue: 52000, percentage: 28.5, color: "bg-blue-500" },
                    { module: "Catalog Valuation", revenue: 34800, percentage: 19.1, color: "bg-green-500" },
                    { module: "Copyright Module", revenue: 40600, percentage: 22.3, color: "bg-purple-500" },
                    { module: "Contract Management", revenue: 29400, percentage: 16.1, color: "bg-orange-500" },
                    { module: "Sync Licensing", revenue: 21700, percentage: 11.9, color: "bg-pink-500" },
                    { module: "Client Dashboard", revenue: 18800, percentage: 10.3, color: "bg-cyan-500" }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.module}</span>
                        <span className="text-sm font-semibold">${item.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Subscription Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold text-green-600">47</p>
                        <p className="text-xs text-muted-foreground">New Subscriptions</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <RefreshCw className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold text-blue-600">189</p>
                        <p className="text-xs text-muted-foreground">Renewals</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users2 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-2xl font-bold text-purple-600">305</p>
                        <p className="text-xs text-muted-foreground">Total Subscribers</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <p className="text-2xl font-bold text-orange-600">1.4%</p>
                        <p className="text-xs text-muted-foreground">Churn Rate</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance & Forecast Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { metric: "Retention Rate", value: "94.6%", target: "95%", status: "approaching" },
                  { metric: "Churn Rate", value: "1.4%", target: "<2%", status: "good" },
                  { metric: "LTV/CAC Ratio", value: "4.2x", target: "3.5x", status: "excellent" },
                  { metric: "Revenue Growth", value: "+18.3%", target: "+15%", status: "excellent" }
                ].map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold text-sm mb-2">{item.metric}</h4>
                      <p className="text-2xl font-bold mb-1">{item.value}</p>
                      <p className="text-xs text-muted-foreground mb-2">Target: {item.target}</p>
                      <Badge variant={
                        item.status === 'excellent' ? 'default' :
                        item.status === 'good' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {item.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {/* Sales Analytics Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Sales Pipeline Health</h4>
                  {[
                    { stage: "Lead Generated", count: 47, value: "$188K", conversion: "49%" },
                    { stage: "Qualified", count: 23, value: "$138K", conversion: "65%" },
                    { stage: "Demo Scheduled", count: 15, value: "$90K", conversion: "53%" },
                    { stage: "Proposal Sent", count: 8, value: "$48K", conversion: "62%" },
                    { stage: "Negotiating", count: 5, value: "$30K", conversion: "80%" },
                    { stage: "Closed Won", count: 4, value: "$24K", conversion: "100%" }
                  ].map((stage, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{stage.stage}</h5>
                        <p className="text-xs text-muted-foreground">{stage.count} opportunities • {stage.value}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{stage.conversion}</Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Sales Rep Performance</h4>
                  {[
                    { rep: "Sarah Mitchell", deals: 12, revenue: "$48K", target: "125%" },
                    { rep: "Mike Chen", deals: 9, revenue: "$36K", target: "105%" },
                    { rep: "Lisa Rodriguez", deals: 8, revenue: "$32K", target: "98%" },
                    { rep: "Tom Wilson", deals: 6, revenue: "$24K", target: "85%" }
                  ].map((rep, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{rep.rep}</h5>
                        <Badge variant={
                          parseInt(rep.target) >= 120 ? 'default' :
                          parseInt(rep.target) >= 100 ? 'secondary' : 'outline'
                        } className="text-xs">
                          {rep.target}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>{rep.deals} deals</span>
                        <span className="font-semibold">{rep.revenue}</span>
                      </div>
                      <Progress value={Math.min(parseInt(rep.target), 100)} className="h-1" />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Deal Size Analysis</h4>
                  <div className="space-y-3">
                    {[
                      { size: "Enterprise ($10K+)", count: 4, percentage: 15, avgValue: "$18,500" },
                      { size: "Mid-Market ($5K-$10K)", count: 8, percentage: 35, avgValue: "$7,200" },
                      { size: "SMB ($1K-$5K)", count: 12, percentage: 40, avgValue: "$2,800" },
                      { size: "Starter (<$1K)", count: 23, percentage: 10, avgValue: "$450" }
                    ].map((deal, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{deal.size}</span>
                          <span className="text-sm font-semibold">{deal.count} deals</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${deal.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">{deal.percentage}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Avg: {deal.avgValue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}