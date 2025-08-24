import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart,
  Users,
  AlertTriangle,
  TrendingUp,
  Star,
  UserCheck,
  UserX,
  Clock,
  Target,
  Building,
  Calendar,
  Phone,
  Mail,
  Globe,
  Presentation,
  MessageCircle,
  BarChart3,
  Megaphone
} from "lucide-react";

interface CustomerExperienceProps {
  metrics: any;
  aiInsights: any[];
}

export function CustomerExperience({ metrics, aiInsights }: CustomerExperienceProps) {
  const healthScoreColor = metrics.avgHealthScore >= 80 ? "text-green-600" :
                          metrics.avgHealthScore >= 60 ? "text-yellow-600" : "text-red-600";

  const satisfactionColor = metrics.customerSatisfaction >= 4.0 ? "text-green-600" :
                           metrics.customerSatisfaction >= 3.5 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Enhanced Customer Experience Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Lead Management</TabsTrigger>
          <TabsTrigger value="sales">Sales & Demos</TabsTrigger>
          <TabsTrigger value="marketing">Marketing & Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
      {/* Customer Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Heart className="h-5 w-5 text-green-600" />
              <Badge variant="secondary">Health</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Average Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={healthScoreColor}>{metrics.avgHealthScore}/100</span>
            </div>
            <p className="text-xs text-muted-foreground">Across all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <Badge variant={metrics.criticalRiskCustomers > 0 ? "destructive" : "secondary"}>
                {metrics.criticalRiskCustomers > 0 ? "Action Required" : "Good"}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium">At-Risk Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalRiskCustomers}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary">Retention</Badge>
            </div>
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{metrics.retentionRate?.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Churn rate: {metrics.churnRate?.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Star className="h-5 w-5 text-yellow-500" />
              <Badge variant={metrics.customerSatisfaction >= 4.0 ? "default" : "secondary"}>
                {metrics.customerSatisfaction >= 4.0 ? "Excellent" : "Good"}
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={satisfactionColor}>{metrics.customerSatisfaction?.toFixed(1)}/5.0</span>
            </div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Success Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Success Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights
              .filter(insight => insight.role.includes('customer-success') || insight.role.includes('admin'))
              .slice(0, 3)
              .map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 rounded-lg border-l-4 border-l-primary bg-primary/5">
                  <div className="flex-shrink-0 mt-1">
                    {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {insight.type === 'action_required' && <UserX className="h-5 w-5 text-red-500" />}
                    {insight.type === 'success' && <UserCheck className="h-5 w-5 text-green-500" />}
                    {insight.type === 'opportunity' && <TrendingUp className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                    {insight.suggestedAction && (
                      <div className="mt-3 p-3 bg-white/80 rounded-md border">
                        <p className="text-sm text-primary font-medium">
                          🎯 Suggested Action: {insight.suggestedAction}
                        </p>
                      </div>
                    )}
                  </div>
                  <Badge variant={
                    insight.priority === 'high' ? 'destructive' : 
                    insight.priority === 'medium' ? 'secondary' : 'outline'
                  }>
                    {insight.priority}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Cohort Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Healthy Customers (80-100)</h4>
              <div className="space-y-2">
                {[
                  { segment: "Power Users", count: 23, trend: "+5%" },
                  { segment: "Regular Users", count: 45, trend: "+2%" },
                  { segment: "New Adopters", count: 18, trend: "+12%" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm">{item.segment}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{item.count}</Badge>
                      <span className="text-xs text-green-600">{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-yellow-700">Moderate Health (60-79)</h4>
              <div className="space-y-2">
                {[
                  { segment: "Declining Engagement", count: 12, trend: "-3%" },
                  { segment: "Feature Explorers", count: 8, trend: "+1%" },
                  { segment: "Support Dependent", count: 15, trend: "0%" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span className="text-sm">{item.segment}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{item.count}</Badge>
                      <span className={`text-xs ${item.trend.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                        {item.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">At Risk (&lt;60)</h4>
              <div className="space-y-2">
                {[
                  { segment: "Inactive Users", count: metrics.criticalRiskCustomers, trend: "-8%", action: "Immediate outreach" },
                  { segment: "Trial Expired", count: 3, trend: "-15%", action: "Conversion campaign" },
                  { segment: "Support Issues", count: 2, trend: "-5%", action: "Priority support" }
                ].map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{item.segment}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">{item.count}</Badge>
                        <span className="text-xs text-red-600">{item.trend}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pl-2">
                      Action: {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Response Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Support Response Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">First Response Time</h4>
              <p className="text-2xl font-bold mt-1">{metrics.firstResponseTime?.toFixed(1) || '0'}h</p>
              <Badge variant={metrics.firstResponseTime <= 2 ? "default" : "secondary"} className="mt-2">
                {metrics.firstResponseTime <= 2 ? "Target Met" : "Needs Improvement"}
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">Avg Resolution Time</h4>
              <p className="text-2xl font-bold mt-1">{metrics.avgResolutionTime?.toFixed(1) || '0'}h</p>
              <Badge variant={metrics.avgResolutionTime <= 24 ? "default" : "secondary"} className="mt-2">
                {metrics.avgResolutionTime <= 24 ? "Target Met" : "Needs Improvement"}
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">Open Tickets</h4>
              <p className="text-2xl font-bold mt-1">{metrics.openTickets}</p>
              <Badge variant={metrics.openTickets <= 5 ? "default" : "destructive"} className="mt-2">
                {metrics.openTickets <= 5 ? "Manageable" : "High Volume"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {/* Lead Management Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Target className="h-5 w-5 text-blue-600" />
                  <Badge variant="secondary">New</Badge>
                </div>
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary">Qualified</Badge>
                </div>
                <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">Ready for demo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  <Badge variant="secondary">Converted</Badge>
                </div>
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <Badge variant="secondary">Rate</Badge>
                </div>
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">34.8%</div>
                <p className="text-xs text-muted-foreground">+5.2% vs last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Lead Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Lead Pipeline & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    company: "Melody Music Group", 
                    contact: "Sarah Johnson", 
                    role: "VP of Operations", 
                    source: "LinkedIn", 
                    interests: "Copyright Management, Royalty Processing", 
                    stage: "Qualified",
                    score: 85 
                  },
                  { 
                    company: "Harmony Records", 
                    contact: "Mike Chen", 
                    role: "CEO", 
                    source: "Webinar", 
                    interests: "Full Suite, API Integration", 
                    stage: "Demo Scheduled",
                    score: 92 
                  },
                  { 
                    company: "Beat Street Publishing", 
                    contact: "Lisa Rodriguez", 
                    role: "COO", 
                    source: "Referral", 
                    interests: "Contract Management", 
                    stage: "Proposal Sent",
                    score: 78 
                  },
                  { 
                    company: "Rhythm Digital", 
                    contact: "Tom Wilson", 
                    role: "Manager", 
                    source: "Website", 
                    interests: "Catalog Valuation", 
                    stage: "Initial Contact",
                    score: 65 
                  }
                ].map((lead, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-semibold text-sm">{lead.company}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{lead.contact} - {lead.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Source</p>
                      <Badge variant="outline" className="text-xs">{lead.source}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Interests</p>
                      <p className="text-xs">{lead.interests}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Stage</p>
                      <Badge variant={
                        lead.stage === 'Demo Scheduled' ? 'default' :
                        lead.stage === 'Qualified' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {lead.stage}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={lead.score} className="h-2 w-16" />
                        <span className="text-xs font-semibold">{lead.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {/* Sales & Demo Process Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="h-5 w-5" />
                Demo & Sales Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Scheduled Demos</h4>
                  {[
                    { type: "Product Demo", client: "Melody Music", date: "Nov 2", time: "2:00 PM", rep: "Sarah M." },
                    { type: "Webinar", client: "Group Session", date: "Nov 5", time: "11:00 AM", rep: "Mike D." },
                    { type: "Product Demo", client: "Beat Street", date: "Nov 8", time: "3:30 PM", rep: "Lisa K." },
                    { type: "Follow-up", client: "Harmony Records", date: "Nov 10", time: "1:00 PM", rep: "Tom R." }
                  ].map((demo, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={demo.type === 'Webinar' ? 'default' : 'secondary'} className="text-xs">
                            {demo.type}
                          </Badge>
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{demo.date}</span>
                        </div>
                        <h5 className="font-medium text-sm">{demo.client}</h5>
                        <p className="text-xs text-muted-foreground">{demo.time} • Rep: {demo.rep}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Follow-up Required</h4>
                  {[
                    { client: "Rhythm Digital", lastContact: "3 days ago", priority: "High", notes: "Interested in enterprise plan" },
                    { client: "Sound Labs", lastContact: "1 week ago", priority: "Medium", notes: "Evaluating competitors" },
                    { client: "Mix Master Inc", lastContact: "5 days ago", priority: "High", notes: "Budget approved, needs proposal" },
                    { client: "Track Records", lastContact: "2 weeks ago", priority: "Low", notes: "Still in evaluation phase" }
                  ].map((followup, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{followup.client}</h5>
                        <Badge variant={
                          followup.priority === 'High' ? 'destructive' :
                          followup.priority === 'Medium' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {followup.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Last contact: {followup.lastContact}</p>
                      <p className="text-xs">{followup.notes}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Sales Performance</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">Demos This Month</span>
                      <Badge variant="secondary">28</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">Conversion Rate</span>
                      <Badge variant="secondary">34.8%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm">Avg Deal Size</span>
                      <Badge variant="secondary">$4,200</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span className="text-sm">Sales Cycle</span>
                      <Badge variant="secondary">23 days</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          {/* Marketing & Engagement Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Marketing Campaign Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Active Campaigns</h4>
                  {[
                    { 
                      name: "Music Tectonics Conference", 
                      channels: ["LinkedIn", "Email"], 
                      status: "Active", 
                      engagement: 847, 
                      leads: 23, 
                      budget: "$5,000" 
                    },
                    { 
                      name: "Q4 Product Launch", 
                      channels: ["Webinar", "Substack"], 
                      status: "Planning", 
                      engagement: 234, 
                      leads: 8, 
                      budget: "$3,200" 
                    },
                    { 
                      name: "Enterprise Outreach", 
                      channels: ["LinkedIn", "Events"], 
                      status: "Active", 
                      engagement: 612, 
                      leads: 15, 
                      budget: "$4,500" 
                    }
                  ].map((campaign, index) => (
                    <div key={index} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-sm">{campaign.name}</h5>
                        <Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {campaign.channels.map((channel, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{channel}</Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Engagement</p>
                          <p className="font-semibold text-sm">{campaign.engagement}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Leads</p>
                          <p className="font-semibold text-sm">{campaign.leads}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="font-semibold text-sm">{campaign.budget}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Engagement Metrics</h4>
                  <div className="space-y-3">
                    {[
                      { channel: "LinkedIn", posts: 24, engagement: "15.2%", clicks: 342, leads: 18 },
                      { channel: "Webinars", sessions: 3, attendance: "78%", registrations: 156, conversions: 12 },
                      { channel: "Substack", newsletters: 8, openRate: "42.3%", subscribers: 1247, growth: "+85" },
                      { channel: "Events", conferences: 2, meetings: 23, followUps: 15, deals: 3 }
                    ].map((metric, index) => (
                      <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-sm">{metric.channel}</h5>
                          <Badge variant="outline" className="text-xs">Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(metric).slice(1).map(([key, value], i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-semibold">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Marketing Calendar & Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { event: "Music Tectonics Conference", date: "Nov 1-3", type: "Conference", status: "Confirmed", prep: "90%" },
                  { event: "Webinar: Music IP Valuation", date: "Nov 8", type: "Webinar", status: "Promoted", prep: "75%" },
                  { event: "Industry Partnership Meet", date: "Nov 15", type: "Meeting", status: "Scheduled", prep: "45%" },
                  { event: "Q4 Product Showcase", date: "Nov 22", type: "Demo", status: "Planning", prep: "30%" },
                  { event: "Year-End Report Release", date: "Dec 5", type: "Content", status: "In Progress", prep: "60%" },
                  { event: "Holiday Campaign Launch", date: "Dec 10", type: "Campaign", status: "Planning", prep: "25%" }
                ].map((event, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        event.type === 'Conference' ? 'default' :
                        event.type === 'Webinar' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{event.date}</span>
                    </div>
                    <h5 className="font-semibold text-sm">{event.event}</h5>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{event.status}</Badge>
                      <span className="text-xs text-green-600">{event.prep} ready</span>
                    </div>
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