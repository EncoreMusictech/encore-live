import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Users, 
  TrendingUp,
  DollarSign,
  Calendar
} from "lucide-react";
import { ExecutiveDashboard } from "../ExecutiveDashboard";

interface SalesTabProps {
  metrics: any;
}

export function SalesTab({ metrics }: SalesTabProps) {
  return (
    <div className="space-y-6">
      {/* Sales Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-success">+23%</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">$124K</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Sales Target</p>
            <p className="text-xs text-muted-foreground">
              78% of monthly goal achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Active</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">47</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Active Leads</p>
            <p className="text-xs text-muted-foreground">
              In sales pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Rate</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">34%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Conversion Rate</p>
            <p className="text-xs text-muted-foreground">
              Lead to customer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Days</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">23</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Avg Sales Cycle</p>
            <p className="text-xs text-muted-foreground">
              Days to close
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>
            Current opportunities and deal stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { stage: 'Prospecting', deals: 12, value: '$45K', color: 'bg-blue-500' },
              { stage: 'Qualification', deals: 8, value: '$67K', color: 'bg-yellow-500' },
              { stage: 'Proposal', deals: 5, value: '$89K', color: 'bg-orange-500' },
              { stage: 'Negotiation', deals: 3, value: '$112K', color: 'bg-red-500' },
              { stage: 'Closed Won', deals: 15, value: '$234K', color: 'bg-green-500' },
            ].map((stage) => (
              <div key={stage.stage} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <div>
                    <p className="text-sm font-medium">{stage.stage}</p>
                    <p className="text-xs text-muted-foreground">{stage.deals} deals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{stage.value}</p>
                  <p className="text-xs text-muted-foreground">Pipeline value</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Executive Dashboard */}
      <ExecutiveDashboard />
    </div>
  );
}