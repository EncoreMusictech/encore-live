import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  AlertTriangle,
  Clock,
  Target,
  Activity
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkflowRule {
  id: string;
  rule_name: string;
  trigger_type: string;
  trigger_conditions: any;
  actions: any;
  is_active: boolean;
  priority: number;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
}

export function WorkflowAutomationPanel() {
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflowRules();
  }, []);

  const fetchWorkflowRules = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_automation_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setWorkflowRules(data || []);
    } catch (error) {
      console.error('Error fetching workflow rules:', error);
      toast.error('Failed to load workflow rules');
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('workflow_automation_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;
      
      setWorkflowRules(rules => 
        rules.map(rule => 
          rule.id === ruleId ? { ...rule, is_active: isActive } : rule
        )
      );
      
      toast.success(`Rule ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule status');
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'customer_health_change': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'ticket_created': return <Settings className="h-4 w-4 text-blue-500" />;
      case 'revenue_event': return <Target className="h-4 w-4 text-green-500" />;
      case 'time_based': return <Clock className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'customer_health_change': return 'Health Change';
      case 'ticket_created': return 'Ticket Created';
      case 'revenue_event': return 'Revenue Event';
      case 'time_based': return 'Time Based';
      default: return 'Manual';
    }
  };

  const formatLastExecution = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Workflow Automation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeRules = workflowRules.filter(rule => rule.is_active).length;
  const totalExecutions = workflowRules.reduce((sum, rule) => sum + rule.execution_count, 0);

  return (
    <div className="space-y-6">
      {/* Automation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-primary" />
              <Badge variant="secondary">{activeRules}</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">{activeRules}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Active Rules</p>
            <p className="text-xs text-muted-foreground">
              {workflowRules.length} total rules configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Play className="h-5 w-5 text-primary" />
              <Badge variant="secondary">{totalExecutions}</Badge>
            </div>
            <CardTitle className="text-2xl font-bold">{totalExecutions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Total Executions</p>
            <p className="text-xs text-muted-foreground">
              Across all rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-primary" />
              <Badge variant="default">
                {workflowRules.length > 0 ? Math.round((activeRules / workflowRules.length) * 100) : 0}%
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold">
              {workflowRules.length > 0 ? Math.round((activeRules / workflowRules.length) * 100) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Automation Rate</p>
            <p className="text-xs text-muted-foreground">
              Rules currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Rules Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Automation Rules
              </CardTitle>
              <CardDescription>
                Manage automated workflows and business process triggers
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Zap className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowRules.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Automation Rules</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first automation rule to streamline operations
                </p>
                <Button>
                  <Zap className="mr-2 h-4 w-4" />
                  Create First Rule
                </Button>
              </div>
            ) : (
              workflowRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTriggerIcon(rule.trigger_type)}
                      <div>
                        <h4 className="font-semibold">{rule.rule_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getTriggerTypeLabel(rule.trigger_type)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Priority {rule.priority}
                          </Badge>
                          {rule.execution_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {rule.execution_count} executions
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Last run: {formatLastExecution(rule.last_executed_at)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                      />
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Quick Setup
          </CardTitle>
          <CardDescription>
            Common automation templates for your operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col items-start">
              <div className="flex items-center w-full mb-2">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span className="font-semibold">Customer Health Alert</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Automatically notify team when customer health score drops
              </p>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col items-start">
              <div className="flex items-center w-full mb-2">
                <Settings className="mr-2 h-4 w-4" />
                <span className="font-semibold">Support Escalation</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Auto-escalate urgent tickets to senior team members
              </p>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col items-start">
              <div className="flex items-center w-full mb-2">
                <Target className="mr-2 h-4 w-4" />
                <span className="font-semibold">Revenue Milestone</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Celebrate and track revenue achievements automatically
              </p>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex-col items-start">
              <div className="flex items-center w-full mb-2">
                <Clock className="mr-2 h-4 w-4" />
                <span className="font-semibold">Daily Reports</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Schedule automated daily operation summaries
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}