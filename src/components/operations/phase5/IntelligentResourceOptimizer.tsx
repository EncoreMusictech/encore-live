import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  Settings,
  BarChart3,
  Activity,
  DollarSign
} from "lucide-react";

export function IntelligentResourceOptimizer() {
  const resourceMetrics = {
    totalCostSavings: 847320,
    optimizationScore: 87,
    autoScalingEvents: 342,
    resourceUtilization: 79,
    predictedSavings: 156000,
    energyEfficiency: 94
  };

  const resourcePools = [
    {
      name: 'Compute Cluster A',
      type: 'compute',
      utilization: 84,
      cost: '$12,450/month',
      recommendation: 'Scale down 2 instances',
      savings: '$1,200',
      status: 'optimized'
    },
    {
      name: 'Storage Pool B',
      type: 'storage',
      utilization: 67,
      cost: '$8,900/month',
      recommendation: 'Compress cold data',
      savings: '$890',
      status: 'needs_attention'
    },
    {
      name: 'Network Bandwidth',
      type: 'network',
      utilization: 45,
      cost: '$4,200/month',
      recommendation: 'Optimize routing',
      savings: '$420',
      status: 'underutilized'
    },
    {
      name: 'Database Cluster',
      type: 'database',
      utilization: 92,
      cost: '$15,600/month',
      recommendation: 'Add read replicas',
      savings: '$0',
      status: 'at_capacity'
    }
  ];

  const optimizationActions = [
    {
      action: 'Auto-scaled compute instances',
      type: 'automatic',
      impact: '+$450 savings',
      timestamp: '5 min ago',
      resources: ['cpu', 'memory']
    },
    {
      action: 'Scheduled storage compression',
      type: 'scheduled',
      impact: '+$200 savings',
      timestamp: '15 min ago',
      resources: ['storage']
    },
    {
      action: 'Load balancer optimization',
      type: 'ai_recommended',
      impact: '+$120 savings',
      timestamp: '32 min ago',
      resources: ['network']
    },
    {
      action: 'Cache tier adjustment',
      type: 'automatic',
      impact: '+$80 efficiency',
      timestamp: '1 hour ago',
      resources: ['memory', 'cpu']
    }
  ];

  const predictiveInsights = [
    {
      metric: 'CPU Demand',
      current: 75,
      predicted: 85,
      timeframe: 'Next 7 days',
      confidence: 94,
      action: 'Prepare scaling'
    },
    {
      metric: 'Storage Growth',
      current: 67,
      predicted: 78,
      timeframe: 'Next 30 days',
      confidence: 89,
      action: 'Provision storage'
    },
    {
      metric: 'Memory Usage',
      current: 82,
      predicted: 72,
      timeframe: 'Next 24 hours',
      confidence: 96,
      action: 'Optimize allocation'
    },
    {
      metric: 'Network Load',
      current: 45,
      predicted: 62,
      timeframe: 'Peak hours',
      confidence: 91,
      action: 'Bandwidth ready'
    }
  ];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'compute': return <Cpu className="h-4 w-4" />;
      case 'storage': return <HardDrive className="h-4 w-4" />;
      case 'network': return <Network className="h-4 w-4" />;
      case 'database': return <MemoryStick className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimized': return 'text-success';
      case 'needs_attention': return 'text-orange-500';
      case 'underutilized': return 'text-blue-500';
      case 'at_capacity': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'optimized': return 'default';
      case 'needs_attention': return 'secondary';
      case 'underutilized': return 'outline';
      case 'at_capacity': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="mr-2 h-6 w-6" />
          Intelligent Resource Optimizer
        </CardTitle>
        <CardDescription>
          AI-driven resource allocation, cost optimization, and performance tuning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Optimization Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  Monthly
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                ${resourceMetrics.totalCostSavings.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Total Cost Savings</p>
              <p className="text-xs text-muted-foreground">
                This month's optimizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  {resourceMetrics.optimizationScore}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {resourceMetrics.optimizationScore}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Optimization Score</p>
              <Progress value={resourceMetrics.optimizationScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Zap className="h-5 w-5 text-primary" />
                <Badge variant="secondary">{resourceMetrics.autoScalingEvents}</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {resourceMetrics.autoScalingEvents}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Auto-scaling Events</p>
              <p className="text-xs text-muted-foreground">
                Today's automated actions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resource Pool Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Resource Pool Analysis
            </CardTitle>
            <CardDescription>
              Current utilization and optimization opportunities across resource pools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resourcePools.map((pool, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(pool.type)}
                      <h4 className="text-sm font-semibold">{pool.name}</h4>
                      <Badge 
                        variant={getStatusVariant(pool.status)}
                        className={getStatusColor(pool.status)}
                      >
                        {pool.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{pool.cost}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Utilization</p>
                      <div className="flex items-center gap-2">
                        <Progress value={pool.utilization} className="flex-1 h-2" />
                        <span className="text-sm">{pool.utilization}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recommendation</p>
                      <p className="text-sm font-medium">{pool.recommendation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Potential Savings</p>
                      <p className="text-sm font-medium text-success">{pool.savings}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3 mr-1" />
                        Optimize
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Predictive Resource Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Predictive Resource Insights
            </CardTitle>
            <CardDescription>
              AI-powered predictions for resource demand and optimization opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictiveInsights.map((insight, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">{insight.metric}</h4>
                    <Badge variant="outline">{insight.confidence}% confidence</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Current</span>
                      <span className="text-sm">{insight.current}%</span>
                    </div>
                    <Progress value={insight.current} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Predicted ({insight.timeframe})</span>
                      <div className="flex items-center gap-1">
                        {insight.predicted > insight.current ? (
                          <TrendingUp className="h-3 w-3 text-orange-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-success" />
                        )}
                        <span className="text-sm">{insight.predicted}%</span>
                      </div>
                    </div>
                    <Progress value={insight.predicted} className="h-2" />
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Recommended Action</span>
                      <Badge variant="secondary" className="text-xs">
                        {insight.action}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Optimization Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Optimization Actions
            </CardTitle>
            <CardDescription>
              Latest automatic and AI-recommended optimizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimizationActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{action.action}</p>
                      <Badge variant={action.type === 'automatic' ? 'default' : 'secondary'}>
                        {action.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Affected: {action.resources.join(', ')} • {action.timestamp}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">{action.impact}</p>
                    <Button variant="outline" size="sm" className="mt-1">
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <Zap className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Run Optimization</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <BarChart3 className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Cost Analysis</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <Settings className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Configure Policies</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}