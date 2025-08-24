import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useOperationsData } from "@/hooks/useOperationsData";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Zap,
  Heart
} from "lucide-react";

interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'up' | 'down' | 'stable';
  recommendedActions: string[];
}

export function CustomerSuccessIntelligence() {
  const { customerHealth, metrics, loading } = useOperationsData();

  // Generate customer segments based on health data
  const customerSegments: CustomerSegment[] = [
    {
      id: 'champions',
      name: 'Champions',
      count: Math.floor((metrics?.activeCustomers || 0) * 0.25),
      healthScore: 92,
      riskLevel: 'low',
      trend: 'up',
      recommendedActions: ['Leverage for referrals', 'Case study opportunities', 'Beta program invites']
    },
    {
      id: 'at_risk',
      name: 'At Risk',
      count: Math.floor((metrics?.activeCustomers || 0) * 0.15),
      healthScore: 35,
      riskLevel: 'high',
      trend: 'down',
      recommendedActions: ['Immediate outreach', 'Success manager assignment', 'Health check call']
    },
    {
      id: 'growing',
      name: 'Growing',
      count: Math.floor((metrics?.activeCustomers || 0) * 0.35),
      healthScore: 78,
      riskLevel: 'low',
      trend: 'up',
      recommendedActions: ['Upsell opportunities', 'Feature adoption push', 'Training programs']
    },
    {
      id: 'stable',
      name: 'Stable',
      count: Math.floor((metrics?.activeCustomers || 0) * 0.25),
      healthScore: 65,
      riskLevel: 'medium',
      trend: 'stable',
      recommendedActions: ['Regular check-ins', 'Value demonstration', 'Feature education']
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
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
          <h2 className="text-2xl font-bold tracking-tight">Customer Success Intelligence</h2>
          <p className="text-muted-foreground">AI-driven customer health insights and recommendations</p>
        </div>
        <Button className="gap-2">
          <Zap className="h-4 w-4" />
          Run Intelligence Scan
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(metrics?.avgHealthScore || 0)}`}>
              {metrics?.avgHealthScore?.toFixed(0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Average health score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {customerSegments.find(s => s.id === 'at_risk')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Customers need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Champions</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {customerSegments.find(s => s.id === 'champions')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">High-value advocates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Potential</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {customerSegments.find(s => s.id === 'growing')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Expansion opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Segments Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {customerSegments.map((segment, index) => (
              <div key={segment.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{segment.name}</h3>
                      {getTrendIcon(segment.trend)}
                    </div>
                    <Badge variant={getRiskColor(segment.riskLevel) as any}>
                      {segment.riskLevel} risk
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{segment.count} customers</div>
                    <div className={`text-sm ${getHealthScoreColor(segment.healthScore)}`}>
                      {segment.healthScore} health score
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Health Score</span>
                    <span className="text-sm font-medium">{segment.healthScore}</span>
                  </div>
                  <Progress value={segment.healthScore} className="h-2" />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {segment.recommendedActions.map((action, actionIndex) => (
                      <Badge key={actionIndex} variant="outline" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>

                {index < customerSegments.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI-Generated Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-subtle rounded-lg border">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Urgent Action Required</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {customerSegments.find(s => s.id === 'at_risk')?.count || 0} customers showing declining health scores. 
                    Immediate intervention recommended to prevent churn.
                  </p>
                  <Button size="sm" className="mt-3">
                    Create Intervention Campaign
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-subtle rounded-lg border">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <h4 className="font-medium text-success">Expansion Opportunity</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {customerSegments.find(s => s.id === 'growing')?.count || 0} customers showing strong growth patterns. 
                    Perfect candidates for upselling initiatives.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3">
                    Launch Upsell Campaign
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-subtle rounded-lg border">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-primary">Champion Activation</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {customerSegments.find(s => s.id === 'champions')?.count || 0} champion customers identified. 
                    Leverage for testimonials, case studies, and referral programs.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3">
                    Activate Champions Program
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}