import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Ticket, 
  Clock, 
  AlertCircle,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import { SupportTicketsTable } from "../SupportTicketsTable";
import { AlertManagementCenter } from "../AlertManagementCenter";
import { EnhancedNotificationSystem } from "../EnhancedNotificationSystem";

interface SupportTabProps {
  metrics: any;
  supportTickets: any[];
}

export function SupportTab({ metrics, supportTickets }: SupportTabProps) {
  return (
    <div className="space-y-6">
      {/* Support Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Ticket className="h-5 w-5 text-primary" />
              <Badge variant={metrics.openTickets > 10 ? "destructive" : "secondary"}>
                Open
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.openTickets}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Open Tickets</p>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-primary" />
              <Badge variant="secondary">
                {metrics.avgResolutionTime.toFixed(1)}h
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {metrics.avgResolutionTime.toFixed(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Avg Resolution Time</p>
            <p className="text-xs text-muted-foreground">
              Hours to resolve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-5 w-5 text-primary" />
              <Badge variant="destructive">High</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Critical Issues</p>
            <p className="text-xs text-muted-foreground">
              Urgent attention needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-success">98%</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">98%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Resolution Rate</p>
            <p className="text-xs text-muted-foreground">
              First contact resolution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Recent Support Tickets
          </CardTitle>
          <CardDescription>
            Latest support requests and resolution status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupportTicketsTable tickets={supportTickets.slice(0, 10)} />
        </CardContent>
      </Card>

      {/* Alert Management */}
      <AlertManagementCenter />

      {/* Enhanced Notifications */}
      <EnhancedNotificationSystem />
    </div>
  );
}