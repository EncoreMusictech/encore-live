import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle,
  TrendingDown,
  Target,
  Users,
  AlertTriangle,
  Activity,
  DollarSign,
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';

interface SupportTabProps {
  supportTickets: any[];
  metrics: any;
}

export function EnhancedSupportTab({ supportTickets, metrics }: SupportTabProps) {
  
  const ticketTrends = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        tickets: 0,
        resolved: 0,
        critical: 0,
        avgResolution: 0
      };
    });

    supportTickets.forEach(ticket => {
      const ticketDate = new Date(ticket.created_at).toISOString().split('T')[0];
      const dayData = last30Days.find(day => day.date === ticketDate);
      
      if (dayData) {
        dayData.tickets++;
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
          dayData.resolved++;
          if (ticket.resolution_time_hours) {
            dayData.avgResolution += ticket.resolution_time_hours;
          }
        }
        if (ticket.priority_level === 'urgent' || ticket.priority_level === 'high') {
          dayData.critical++;
        }
      }
    });

    return last30Days.map(day => ({
      ...day,
      avgResolution: day.resolved > 0 ? day.avgResolution / day.resolved : 0,
      resolutionRate: day.tickets > 0 ? (day.resolved / day.tickets) * 100 : 0
    }));
  }, [supportTickets]);

  const systemHealthImpact = useMemo(() => {
    // Calculate revenue impact of support issues
    const criticalIssues = supportTickets.filter(t => 
      t.priority_level === 'urgent' && 
      t.status !== 'resolved' && 
      t.status !== 'closed'
    );

    const systemDowntimeHours = criticalIssues.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at);
      const now = new Date();
      const hoursOpen = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + Math.min(hoursOpen, 24); // Cap at 24 hours per ticket
    }, 0);

    // Estimate revenue impact (assuming $1000/hour impact for critical issues)
    const revenueAtRisk = systemDowntimeHours * 1000;
    const uptime = Math.max(0, 100 - (systemDowntimeHours / 24) * 100);

    return {
      criticalIssues: criticalIssues.length,
      systemDowntime: systemDowntimeHours,
      revenueAtRisk,
      uptimePercentage: uptime,
      mttr: metrics.avgResolutionTime // Mean Time To Resolution
    };
  }, [supportTickets, metrics]);

  const categorizedTickets = useMemo(() => {
    const categories = supportTickets.reduce((acc, ticket) => {
      const category = ticket.ticket_category || 'General';
      if (!acc[category]) {
        acc[category] = {
          name: category,
          total: 0,
          resolved: 0,
          avgResolution: 0,
          satisfaction: 0,
          resolutionTimes: []
        };
      }
      
      acc[category].total++;
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        acc[category].resolved++;
        if (ticket.resolution_time_hours) {
          acc[category].resolutionTimes.push(ticket.resolution_time_hours);
        }
      }
      if (ticket.customer_satisfaction_score) {
        acc[category].satisfaction += ticket.customer_satisfaction_score;
      }
      
      return acc;
    }, {} as any);

    return Object.values(categories).map((cat: any) => ({
      ...cat,
      resolutionRate: cat.total > 0 ? (cat.resolved / cat.total) * 100 : 0,
      avgResolution: cat.resolutionTimes.length > 0 
        ? cat.resolutionTimes.reduce((sum: number, time: number) => sum + time, 0) / cat.resolutionTimes.length 
        : 0,
      avgSatisfaction: cat.resolved > 0 ? cat.satisfaction / cat.resolved : 0
    }));
  }, [supportTickets]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">Day {label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.name.includes('Rate') || entry.name.includes('%') 
                  ? `${entry.value.toFixed(1)}%` 
                  : entry.value.toFixed(1)}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* System Health & Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-success" />
              <Badge 
                variant={systemHealthImpact.uptimePercentage >= 99 ? "default" : "destructive"}
                className={systemHealthImpact.uptimePercentage >= 99 ? "text-success" : ""}
              >
                {systemHealthImpact.uptimePercentage.toFixed(2)}%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-success">
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">24h Rolling Average</p>
            <div className="mt-2">
              <Progress value={systemHealthImpact.uptimePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <Badge variant="destructive">
                {systemHealthImpact.criticalIssues}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.openTickets}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Open Tickets</p>
            <p className="text-xs text-muted-foreground">
              {systemHealthImpact.criticalIssues} critical issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-primary" />
              <Badge variant="secondary">
                {systemHealthImpact.mttr.toFixed(1)}h
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              MTTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Mean Time To Resolution</p>
            <p className="text-xs text-muted-foreground">
              Target: &lt;4h for critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-destructive" />
              <Badge 
                variant={systemHealthImpact.revenueAtRisk > 5000 ? "destructive" : "secondary"}
              >
                Risk Level
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              ${(systemHealthImpact.revenueAtRisk / 1000).toFixed(0)}K
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Revenue at Risk</p>
            <p className="text-xs text-muted-foreground">
              From open critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Trends & Resolution Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Support Ticket Trends (30 Days)
          </CardTitle>
          <CardDescription>
            Daily ticket volume, resolution rates, and critical issue tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ticketTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Area
                  type="monotone"
                  dataKey="tickets"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  name="Total Tickets"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stackId="2"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success) / 0.2)"
                  name="Resolved Tickets"
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  stackId="3"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive) / 0.2)"
                  name="Critical Issues"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Support Category Performance
          </CardTitle>
          <CardDescription>
            Resolution rates and satisfaction scores by ticket category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categorizedTickets.map((category, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{category.name}</h4>
                  <Badge variant="outline">
                    {category.total} tickets
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Resolution Rate:</span>
                    <span className="font-medium text-success">
                      {category.resolutionRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={category.resolutionRate} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Avg Resolution Time:</span>
                    <span className="font-medium">
                      {category.avgResolution.toFixed(1)}h
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Satisfaction Score:</span>
                    <span className="font-medium">
                      {category.avgSatisfaction.toFixed(1)}/5
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Details
                  </Button>
                  {category.resolutionRate < 80 && (
                    <Button size="sm" variant="destructive" className="flex-1">
                      Escalate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Alert Panel */}
      {systemHealthImpact.criticalIssues > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Critical Issues Requiring Immediate Attention
            </CardTitle>
            <CardDescription>
              {systemHealthImpact.criticalIssues} critical issues are impacting system performance and revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div>
                  <p className="font-medium">Revenue Impact Assessment</p>
                  <p className="text-sm text-muted-foreground">
                    ${(systemHealthImpact.revenueAtRisk / 1000).toFixed(0)}K at risk from {systemHealthImpact.systemDowntime.toFixed(1)} hours of critical issues
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Emergency Response
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Users className="mr-2 h-4 w-4" />
                  Escalate to Engineering
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Customer Communication
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Activity className="mr-2 h-4 w-4" />
                  System Health Check
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Resolution Rate Trend
          </CardTitle>
          <CardDescription>
            30-day resolution performance and efficiency trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ticketTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Line 
                  type="monotone" 
                  dataKey="resolutionRate" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                  name="Resolution Rate %"
                />
                <Line 
                  type="monotone" 
                  dataKey="avgResolution" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                  name="Avg Resolution Time (h)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}