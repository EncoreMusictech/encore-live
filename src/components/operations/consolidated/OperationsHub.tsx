import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Users, 
  Server, 
  Workflow,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Headphones,
  UserPlus,
  BookOpen,
  Settings,
  CheckSquare,
  Calendar,
  Target,
  PlayCircle
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
      {/* Enhanced Operations Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="support">Support System</TabsTrigger>
          <TabsTrigger value="onboarding">Client Onboarding</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          {/* Support System Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <Badge variant={metrics.openTickets > 10 ? "destructive" : "secondary"}>Open</Badge>
                </div>
                <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.openTickets}</div>
                <p className="text-xs text-muted-foreground">Total open tickets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <Badge variant="secondary">Response</Badge>
                </div>
                <CardTitle className="text-sm font-medium">First Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.firstResponseTime?.toFixed(1) || '0'}h</div>
                <p className="text-xs text-muted-foreground">Average time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary">Resolution</Badge>
                </div>
                <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgResolutionTime?.toFixed(1) || '0'}h</div>
                <p className="text-xs text-muted-foreground">Time to resolve</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Headphones className="h-5 w-5 text-purple-600" />
                  <Badge variant="secondary">Satisfaction</Badge>
                </div>
                <CardTitle className="text-sm font-medium">CSAT Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.customerSatisfaction?.toFixed(1) || '0'}/5</div>
                <p className="text-xs text-muted-foreground">Customer rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Support Tickets by Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: "TIK-001", subject: "API Integration Issues", priority: "High", status: "In Progress", assignee: "Sarah M.", created: "2 hours ago" },
                  { id: "TIK-002", subject: "Royalty Calculation Error", priority: "High", status: "Open", assignee: "Mike D.", created: "4 hours ago" },
                  { id: "TIK-003", subject: "Dashboard Loading Slow", priority: "Medium", status: "In Progress", assignee: "Lisa K.", created: "1 day ago" },
                  { id: "TIK-004", subject: "Export Feature Request", priority: "Low", status: "Open", assignee: "Tom R.", created: "2 days ago" }
                ].map((ticket, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{ticket.id}</Badge>
                        <Badge variant={
                          ticket.priority === 'High' ? 'destructive' : 
                          ticket.priority === 'Medium' ? 'secondary' : 'outline'
                        }>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm">{ticket.subject}</h4>
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {ticket.assignee} • Created: {ticket.created}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={ticket.status === 'Open' ? 'secondary' : 'default'}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          {/* Client Onboarding Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Client Onboarding Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { stage: "Initial Setup", count: 5, icon: <Settings className="h-4 w-4" />, color: "bg-blue-500" },
                  { stage: "API Configuration", count: 3, icon: <Server className="h-4 w-4" />, color: "bg-orange-500" },
                  { stage: "Training Scheduled", count: 7, icon: <BookOpen className="h-4 w-4" />, color: "bg-purple-500" },
                  { stage: "Documentation Access", count: 12, icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-500" }
                ].map((stage, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-16 h-16 ${stage.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <div className="text-white">{stage.icon}</div>
                    </div>
                    <h4 className="font-semibold text-sm">{stage.stage}</h4>
                    <p className="text-2xl font-bold mt-1">{stage.count}</p>
                    <p className="text-xs text-muted-foreground">Active clients</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Onboarding Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Active Onboarding Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { client: "Harmony Records", progress: 85, stage: "Training & Documentation", nextStep: "Final Review", dueDate: "Nov 5" },
                  { client: "Melody Music Group", progress: 60, stage: "API Setup", nextStep: "Integration Testing", dueDate: "Nov 8" },
                  { client: "Rhythm Publishing", progress: 30, stage: "Initial Configuration", nextStep: "Data Migration", dueDate: "Nov 12" },
                  { client: "Beat Street Studios", progress: 95, stage: "Final Review", nextStep: "Go Live", dueDate: "Nov 3" }
                ].map((onboarding, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{onboarding.client}</h4>
                      <Badge variant={onboarding.progress >= 80 ? "default" : "secondary"}>
                        {onboarding.progress}% Complete
                      </Badge>
                    </div>
                    <Progress value={onboarding.progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Current: {onboarding.stage}</span>
                      <span>Due: {onboarding.dueDate}</span>
                    </div>
                    <p className="text-sm text-primary">Next: {onboarding.nextStep}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Task Management Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Phase-Based Task Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { phase: "Planning & Strategy", count: 8, color: "bg-blue-500" },
                  { phase: "Content Creation", count: 12, color: "bg-purple-500" },
                  { phase: "Outreach & Engagement", count: 15, color: "bg-orange-500" },
                  { phase: "Tracking & Optimization", count: 6, color: "bg-green-500" },
                  { phase: "Final Deliverables", count: 4, color: "bg-gray-500" }
                ].map((phase, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="p-4">
                      <div className={`w-12 h-12 ${phase.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                        <CheckSquare className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-xs mb-1">{phase.phase}</h4>
                      <p className="text-2xl font-bold">{phase.count}</p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle>High Priority Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { task: "Music Tectonics Conference Preparation", phase: "Final Deliverables", assignee: "Marketing Team", deadline: "Nov 1", priority: "High" },
                  { task: "Q4 Revenue Analysis Dashboard", phase: "Tracking & Optimization", assignee: "Finance Team", deadline: "Nov 5", priority: "High" },
                  { task: "Customer Onboarding Automation", phase: "Content Creation", assignee: "Operations Team", deadline: "Nov 8", priority: "Medium" },
                  { task: "API Documentation Update", phase: "Content Creation", assignee: "Tech Team", deadline: "Nov 10", priority: "Medium" },
                  { task: "Partnership Agreement Review", phase: "Planning & Strategy", assignee: "Legal Team", deadline: "Nov 12", priority: "Low" }
                ].map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          task.priority === 'High' ? 'destructive' : 
                          task.priority === 'Medium' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{task.phase}</Badge>
                      </div>
                      <h4 className="font-semibold text-sm">{task.task}</h4>
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {task.assignee} • Due: {task.deadline}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <PlayCircle className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}