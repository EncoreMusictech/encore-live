import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Megaphone,
  Users,
  Mail,
  BarChart3,
  Calendar,
  Target,
  Plus,
  Play,
  Pause,
  Edit,
  Eye,
  TrendingUp,
  Clock
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'announcement' | 'onboarding' | 'retention' | 'feature';
  status: 'draft' | 'active' | 'paused' | 'completed';
  audience: string;
  audienceSize: number;
  startDate: string;
  endDate: string;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  budget: number;
  spent: number;
}

export function CampaignManagement() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'New Feature Announcement - Catalog Valuation v2.0',
      description: 'Announce the enhanced catalog valuation features with AI-powered insights',
      type: 'announcement',
      status: 'active',
      audience: 'All Active Users',
      audienceSize: 2847,
      startDate: '2024-01-10',
      endDate: '2024-01-24',
      metrics: {
        sent: 2847,
        delivered: 2798,
        opened: 1203,
        clicked: 324,
        converted: 67
      },
      budget: 5000,
      spent: 1250
    },
    {
      id: '2',
      name: 'Customer Onboarding Series - Music Publishers',
      description: 'Educational email series for new music publisher subscribers',
      type: 'onboarding',
      status: 'active',
      audience: 'New Publishers (Last 30 days)',
      audienceSize: 156,
      startDate: '2024-01-01',
      endDate: '2024-02-29',
      metrics: {
        sent: 468,
        delivered: 462,
        opened: 298,
        clicked: 156,
        converted: 89
      },
      budget: 2000,
      spent: 450
    },
    {
      id: '3',
      name: 'Subscription Renewal Reminder Campaign',
      description: 'Targeted campaign for users with expiring subscriptions',
      type: 'retention',
      status: 'draft',
      audience: 'Expiring Subscriptions (Next 30 days)',
      audienceSize: 234,
      startDate: '2024-01-20',
      endDate: '2024-02-20',
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0
      },
      budget: 1500,
      spent: 0
    },
    {
      id: '4',
      name: 'Holiday Music Industry Report',
      description: 'Quarterly industry insights and trends report for Q4 2023',
      type: 'email',
      status: 'completed',
      audience: 'All Subscribers',
      audienceSize: 3245,
      startDate: '2023-12-15',
      endDate: '2023-12-22',
      metrics: {
        sent: 3245,
        delivered: 3198,
        opened: 1876,
        clicked: 542,
        converted: 0
      },
      budget: 3000,
      spent: 2850
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'paused': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'announcement': return Megaphone;
      case 'onboarding': return Users;
      case 'retention': return Target;
      case 'feature': return TrendingUp;
      default: return Mail;
    }
  };

  const calculateConversionRate = (metrics: Campaign['metrics']) => {
    if (metrics.sent === 0) return 0;
    return ((metrics.converted / metrics.sent) * 100).toFixed(1);
  };

  const calculateOpenRate = (metrics: Campaign['metrics']) => {
    if (metrics.delivered === 0) return 0;
    return ((metrics.opened / metrics.delivered) * 100).toFixed(1);
  };

  const calculateClickRate = (metrics: Campaign['metrics']) => {
    if (metrics.opened === 0) return 0;
    return ((metrics.clicked / metrics.opened) * 100).toFixed(1);
  };

  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                Create and manage marketing campaigns, announcements, and customer communications
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Campaign Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{campaigns.length}</div>
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{activeCampaigns}</div>
              <div className="text-sm text-muted-foreground">Active Campaigns</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">${totalBudget.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {((totalSpent / totalBudget) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Budget Used</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList>
            <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="audiences">Audience Segments</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid gap-4">
              {campaigns.map(campaign => {
                const TypeIcon = getTypeIcon(campaign.type);
                const openRate = calculateOpenRate(campaign.metrics);
                const clickRate = calculateClickRate(campaign.metrics);
                const conversionRate = calculateConversionRate(campaign.metrics);

                return (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <TypeIcon className="h-5 w-5 text-primary mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-lg mb-1">{campaign.name}</h4>
                            <p className="text-muted-foreground text-sm mb-2">{campaign.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{campaign.audienceSize.toLocaleString()} recipients</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{campaign.startDate} - {campaign.endDate}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="secondary">{campaign.type}</Badge>
                        </div>
                      </div>

                      {/* Campaign Metrics */}
                      {campaign.metrics.sent > 0 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold">{campaign.metrics.sent.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Sent</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold text-green-600">{openRate}%</div>
                              <div className="text-xs text-muted-foreground">Open Rate</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold text-blue-600">{clickRate}%</div>
                              <div className="text-xs text-muted-foreground">Click Rate</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold text-purple-600">{conversionRate}%</div>
                              <div className="text-xs text-muted-foreground">Conversion</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold text-orange-600">
                                ${campaign.spent.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">Spent</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Budget Progress</span>
                              <span>${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                            </div>
                            <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {campaign.status === 'active' ? (
                          <Button variant="outline" size="sm">
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        ) : campaign.status === 'paused' ? (
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        ) : campaign.status === 'draft' ? (
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Launch
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Email Templates</h3>
              <p className="text-muted-foreground mb-4">
                Create and manage reusable email templates for campaigns
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="audiences">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Audience Segments</h3>
              <p className="text-muted-foreground mb-4">
                Define and manage customer segments for targeted campaigns
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Performance Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Detailed analytics and insights across all campaigns
              </p>
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}