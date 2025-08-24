import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity, 
  RefreshCw,
  Settings,
  Zap
} from "lucide-react";
import { TeamPerformanceDashboard } from "../TeamPerformanceDashboard";
import { WorkflowAutomationPanel } from "../WorkflowAutomationPanel";
import { RealtimeMonitoringDashboard } from "../RealtimeMonitoringDashboard";
import { AdvancedAutomationDashboard } from "../AdvancedAutomationDashboard";
import { AIOperationsAssistant } from "../AIOperationsAssistant";
import { AdvancedWorkflowOrchestrator } from "../AdvancedWorkflowOrchestrator";

interface OperationsTabProps {
  metrics: any;
  refreshData: () => void;
}

export function OperationsTab({ metrics, refreshData }: OperationsTabProps) {
  return (
    <div className="space-y-6">
      {/* Operations Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Total</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.totalCustomers.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Active Users</p>
            <p className="text-xs text-muted-foreground">
              {metrics.activeCustomers} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Health</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {(metrics.avgHealthScore * 100).toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">System Health</p>
            <p className="text-xs text-muted-foreground">
              Overall platform status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Settings className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Active</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">24</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Active Workflows</p>
            <p className="text-xs text-muted-foreground">
              Automated processes running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Performance</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">99.8%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Uptime</p>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>
            Team member performance and workload management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamPerformanceDashboard />
        </CardContent>
      </Card>

      {/* Workflow Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Automation</CardTitle>
            <CardDescription>
              Automated business processes and triggers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowAutomationPanel />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Automation</CardTitle>
            <CardDescription>
              Complex workflow orchestration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedAutomationDashboard />
          </CardContent>
        </Card>
      </div>

      {/* Real-time Monitoring */}
      <RealtimeMonitoringDashboard />

      {/* AI Operations Assistant */}
      <AIOperationsAssistant />

      {/* Advanced Workflow Orchestrator */}
      <AdvancedWorkflowOrchestrator />
    </div>
  );
}