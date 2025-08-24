import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Play, 
  Pause, 
  Settings,
  TrendingUp,
  Clock
} from "lucide-react";

export function AdvancedAutomationDashboard() {
  const automationRules = [
    {
      id: '1',
      name: 'Auto-assign Support Tickets',
      status: 'active',
      executions: 247,
      success_rate: 98.5,
      last_run: '2 minutes ago'
    },
    {
      id: '2', 
      name: 'Customer Health Monitoring',
      status: 'active',
      executions: 156,
      success_rate: 100,
      last_run: '5 minutes ago'
    },
    {
      id: '3',
      name: 'Revenue Alert System', 
      status: 'paused',
      executions: 89,
      success_rate: 95.2,
      last_run: '1 hour ago'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Advanced Automation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-xs text-muted-foreground">Active Rules</div>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="text-2xl font-bold text-success">98.2%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Automation Rules */}
        <div className="space-y-3">
          {automationRules.map((rule) => (
            <div key={rule.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{rule.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                    {rule.status}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    {rule.status === 'active' ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Success Rate</span>
                  <span>{rule.success_rate}%</span>
                </div>
                <Progress value={rule.success_rate} className="h-2" />
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{rule.executions} executions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{rule.last_run}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full" variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Manage Automation Rules
        </Button>
      </CardContent>
    </Card>
  );
}