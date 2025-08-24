import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Command, 
  Globe, 
  Zap, 
  Shield, 
  TrendingUp,
  AlertOctagon,
  Activity,
  Users,
  Server,
  Database,
  Network,
  Cpu
} from "lucide-react";

export function EnterpriseCommandCenter() {
  const systemMetrics = {
    globalUptime: 99.97,
    activeRegions: 12,
    totalTransactions: 2847293,
    responseTime: 145,
    dataProcessed: 847.2,
    activeUsers: 15842,
    systemLoad: 67,
    storageUtilization: 73
  };

  const criticalAlerts = [
    { id: 1, type: 'critical', message: 'Database connection timeout in EU-West-1', timestamp: '2 min ago' },
    { id: 2, type: 'warning', message: 'High memory usage in processing cluster', timestamp: '5 min ago' },
    { id: 3, type: 'info', message: 'Scaling triggered for increased load', timestamp: '8 min ago' },
  ];

  const regionalStatus = [
    { region: 'US-East-1', status: 'healthy', load: 45, users: 4200 },
    { region: 'US-West-2', status: 'healthy', load: 62, users: 3800 },
    { region: 'EU-West-1', status: 'degraded', load: 89, users: 2900 },
    { region: 'AP-Southeast-1', status: 'healthy', load: 34, users: 2100 },
    { region: 'EU-Central-1', status: 'healthy', load: 56, users: 2842 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-orange-500';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Command className="mr-2 h-6 w-6" />
          Enterprise Command Center
        </CardTitle>
        <CardDescription>
          Real-time global operations monitoring and control
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Activity className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  {systemMetrics.globalUptime}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {systemMetrics.globalUptime}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Global Uptime</p>
              <Progress value={systemMetrics.globalUptime} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Globe className="h-5 w-5 text-primary" />
                <Badge variant="secondary">Active</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {systemMetrics.activeRegions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Active Regions</p>
              <p className="text-xs text-muted-foreground">
                Worldwide deployment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Zap className="h-5 w-5 text-primary" />
                <Badge variant="secondary">{systemMetrics.responseTime}ms</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {systemMetrics.responseTime}ms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Avg Response Time</p>
              <p className="text-xs text-muted-foreground">
                Global average latency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">Live</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {systemMetrics.activeUsers.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Active Users</p>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{systemMetrics.systemLoad}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2">System Load</p>
              <Progress value={systemMetrics.systemLoad} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{systemMetrics.storageUtilization}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2">Storage Utilization</p>
              <Progress value={systemMetrics.storageUtilization} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Network className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{systemMetrics.dataProcessed} TB</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2">Data Processed Today</p>
              <div className="text-xs text-muted-foreground">
                Network throughput optimal
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regional Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Regional Status Overview
            </CardTitle>
            <CardDescription>
              Real-time status across all deployment regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regionalStatus.map((region) => (
                <div key={region.region} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{region.region}</p>
                      <p className="text-xs text-muted-foreground">
                        {region.users.toLocaleString()} active users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm">Load: {region.load}%</p>
                      <Progress value={region.load} className="w-16 h-2" />
                    </div>
                    <Badge 
                      variant={region.status === 'healthy' ? 'default' : 'destructive'}
                      className={getStatusColor(region.status)}
                    >
                      {region.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertOctagon className="mr-2 h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Recent critical system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getAlertVariant(alert.type)}>
                        {alert.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Investigate
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
              <Shield className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Security Scan</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <TrendingUp className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Performance Report</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <Command className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">System Diagnostics</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}