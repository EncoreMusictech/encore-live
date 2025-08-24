import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  Plus,
  Edit,
  BarChart3,
  Zap,
  Building2,
  Music,
  Globe,
  Clock
} from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  customerCount: number;
  totalValue: number;
  avgValue: number;
  growthRate: number;
  churnRate: number;
  color: string;
  industry: string;
  engagementScore: number;
}

interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  industry: string;
  value: number;
  monthlyUsage: number;
  lastLogin: string;
  subscriptionTier: string;
  segments: string[];
  riskScore: number;
}

export function ClientSegmentation() {
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  const segments: Segment[] = [
    {
      id: 'high_value_publishers',
      name: 'High-Value Music Publishers',
      description: 'Large music publishing companies with extensive catalogs',
      criteria: ['Revenue > $10k/month', 'Catalog size > 1000 works', 'Industry: Music Publishing'],
      customerCount: 47,
      totalValue: 2350000,
      avgValue: 50000,
      growthRate: 23.5,
      churnRate: 3.2,
      color: 'bg-purple-500',
      industry: 'Music Publishing',
      engagementScore: 87
    },
    {
      id: 'independent_artists',
      name: 'Independent Artists',
      description: 'Solo artists and small collectives managing their own catalogs',
      criteria: ['Revenue < $2k/month', 'Catalog size < 100 works', 'Self-managed'],
      customerCount: 1240,
      totalValue: 890000,
      avgValue: 718,
      growthRate: 45.2,
      churnRate: 12.8,
      color: 'bg-green-500',
      industry: 'Independent Artists',
      engagementScore: 65
    },
    {
      id: 'record_labels',
      name: 'Record Labels',
      description: 'Record labels managing artist catalogs and master recordings',
      criteria: ['Multiple artists', 'Master rights focus', 'Industry: Record Label'],
      customerCount: 89,
      totalValue: 1450000,
      avgValue: 16292,
      growthRate: 18.7,
      churnRate: 8.1,
      color: 'bg-blue-500',
      industry: 'Record Labels',
      engagementScore: 78
    },
    {
      id: 'sync_agencies',
      name: 'Sync & Licensing Agencies',
      description: 'Agencies focused on synchronization and licensing opportunities',
      criteria: ['High sync activity', 'Multiple clients', 'Licensing focus'],
      customerCount: 156,
      totalValue: 780000,
      avgValue: 5000,
      growthRate: 67.3,
      churnRate: 6.4,
      color: 'bg-orange-500',
      industry: 'Sync & Licensing',
      engagementScore: 92
    },
    {
      id: 'at_risk',
      name: 'At-Risk Customers',
      description: 'Customers showing signs of disengagement or potential churn',
      criteria: ['Low usage last 30 days', 'Overdue payments', 'Support tickets'],
      customerCount: 78,
      totalValue: 234000,
      avgValue: 3000,
      growthRate: -15.2,
      churnRate: 45.6,
      color: 'bg-red-500',
      industry: 'Mixed',
      engagementScore: 31
    }
  ];

  const customers: Customer[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      company: 'Harmonic Music Publishing',
      email: 'sarah@harmonicmusic.com',
      industry: 'Music Publishing',
      value: 75000,
      monthlyUsage: 450,
      lastLogin: '2024-01-13',
      subscriptionTier: 'Enterprise',
      segments: ['high_value_publishers'],
      riskScore: 15
    },
    {
      id: '2',
      name: 'Alex Rivera',
      company: 'Independent Artist',
      email: 'alex@alexrivera.music',
      industry: 'Independent Artists',
      value: 890,
      monthlyUsage: 125,
      lastLogin: '2024-01-12',
      subscriptionTier: 'Pro',
      segments: ['independent_artists'],
      riskScore: 25
    },
    {
      id: '3',
      name: 'Michael Chen',
      company: 'Sunset Records',
      email: 'mike@sunsetrecords.com',
      industry: 'Record Labels',
      value: 28000,
      monthlyUsage: 890,
      lastLogin: '2024-01-11',
      subscriptionTier: 'Enterprise',
      segments: ['record_labels'],
      riskScore: 8
    }
  ];

  const getSegmentCustomers = (segmentId: string) => {
    if (segmentId === 'all') return customers;
    return customers.filter(c => c.segments.includes(segmentId));
  };

  const totalCustomers = segments.reduce((sum, s) => sum + s.customerCount, 0);
  const totalValue = segments.reduce((sum, s) => sum + s.totalValue, 0);
  const avgGrowthRate = segments.reduce((sum, s) => sum + s.growthRate, 0) / segments.length;
  const avgEngagement = segments.reduce((sum, s) => sum + s.engagementScore, 0) / segments.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Client Segmentation</CardTitle>
              <CardDescription>
                Analyze customer segments and optimize engagement strategies by industry and behavior
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Custom Filters
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Segment
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Segmentation Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalCustomers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">${(totalValue / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{avgGrowthRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Growth Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{avgEngagement.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Avg Engagement</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="segments" className="w-full">
          <TabsList>
            <TabsTrigger value="segments">Segment Overview</TabsTrigger>
            <TabsTrigger value="customers">Customer Analysis</TabsTrigger>
            <TabsTrigger value="trends">Growth Trends</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="space-y-4">
            <div className="grid gap-4">
              {segments.map(segment => (
                <Card key={segment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-4 h-16 rounded ${segment.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{segment.name}</h4>
                            <Badge variant="secondary">{segment.industry}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{segment.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {segment.criteria.map(criteria => (
                              <Badge key={criteria} variant="outline" className="text-xs">
                                {criteria}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">{segment.customerCount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Customers</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">${segment.avgValue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Avg Value</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className={`text-lg font-semibold ${segment.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {segment.growthRate > 0 ? '+' : ''}{segment.growthRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Growth</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">{segment.engagementScore}</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold text-red-600">{segment.churnRate}%</div>
                        <div className="text-xs text-muted-foreground">Churn Rate</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Engagement Score</span>
                        <span>{segment.engagementScore}/100</span>
                      </div>
                      <Progress value={segment.engagementScore} className="h-2" />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Segment
                      </Button>
                      <Button size="sm">
                        Create Campaign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="flex gap-4 items-center mb-4">
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  {segments.map(segment => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              {getSegmentCustomers(selectedSegment).map(customer => (
                <Card key={customer.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="font-medium">{customer.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{customer.company}</span>
                            <span>{customer.industry}</span>
                            <span>${customer.value.toLocaleString()} value</span>
                            <span>{customer.monthlyUsage} monthly usage</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={customer.riskScore > 50 ? "destructive" : customer.riskScore > 25 ? "secondary" : "outline"}>
                          {customer.riskScore}% risk
                        </Badge>
                        <Badge variant="outline">{customer.subscriptionTier}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Segment Growth Trends</h3>
              <p className="text-muted-foreground mb-4">
                Analyze growth patterns and predict future segment performance
              </p>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Trend Analysis
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">AI-Powered Insights</h3>
              <p className="text-muted-foreground mb-4">
                Get intelligent recommendations for segment optimization and growth strategies
              </p>
              <Button>
                <Target className="h-4 w-4 mr-2" />
                Generate Insights
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}