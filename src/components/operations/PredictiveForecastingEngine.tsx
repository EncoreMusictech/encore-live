import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap
} from "lucide-react";

export function PredictiveForecastingEngine() {
  const forecasts = {
    revenue: {
      current: 2450000,
      forecast_30d: 2680000,
      forecast_90d: 3100000,
      confidence: 87,
      trend: 'up',
      factors: ['Customer acquisition', 'Module adoption', 'Seasonal trends']
    },
    churn: {
      current: 2.3,
      forecast_30d: 1.8,
      forecast_90d: 2.1,
      confidence: 92,
      trend: 'down',
      factors: ['Improved onboarding', 'Feature releases', 'Support quality']
    },
    growth: {
      current: 156,
      forecast_30d: 180,
      forecast_90d: 210,
      confidence: 79,
      trend: 'up',
      factors: ['Marketing campaigns', 'Product launches', 'Market expansion']
    }
  };

  const aiInsights = [
    {
      type: 'opportunity',
      title: 'Revenue Acceleration',
      description: 'Contract management module adoption drives 34% higher customer LTV',
      probability: 89,
      impact: '$420K projected increase',
      timeframe: '3 months'
    },
    {
      type: 'risk',
      title: 'Churn Risk Pattern',
      description: 'Customers with <3 module usage show 67% higher churn probability',
      probability: 76,
      impact: '12 customers at risk',
      timeframe: '30 days'
    },
    {
      type: 'trend',
      title: 'Market Expansion',
      description: 'European market showing 45% adoption rate increase',
      probability: 82,
      impact: '+67 potential customers',
      timeframe: '6 months'
    }
  ];

  const scenarios = [
    {
      name: 'Conservative Growth',
      probability: 78,
      revenue_impact: '+12%',
      customer_impact: '+156 customers',
      description: 'Steady growth with current strategies'
    },
    {
      name: 'Aggressive Expansion', 
      probability: 45,
      revenue_impact: '+34%',
      customer_impact: '+420 customers',
      description: 'International expansion with increased marketing'
    },
    {
      name: 'Market Downturn',
      probability: 23,
      revenue_impact: '-8%',
      customer_impact: '-89 customers',
      description: 'Economic challenges affecting growth'
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'trend': return <Target className="h-4 w-4 text-primary" />;
      default: return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'default';
      case 'risk': return 'destructive';
      case 'trend': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Predictive Forecasting Engine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="forecasts">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="forecasts" className="space-y-4">
            {/* Key Forecasts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Revenue</span>
                  </div>
                  <Badge variant={forecasts.revenue.trend === 'up' ? 'default' : 'destructive'}>
                    {forecasts.revenue.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {((forecasts.revenue.forecast_90d - forecasts.revenue.current) / forecasts.revenue.current * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">
                    ${(forecasts.revenue.forecast_90d / 1000000).toFixed(1)}M
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>90-day forecast</span>
                      <span>{forecasts.revenue.confidence}% confidence</span>
                    </div>
                    <Progress value={forecasts.revenue.confidence} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Key factors: {forecasts.revenue.factors.slice(0, 2).join(', ')}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Churn Rate</span>
                  </div>
                  <Badge variant={forecasts.churn.trend === 'down' ? 'default' : 'destructive'}>
                    {forecasts.churn.trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                    {Math.abs(forecasts.churn.forecast_90d - forecasts.churn.current).toFixed(1)}%
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">
                    {forecasts.churn.forecast_90d}%
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>90-day forecast</span>
                      <span>{forecasts.churn.confidence}% confidence</span>
                    </div>
                    <Progress value={forecasts.churn.confidence} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Key factors: {forecasts.churn.factors.slice(0, 2).join(', ')}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    <span className="font-semibold">New Customers</span>
                  </div>
                  <Badge variant={forecasts.growth.trend === 'up' ? 'default' : 'destructive'}>
                    {forecasts.growth.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    +{((forecasts.growth.forecast_90d - forecasts.growth.current) / forecasts.growth.current * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">
                    {forecasts.growth.forecast_90d}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>90-day forecast</span>
                      <span>{forecasts.growth.confidence}% confidence</span>
                    </div>
                    <Progress value={forecasts.growth.confidence} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Key factors: {forecasts.growth.factors.slice(0, 2).join(', ')}
                  </div>
                </div>
              </Card>
            </div>

            {/* Forecast Timeline */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Forecast Timeline</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-center text-sm font-medium text-muted-foreground">
                  <span>Metric</span>
                  <span>Current</span>
                  <span>30 Days</span>
                  <span>90 Days</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <span className="font-medium">Revenue</span>
                  <span>${(forecasts.revenue.current / 1000000).toFixed(1)}M</span>
                  <span>${(forecasts.revenue.forecast_30d / 1000000).toFixed(1)}M</span>
                  <span className="font-bold">${(forecasts.revenue.forecast_90d / 1000000).toFixed(1)}M</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <span className="font-medium">Churn Rate</span>
                  <span>{forecasts.churn.current}%</span>
                  <span>{forecasts.churn.forecast_30d}%</span>
                  <span className="font-bold">{forecasts.churn.forecast_90d}%</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <span className="font-medium">New Customers</span>
                  <span>{forecasts.growth.current}</span>
                  <span>{forecasts.growth.forecast_30d}</span>
                  <span className="font-bold">{forecasts.growth.forecast_90d}</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {aiInsights.map((insight, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent rounded-lg">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                      </div>
                      <Badge variant={getInsightColor(insight.type)}>
                        {insight.probability}% likely
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Expected Impact:</span>
                        <span className="ml-2 font-medium">{insight.impact}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timeframe:</span>
                        <span className="ml-2 font-medium">{insight.timeframe}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Calendar className="mr-2 h-3 w-3" />
                        Create Action Plan
                      </Button>
                      <Button size="sm" variant="ghost">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{scenario.name}</h4>
                      <Badge variant={scenario.probability > 60 ? 'default' : 'secondary'}>
                        {scenario.probability}%
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {scenario.description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Revenue Impact:</span>
                        <span className={`font-medium ${
                          scenario.revenue_impact.startsWith('+') ? 'text-success' : 'text-destructive'
                        }`}>
                          {scenario.revenue_impact}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Impact:</span>
                        <span className={`font-medium ${
                          scenario.customer_impact.startsWith('+') ? 'text-success' : 'text-destructive'
                        }`}>
                          {scenario.customer_impact}
                        </span>
                      </div>
                    </div>

                    <Progress value={scenario.probability} />
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Scenario Planning</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered scenario analysis based on historical data and market trends
                  </p>
                </div>
                <Button>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Advanced Analysis
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}