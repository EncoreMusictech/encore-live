import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Users,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  FileText
} from "lucide-react";

export function StrategicPlanningEngine() {
  const strategicMetrics = {
    planningHorizon: '3-Year Strategic Plan',
    goalCompletionRate: 78,
    budgetUtilization: 84,
    roiProjection: 247,
    riskScore: 23,
    strategicAlignment: 92
  };

  const strategicGoals = [
    {
      goal: 'Expand Global Market Presence',
      category: 'growth',
      priority: 'high',
      progress: 65,
      targetDate: '2025-12-31',
      budget: '$2.4M',
      owner: 'VP Global Operations',
      kpis: ['Market Share +25%', 'New Regions: 4', 'Revenue +40%'],
      status: 'on_track'
    },
    {
      goal: 'Digital Transformation Initiative',
      category: 'technology',
      priority: 'high',
      progress: 82,
      targetDate: '2024-09-30',
      budget: '$1.8M',
      owner: 'CTO',
      kpis: ['Automation +60%', 'Efficiency +35%', 'Cost Reduction -20%'],
      status: 'ahead'
    },
    {
      goal: 'Sustainability & ESG Compliance',
      category: 'sustainability',
      priority: 'medium',
      progress: 45,
      targetDate: '2025-06-30',
      budget: '$900K',
      owner: 'Chief Sustainability Officer',
      kpis: ['Carbon Neutral', 'ESG Score 90+', 'Green Certification'],
      status: 'at_risk'
    },
    {
      goal: 'Talent Development Program',
      category: 'people',
      priority: 'medium',
      progress: 73,
      targetDate: '2024-12-31',
      budget: '$650K',
      owner: 'CHRO',
      kpis: ['Employee Satisfaction 90%', 'Retention +15%', 'Skills Gap -50%'],
      status: 'on_track'
    }
  ];

  const strategicInitiatives = [
    {
      name: 'AI Operations Center Implementation',
      phase: 'Phase 2',
      completion: 67,
      budget: '$450K',
      timeline: '6 months',
      impact: 'High',
      dependencies: 2,
      risks: 'Medium'
    },
    {
      name: 'Customer Experience Transformation',
      phase: 'Phase 1',
      completion: 89,
      budget: '$320K',
      timeline: '4 months',
      impact: 'High',
      dependencies: 1,
      risks: 'Low'
    },
    {
      name: 'Supply Chain Optimization',
      phase: 'Planning',
      completion: 23,
      budget: '$1.2M',
      timeline: '12 months',
      impact: 'Medium',
      dependencies: 4,
      risks: 'High'
    }
  ];

  const scenarioAnalysis = [
    {
      scenario: 'Optimistic Growth',
      probability: 35,
      revenue: '$12.8M',
      costs: '$8.2M',
      roi: '156%',
      description: 'All strategic goals achieved ahead of schedule'
    },
    {
      scenario: 'Base Case',
      probability: 50,
      revenue: '$10.4M',
      costs: '$7.8M',
      roi: '133%',
      description: 'Strategic goals achieved as planned'
    },
    {
      scenario: 'Conservative',
      probability: 15,
      revenue: '$8.9M',
      costs: '$8.1M',
      roi: '110%',
      description: 'Delays in key initiatives, partial goal achievement'
    }
  ];

  const strategicRecommendations = [
    {
      type: 'opportunity',
      title: 'Accelerate AI Integration',
      description: 'Market analysis suggests 6-month advantage possible with increased investment',
      impact: 'Revenue +$2.1M',
      investment: '$450K',
      confidence: 87
    },
    {
      type: 'risk',
      title: 'Supply Chain Dependency Risk',
      description: 'Current vendor concentration poses strategic risk to growth goals',
      impact: 'Potential -15% revenue',
      mitigation: 'Diversify suppliers',
      confidence: 73
    },
    {
      type: 'optimization',
      title: 'Resource Reallocation Opportunity',
      description: 'Shift resources from low-ROI initiatives to high-impact programs',
      impact: 'Efficiency +22%',
      savings: '$280K',
      confidence: 91
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'text-success';
      case 'on_track': return 'text-success';
      case 'at_risk': return 'text-orange-500';
      case 'delayed': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ahead': return 'default';
      case 'on_track': return 'default';
      case 'at_risk': return 'secondary';
      case 'delayed': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      case 'technology': return <Settings className="h-4 w-4" />;
      case 'sustainability': return <Lightbulb className="h-4 w-4" />;
      case 'people': return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="mr-2 h-6 w-6" />
          Strategic Planning Engine
        </CardTitle>
        <CardDescription>
          Long-term strategic planning, goal tracking, and scenario analysis for enterprise growth
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategic Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  {strategicMetrics.goalCompletionRate}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {strategicMetrics.goalCompletionRate}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Goal Completion Rate</p>
              <Progress value={strategicMetrics.goalCompletionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  +{strategicMetrics.roiProjection}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {strategicMetrics.roiProjection}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Projected ROI</p>
              <p className="text-xs text-muted-foreground">
                3-year strategic horizon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <BarChart3 className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  {strategicMetrics.strategicAlignment}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {strategicMetrics.strategicAlignment}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Strategic Alignment</p>
              <Progress value={strategicMetrics.strategicAlignment} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Strategic Goals Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Strategic Goals Dashboard
            </CardTitle>
            <CardDescription>
              Progress tracking and status monitoring for key strategic objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {strategicGoals.map((goal, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(goal.category)}
                      <h4 className="text-sm font-semibold">{goal.goal}</h4>
                      <Badge variant={getPriorityVariant(goal.priority)}>
                        {goal.priority}
                      </Badge>
                      <Badge 
                        variant={getStatusVariant(goal.status)}
                        className={getStatusColor(goal.status)}
                      >
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{goal.budget}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={goal.progress} className="flex-1 h-2" />
                        <span className="text-sm">{goal.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="text-sm font-medium">{goal.owner}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Target Date</p>
                      <p className="text-sm font-medium">{goal.targetDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Key KPIs</p>
                      <p className="text-sm font-medium">{goal.kpis.length} metrics</p>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strategic Initiatives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Strategic Initiatives
            </CardTitle>
            <CardDescription>
              Key initiatives and projects supporting strategic goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategicInitiatives.map((initiative, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{initiative.name}</p>
                      <Badge variant="outline">{initiative.phase}</Badge>
                      <Badge variant={initiative.risks === 'High' ? 'destructive' : 'secondary'}>
                        {initiative.risks} risk
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Budget: {initiative.budget}</span>
                      <span>Timeline: {initiative.timeline}</span>
                      <span>Dependencies: {initiative.dependencies}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={initiative.completion} className="flex-1 h-2" />
                      <span className="text-xs">{initiative.completion}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scenario Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Scenario Analysis
            </CardTitle>
            <CardDescription>
              Financial projections under different strategic execution scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarioAnalysis.map((scenario, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{scenario.scenario}</h4>
                    <Badge variant="outline">{scenario.probability}% likely</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Revenue:</span>
                      <span className="text-sm font-medium text-success">{scenario.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Costs:</span>
                      <span className="text-sm font-medium">{scenario.costs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">ROI:</span>
                      <span className="text-sm font-bold text-success">{scenario.roi}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {scenario.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strategic Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              AI Strategic Recommendations
            </CardTitle>
            <CardDescription>
              Data-driven strategic recommendations and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategicRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {rec.type === 'opportunity' && <CheckCircle className="h-4 w-4 text-success" />}
                      {rec.type === 'risk' && <AlertCircle className="h-4 w-4 text-destructive" />}
                      {rec.type === 'optimization' && <TrendingUp className="h-4 w-4 text-primary" />}
                      <p className="text-sm font-medium">{rec.title}</p>
                      <Badge variant="outline">{rec.confidence}% confidence</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-success font-medium">{rec.impact}</span>
                      {rec.investment && <span>Investment: {rec.investment}</span>}
                      {rec.savings && <span>Savings: {rec.savings}</span>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Implement
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <Calendar className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Update Timeline</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <BarChart3 className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Run Scenario</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <FileText className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Generate Report</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}