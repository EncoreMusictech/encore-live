import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield,
  Users,
  Settings,
  BarChart3,
  CheckSquare,
  Workflow,
  UserCog,
  Activity
} from "lucide-react";

interface ManagementConsoleProps {
  metrics: any;
}

export function ManagementConsole({ metrics }: ManagementConsoleProps) {
  return (
    <div className="space-y-6">
      {/* Management Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Shield className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary">Access</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">With system access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CheckSquare className="h-5 w-5 text-green-600" />
              <Badge variant="secondary">Tasks</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Workflow className="h-5 w-5 text-purple-600" />
              <Badge variant="secondary">Automation</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">Running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-orange-600" />
              <Badge variant="secondary">Health</Badge>
            </div>
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">{metrics.systemUptime}% uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Simplified Management Tabs */}
      <Tabs defaultValue="access-control" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="access-control">Access Control</TabsTrigger>
          <TabsTrigger value="task-management">Task Management</TabsTrigger>
          <TabsTrigger value="user-analytics">User Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="access-control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Permissions Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { role: "Admin", users: 2, permissions: "Full Access", modules: "All Modules" },
                  { role: "Operations", users: 3, permissions: "Operations Management", modules: "Operations, Support" },
                  { role: "Customer Success", users: 4, permissions: "Customer Data", modules: "Customer Success, Support" },
                  { role: "Financial", users: 2, permissions: "Financial Data", modules: "Financial, Reporting" },
                  { role: "Client", users: metrics.totalCustomers - 11, permissions: "Read Only", modules: "Portal Access" }
                ].map((role, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold text-sm">{role.role}</h4>
                        <p className="text-xs text-muted-foreground">{role.permissions}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{role.users} users</Badge>
                      <p className="text-xs text-muted-foreground">{role.modules}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="task-management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Unified Task & Campaign Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Active Tasks</h4>
                  {[
                    { task: "Q4 Financial Review", assignee: "Finance Team", due: "Nov 15", priority: "High" },
                    { task: "Customer Onboarding Automation", assignee: "Operations", due: "Nov 8", priority: "Medium" },
                    { task: "Support Process Optimization", assignee: "Support Team", due: "Nov 12", priority: "Medium" },
                    { task: "Revenue Target Analysis", assignee: "Sales Team", due: "Nov 1", priority: "High" }
                  ].map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{task.task}</h5>
                        <p className="text-xs text-muted-foreground">
                          Assigned to: {task.assignee} • Due: {task.due}
                        </p>
                      </div>
                      <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Growth Campaigns</h4>
                  {[
                    { campaign: "Music Tectonics Conference", status: "Active", progress: "85%" },
                    { campaign: "Q4 Customer Retention", status: "Planning", progress: "25%" },
                    { campaign: "Enterprise Outreach", status: "Active", progress: "60%" },
                    { campaign: "Product Feature Launch", status: "Scheduled", progress: "90%" }
                  ].map((campaign, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{campaign.campaign}</h5>
                        <Badge variant="outline">{campaign.status}</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: campaign.progress }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">Progress: {campaign.progress}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Customer Intelligence Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">User Behavior Patterns</h4>
                  {[
                    { behavior: "Daily Active Users", value: metrics.activeCustomers, change: "+5.2%" },
                    { behavior: "Weekly Retention", value: "87%", change: "+2.1%" },
                    { behavior: "Feature Adoption", value: "73%", change: "+8.3%" },
                    { behavior: "Session Duration", value: "24 min", change: "+12%" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{item.behavior}</span>
                      <div className="text-right">
                        <Badge variant="secondary">{item.value}</Badge>
                        <p className="text-xs text-green-600">{item.change}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Customer Segments</h4>
                  {[
                    { segment: "Enterprise Clients", count: 8, revenue: "$180K" },
                    { segment: "Mid-Market", count: 23, revenue: "$95K" },
                    { segment: "Small Business", count: 45, revenue: "$48K" },
                    { segment: "Individual Artists", count: 78, revenue: "$21K" }
                  ].map((segment, index) => (
                    <div key={index} className="space-y-1 p-2 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{segment.segment}</span>
                        <Badge variant="outline">{segment.count} users</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Annual Revenue: {segment.revenue}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Module Usage</h4>
                  {[
                    { module: "Copyright Management", usage: "92%", trend: "↑" },
                    { module: "Royalty Processing", usage: "78%", trend: "↑" },
                    { module: "Contract Management", usage: "65%", trend: "↓" },
                    { module: "Deal Simulation", usage: "43%", trend: "↑" }
                  ].map((module, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{module.module}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{module.usage}</Badge>
                        <span className={`text-sm ${module.trend === '↑' ? 'text-green-600' : 'text-red-600'}`}>
                          {module.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}