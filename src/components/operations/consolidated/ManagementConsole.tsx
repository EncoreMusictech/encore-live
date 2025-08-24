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
  Activity,
  Building2,
  FileText,
  Handshake,
  Globe,
  Music,
  Crown
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

      {/* Enhanced Management Tabs */}
      <Tabs defaultValue="access-control" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="access-control">Access Control</TabsTrigger>
          <TabsTrigger value="partnerships">Industry Partnerships</TabsTrigger>
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

        <TabsContent value="partnerships" className="space-y-4">
          {/* Industry Partnerships Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Industry Partnership Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { type: "PROs", count: 12, active: 10, revenue: "$142K" },
                  { type: "Licensing Agencies", count: 8, active: 7, revenue: "$89K" },
                  { type: "Publishers", count: 25, active: 23, revenue: "$324K" },
                  { type: "Music Communities", count: 15, active: 12, revenue: "$67K" }
                ].map((partnership, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold text-sm mb-2">{partnership.type}</h4>
                      <div className="space-y-1">
                        <p className="text-lg font-bold">{partnership.active}/{partnership.count}</p>
                        <p className="text-xs text-muted-foreground">Active Partnerships</p>
                        <p className="text-sm font-semibold text-green-600">{partnership.revenue}</p>
                        <p className="text-xs text-muted-foreground">Annual Value</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Partnership Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  PROs & Licensing Agencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "ASCAP", type: "PRO", status: "Active", agreement: "Master Agreement", value: "$45K" },
                    { name: "BMI", type: "PRO", status: "Active", agreement: "Publishing Deal", value: "$38K" },
                    { name: "SESAC", type: "PRO", status: "Active", agreement: "Distribution", value: "$32K" },
                    { name: "Harry Fox Agency", type: "Licensing", status: "Active", agreement: "Mechanical Rights", value: "$28K" },
                    { name: "Music Reports", type: "Licensing", status: "Negotiating", agreement: "Data Services", value: "$15K" },
                    { name: "Songtrust", type: "PRO", status: "Active", agreement: "Global Collection", value: "$27K" }
                  ].map((partner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-sm">{partner.name}</h5>
                          <Badge variant="outline" className="text-xs">{partner.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{partner.agreement}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={partner.status === 'Active' ? 'default' : 'secondary'} className="mb-1">
                          {partner.status}
                        </Badge>
                        <p className="text-xs text-green-600 font-semibold">{partner.value}/year</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Publishers & Communities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Universal Music Publishing", type: "Major Publisher", status: "Active", agreement: "Co-Publishing", value: "$89K" },
                    { name: "Sony/ATV Music Publishing", type: "Major Publisher", status: "Active", agreement: "Administration", value: "$76K" },
                    { name: "Warner Chappell", type: "Major Publisher", status: "Negotiating", agreement: "Joint Venture", value: "$65K" },
                    { name: "Independent Music Publishers", type: "Indie Network", status: "Active", agreement: "Collective Agreement", value: "$45K" },
                    { name: "Music Business Registry", type: "Community", status: "Active", agreement: "Data Partnership", value: "$12K" },
                    { name: "AIMP (Association of Independent Music Publishers)", type: "Community", status: "Member", agreement: "Membership", value: "$8K" }
                  ].map((partner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-sm">{partner.name}</h5>
                          <Badge variant="outline" className="text-xs">{partner.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{partner.agreement}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          partner.status === 'Active' ? 'default' :
                          partner.status === 'Member' ? 'secondary' : 'outline'
                        } className="mb-1">
                          {partner.status}
                        </Badge>
                        <p className="text-xs text-green-600 font-semibold">{partner.value}/year</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partnership Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Partnership Performance & Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Performance Metrics</h4>
                  {[
                    { metric: "Total Partnership Value", value: "$622K", change: "+12%" },
                    { metric: "Active Partnerships", value: "52/60", change: "+3" },
                    { metric: "Avg Deal Size", value: "$12K", change: "+8%" },
                    { metric: "Renewal Rate", value: "94%", change: "+2%" }
                  ].map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{metric.metric}</span>
                      <div className="text-right">
                        <Badge variant="secondary">{metric.value}</Badge>
                        <p className="text-xs text-green-600">{metric.change}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Upcoming Renewals</h4>
                  {[
                    { partner: "BMI Agreement", expires: "Dec 15", value: "$38K", priority: "High" },
                    { partner: "Harry Fox Agency", expires: "Jan 30", value: "$28K", priority: "Medium" },
                    { partner: "Songtrust Global", expires: "Feb 15", value: "$27K", priority: "Medium" },
                    { partner: "Music Reports", expires: "Mar 20", value: "$15K", priority: "Low" }
                  ].map((renewal, index) => (
                    <div key={index} className="space-y-1 p-2 border rounded">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{renewal.partner}</h5>
                        <Badge variant={
                          renewal.priority === 'High' ? 'destructive' :
                          renewal.priority === 'Medium' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {renewal.priority}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Expires: {renewal.expires}</span>
                        <span>Value: {renewal.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">New Opportunities</h4>
                  {[
                    { opportunity: "Merlin Network", type: "Digital Rights", potential: "$45K", stage: "Initial Contact" },
                    { opportunity: "CD Baby Publishing", type: "Distribution", potential: "$32K", stage: "Proposal Sent" },
                    { opportunity: "Kobalt Music Group", type: "Administration", potential: "$67K", stage: "Negotiating" },
                    { opportunity: "Downtown Music", type: "Co-Publishing", potential: "$89K", stage: "Due Diligence" }
                  ].map((opp, index) => (
                    <div key={index} className="space-y-1 p-2 bg-blue-50 rounded">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{opp.opportunity}</h5>
                        <Badge variant="outline" className="text-xs">{opp.stage}</Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{opp.type}</span>
                        <span className="font-semibold text-green-600">{opp.potential}</span>
                      </div>
                    </div>
                  ))}
                </div>
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