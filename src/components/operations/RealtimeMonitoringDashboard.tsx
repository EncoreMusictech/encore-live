import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertManagementCenter } from "./AlertManagementCenter";
import { EnhancedNotificationSystem } from "./EnhancedNotificationSystem";
import { useRealtimeMonitoring } from "@/hooks/useRealtimeMonitoring";
import { 
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export function RealtimeMonitoringDashboard() {
  const { events, loading, error } = useRealtimeMonitoring();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time System Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium">System Status</p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Active Events</p>
                <p className="text-xs text-muted-foreground">{events?.length || 0} monitored</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Warnings</p>
                <p className="text-xs text-muted-foreground">2 require attention</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium">Performance</p>
                <p className="text-xs text-muted-foreground">98.7% uptime</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AlertManagementCenter />
        <EnhancedNotificationSystem />
      </div>
    </div>
  );
}