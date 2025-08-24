import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Globe, 
  MapPin, 
  Users, 
  Server,
  Clock,
  TrendingUp,
  AlertTriangle,
  Shield,
  Wifi,
  Database,
  Zap
} from "lucide-react";

export function GlobalOperationsManager() {
  const globalMetrics = {
    totalRegions: 12,
    healthyRegions: 10,
    degradedRegions: 2,
    totalUsers: 47823,
    crossRegionLatency: 89,
    globalDataSync: 99.8,
    multiTenantCompliance: 98.5
  };

  const regionDetails = [
    { 
      region: 'North America',
      zones: ['us-east-1', 'us-west-2', 'ca-central-1'],
      users: 18420,
      load: 67,
      latency: 45,
      status: 'healthy',
      compliance: 'SOC2, HIPAA'
    },
    {
      region: 'Europe',
      zones: ['eu-west-1', 'eu-central-1', 'eu-north-1'],
      users: 15280,
      load: 89,
      latency: 52,
      status: 'degraded',
      compliance: 'GDPR, ISO27001'
    },
    {
      region: 'Asia Pacific',
      zones: ['ap-southeast-1', 'ap-northeast-1', 'ap-south-1'],
      users: 9840,
      load: 34,
      latency: 78,
      status: 'healthy',
      compliance: 'SOC2'
    },
    {
      region: 'Latin America',
      zones: ['sa-east-1'],
      users: 4283,
      load: 23,
      latency: 95,
      status: 'healthy',
      compliance: 'SOC2'
    }
  ];

  const crossRegionOperations = [
    { operation: 'Global user session failover', status: 'active', regions: 3, latency: '45ms' },
    { operation: 'Multi-region data replication', status: 'syncing', regions: 12, latency: '120ms' },
    { operation: 'Load balancing optimization', status: 'completed', regions: 8, latency: '23ms' },
    { operation: 'Compliance audit sync', status: 'scheduled', regions: 5, latency: 'N/A' },
  ];

  const tenantDistribution = [
    { tier: 'Enterprise', tenants: 847, revenue: '$2.4M', regions: 12 },
    { tier: 'Professional', tenants: 3240, revenue: '$890K', regions: 8 },
    { tier: 'Standard', tenants: 8950, revenue: '$450K', regions: 6 },
    { tier: 'Basic', tenants: 15680, revenue: '$180K', regions: 3 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-orange-500';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'critical': return 'destructive';
      case 'active': return 'default';
      case 'syncing': return 'secondary';
      case 'completed': return 'outline';
      case 'scheduled': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="mr-2 h-6 w-6" />
          Global Operations Manager
        </CardTitle>
        <CardDescription>
          Multi-region deployment management and global infrastructure coordination
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <MapPin className="h-5 w-5 text-primary" />
                <Badge variant="secondary">
                  {globalMetrics.healthyRegions}/{globalMetrics.totalRegions}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {globalMetrics.totalRegions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Active Regions</p>
              <p className="text-xs text-muted-foreground">
                {globalMetrics.healthyRegions} healthy, {globalMetrics.degradedRegions} degraded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">Global</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {globalMetrics.totalUsers.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Global Users</p>
              <p className="text-xs text-muted-foreground">
                Across all regions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-primary" />
                <Badge variant="secondary">{globalMetrics.crossRegionLatency}ms</Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {globalMetrics.crossRegionLatency}ms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Cross-Region Latency</p>
              <p className="text-xs text-muted-foreground">
                Average inter-region
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Database className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-success">
                  {globalMetrics.globalDataSync}%
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold">
                {globalMetrics.globalDataSync}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Data Sync Rate</p>
              <Progress value={globalMetrics.globalDataSync} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Regional Status Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Regional Status Dashboard
            </CardTitle>
            <CardDescription>
              Detailed status and metrics for each global region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regionDetails.map((region, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{region.region}</h4>
                      <Badge 
                        variant={getStatusVariant(region.status)}
                        className={getStatusColor(region.status)}
                      >
                        {region.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{region.compliance}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Zones</p>
                      <p className="text-sm font-medium">{region.zones.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Active Users</p>
                      <p className="text-sm font-medium">{region.users.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Load</p>
                      <div className="flex items-center gap-2">
                        <Progress value={region.load} className="flex-1 h-2" />
                        <span className="text-sm">{region.load}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Latency</p>
                      <p className="text-sm font-medium">{region.latency}ms</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cross-Region Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="mr-2 h-5 w-5" />
              Cross-Region Operations
            </CardTitle>
            <CardDescription>
              Global operations requiring coordination across multiple regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crossRegionOperations.map((operation, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{operation.operation}</p>
                    <p className="text-xs text-muted-foreground">
                      {operation.regions} regions involved
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant={getStatusVariant(operation.status)}>
                        {operation.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Latency: {operation.latency}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Monitor
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Tenant Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Multi-Tenant Distribution
            </CardTitle>
            <CardDescription>
              Tenant distribution across service tiers and regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenantDistribution.map((tier, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{tier.tier}</Badge>
                    <div>
                      <p className="text-sm font-medium">{tier.tenants.toLocaleString()} tenants</p>
                      <p className="text-xs text-muted-foreground">
                        {tier.regions} regions available
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">{tier.revenue}</p>
                    <p className="text-xs text-muted-foreground">Monthly revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Global Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <Zap className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Global Failover</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <Shield className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Compliance Audit</div>
            </div>
          </Button>
          <Button variant="outline" className="h-16">
            <div className="text-center">
              <Database className="mx-auto h-5 w-5 mb-1" />
              <div className="text-sm">Data Migration</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}