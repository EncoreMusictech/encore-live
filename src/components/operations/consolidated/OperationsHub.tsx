import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  Server, 
  Workflow,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare
} from "lucide-react";
import { AIOperationsAssistant } from "../AIOperationsAssistant";

interface OperationsHubProps {
  metrics: any;
  aiInsights: any[];
}

export function OperationsHub({ metrics, aiInsights }: OperationsHubProps) {
  const systemHealthColor = metrics.systemUptime > 99.5 ? "text-green-600" : 
                           metrics.systemUptime > 99 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Key Operations Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Live</Badge>
            </div>
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={systemHealthColor}>{metrics.systemUptime}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Workflow className="h-5 w-5 text-blue-600" />
              <Badge variant="outline">{metrics.activeWorkflows}</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">Automated processes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <Badge variant={metrics.openTickets > 10 ? "destructive" : "secondary"}>
                {metrics.openTickets}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium">Open Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Avg resolution: {metrics.avgResolutionTime}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-green-600" />
              <Badge variant="secondary">Total</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              of {metrics.totalCustomers} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights for Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Operations Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights
              .filter(insight => insight.role.includes('operations') || insight.role.includes('admin'))
              .slice(0, 3)
              .map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {insight.type === 'action_required' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {insight.type === 'opportunity' && <Clock className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                    {insight.suggestedAction && (
                      <p className="text-sm text-primary mt-1">
                        💡 {insight.suggestedAction}
                      </p>
                    )}
                  </div>
                  <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                    {insight.priority}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Automation Control */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Automation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Active Automations</h4>
              {[
                { name: "Customer Onboarding", status: "Active", processed: 45 },
                { name: "Invoice Generation", status: "Active", processed: 128 },
                { name: "Support Escalation", status: "Active", processed: 12 },
                { name: "Health Score Monitoring", status: "Active", processed: 89 }
              ].map((workflow, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{workflow.name}</span>
                  </div>
                  <Badge variant="secondary">{workflow.processed} processed</Badge>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">System Health Checks</h4>
              {[
                { check: "Database Performance", status: "Healthy", value: "< 100ms" },
                { check: "API Response Time", status: "Healthy", value: "< 500ms" },
                { check: "Error Rate", status: "Healthy", value: "< 0.1%" },
                { check: "Queue Processing", status: "Healthy", value: "Real-time" }
              ].map((check, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <Server className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{check.check}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{check.status}</Badge>
                    <p className="text-xs text-muted-foreground">{check.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Operations Assistant */}
      <AIOperationsAssistant />
    </div>
  );
}