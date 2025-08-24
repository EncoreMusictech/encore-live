import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Star,
  Award,
  Target,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  team_member_name: string;
  department: string;
  role_title: string;
  performance_score: number;
  active_tickets_count: number;
  resolved_tickets_count: number;
  avg_resolution_time_hours: number;
  department_level: number;
  is_team_lead: boolean;
  status: string;
  contact_info: any;
  created_at: string;
}

interface PerformanceMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  benchmark_value: number;
  variance_percentage: number;
  trend_direction: string;
}

export function TeamPerformanceDashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamResponse, metricsResponse] = await Promise.all([
        supabase.from('operations_team_members').select('*').order('performance_score', { ascending: false }),
        supabase.from('performance_metrics').select('*').order('created_at', { ascending: false })
      ]);

      if (teamResponse.data) setTeamMembers(teamResponse.data);
      if (metricsResponse.data) setPerformanceMetrics(metricsResponse.data);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-primary';
    if (score >= 60) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { variant: "default" as const, label: "Excellent" };
    if (score >= 75) return { variant: "secondary" as const, label: "Good" };
    if (score >= 60) return { variant: "outline" as const, label: "Average" };
    return { variant: "destructive" as const, label: "Needs Improvement" };
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-destructive rotate-180" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const departmentStats = teamMembers.reduce((acc, member) => {
    const dept = member.department;
    if (!acc[dept]) {
      acc[dept] = { count: 0, avgScore: 0, totalTickets: 0, avgResolution: 0 };
    }
    acc[dept].count += 1;
    acc[dept].avgScore += member.performance_score;
    acc[dept].totalTickets += member.active_tickets_count;
    acc[dept].avgResolution += member.avg_resolution_time_hours;
    return acc;
  }, {} as Record<string, any>);

  Object.keys(departmentStats).forEach(dept => {
    const stats = departmentStats[dept];
    stats.avgScore = stats.avgScore / stats.count;
    stats.avgResolution = stats.avgResolution / stats.count;
  });

  return (
    <div className="space-y-6">
      {/* Team Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <Badge variant="secondary">{teamMembers.filter(m => m.status === 'active').length}</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">{teamMembers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Team Members</p>
            <p className="text-xs text-muted-foreground">
              {teamMembers.filter(m => m.is_team_lead).length} team leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Award className="h-5 w-5 text-primary" />
              <Badge variant="secondary">
                {Math.round(teamMembers.reduce((sum, m) => sum + m.performance_score, 0) / teamMembers.length)}%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {Math.round(teamMembers.reduce((sum, m) => sum + m.performance_score, 0) / teamMembers.length)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Avg Team Performance</p>
            <Progress 
              value={teamMembers.reduce((sum, m) => sum + m.performance_score, 0) / teamMembers.length} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-primary" />
              <Badge variant="secondary">
                {teamMembers.reduce((sum, m) => sum + m.resolved_tickets_count, 0)}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {teamMembers.reduce((sum, m) => sum + m.resolved_tickets_count, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Tickets Resolved</p>
            <p className="text-xs text-muted-foreground">
              {teamMembers.reduce((sum, m) => sum + m.active_tickets_count, 0)} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-primary" />
              <Badge variant="secondary">
                {Math.round(teamMembers.reduce((sum, m) => sum + m.avg_resolution_time_hours, 0) / teamMembers.length * 10) / 10}h
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {Math.round(teamMembers.reduce((sum, m) => sum + m.avg_resolution_time_hours, 0) / teamMembers.length * 10) / 10}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Avg Resolution Time</p>
            <p className="text-xs text-muted-foreground">
              Team average performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Team Performance Details
          </CardTitle>
          <CardDescription>
            Individual team member performance metrics and workload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => {
              const badge = getPerformanceBadge(member.performance_score);
              return (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {member.team_member_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{member.team_member_name}</h4>
                        {member.is_team_lead && <Badge variant="outline">Team Lead</Badge>}
                        <Badge {...badge}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.role_title} • {member.department} • Level {member.department_level}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{member.active_tickets_count} active tickets</span>
                        <span>{member.resolved_tickets_count} resolved</span>
                        <span>{member.avg_resolution_time_hours.toFixed(1)}h avg resolution</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getPerformanceColor(member.performance_score)}`}>
                      {member.performance_score.toFixed(1)}%
                    </div>
                    <Progress value={member.performance_score} className="w-24 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Department Performance
          </CardTitle>
          <CardDescription>
            Performance breakdown by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(departmentStats).map(([dept, stats]) => (
              <Card key={dept}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{dept}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Team Size:</span>
                    <Badge variant="secondary">{stats.count}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Performance:</span>
                    <span className={`font-semibold ${getPerformanceColor(stats.avgScore)}`}>
                      {stats.avgScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Tickets:</span>
                    <Badge variant="outline">{stats.totalTickets}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Resolution:</span>
                    <span className="text-sm font-medium">{stats.avgResolution.toFixed(1)}h</span>
                  </div>
                  <Progress value={stats.avgScore} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5" />
            Key Performance Indicators
          </CardTitle>
          <CardDescription>
            System and team performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.id} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{metric.metric_name}</h4>
                  {getTrendIcon(metric.trend_direction)}
                </div>
                <div className="text-2xl font-bold">{metric.metric_value}{metric.metric_unit === 'percentage' ? '%' : ''}</div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Benchmark: {metric.benchmark_value}{metric.metric_unit === 'percentage' ? '%' : ''}</span>
                  <Badge variant={metric.variance_percentage > 0 ? "default" : "destructive"} className="text-xs">
                    {metric.variance_percentage > 0 ? '+' : ''}{metric.variance_percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}