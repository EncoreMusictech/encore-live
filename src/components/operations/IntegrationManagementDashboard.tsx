import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Plug, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Settings,
  RefreshCw
} from "lucide-react";

export function IntegrationManagementDashboard() {
  const [integrations, setIntegrations] = useState([
    {
      id: '1',
      name: 'Spotify API',
      type: 'Music Streaming',
      status: 'connected',
      last_sync: '5 minutes ago',
      sync_frequency: '15 minutes',
      success_rate: 99.2,
      is_active: true
    },
    {
      id: '2', 
      name: 'DocuSign',
      type: 'Document Signing',
      status: 'connected',
      last_sync: '2 hours ago',
      sync_frequency: '6 hours', 
      success_rate: 97.8,
      is_active: true
    },
    {
      id: '3',
      name: 'Stripe Payments',
      type: 'Payment Processing',
      status: 'error',
      last_sync: '1 day ago',
      sync_frequency: '1 hour',
      success_rate: 89.5,
      is_active: false
    },
    {
      id: '4',
      name: 'OpenAI API',
      type: 'AI Services',
      status: 'syncing',
      last_sync: 'now',
      sync_frequency: '30 minutes',
      success_rate: 95.6,
      is_active: true
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'error':
        return 'destructive';
      case 'syncing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const toggleIntegration = (id: string, active: boolean) => {
    setIntegrations(prev => prev.map(integration =>
      integration.id === id 
        ? { ...integration, is_active: active }
        : integration
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5" />
          Integration Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="text-xl font-bold text-success">
              {integrations.filter(i => i.status === 'connected').length}
            </div>
            <div className="text-xs text-muted-foreground">Connected</div>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <div className="text-xl font-bold text-destructive">
              {integrations.filter(i => i.status === 'error').length}
            </div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-xl font-bold text-primary">
              {integrations.filter(i => i.is_active).length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>

        {/* Integration List */}
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div key={integration.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(integration.status)}
                  <div>
                    <h4 className="font-semibold text-sm">{integration.name}</h4>
                    <p className="text-xs text-muted-foreground">{integration.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                  <Switch
                    checked={integration.is_active}
                    onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="ml-2 font-medium">{integration.last_sync}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="ml-2 font-medium">{integration.sync_frequency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="ml-2 font-medium">{integration.success_rate}%</span>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full" variant="outline">
          <Plug className="mr-2 h-4 w-4" />
          Add New Integration
        </Button>
      </CardContent>
    </Card>
  );
}