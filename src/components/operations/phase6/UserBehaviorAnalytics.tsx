import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users,
  MousePointer,
  Clock,
  BarChart3,
  Target,
  TrendingUp,
  Eye,
  Calendar,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Layers,
  Navigation,
  Smartphone
} from 'lucide-react';

interface UserJourney {
  id: string;
  name: string;
  description: string;
  steps: string[];
  completionRate: number;
  avgTimeToComplete: number;
  dropOffPoints: string[];
  users: number;
}

interface FeatureUsage {
  id: string;
  name: string;
  category: string;
  totalUsers: number;
  activeUsers: number;
  avgSessionTime: number;
  adoptionRate: number;
  retentionRate: number;
  satisfactionScore: number;
}

interface UserSegment {
  id: string;
  name: string;
  description: string;
  userCount: number;
  avgSessionTime: number;
  pagesPerSession: number;
  bounceRate: number;
  conversionRate: number;
  topFeatures: string[];
}

export function UserBehaviorAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedSegment, setSelectedSegment] = useState('all');

  const userJourneys: UserJourney[] = [
    {
      id: 'onboarding',
      name: 'User Onboarding Journey',
      description: 'From signup to first successful catalog valuation',
      steps: ['Signup', 'Email Verification', 'Profile Setup', 'First Valuation', 'Results Review'],
      completionRate: 73.5,
      avgTimeToComplete: 18.5,
      dropOffPoints: ['Profile Setup', 'First Valuation'],
      users: 1247
    },
    {
      id: 'catalog_valuation',
      name: 'Catalog Valuation Workflow',
      description: 'Complete catalog valuation process',
      steps: ['Artist Search', 'Data Review', 'Parameters Setup', 'Valuation Run', 'Results Analysis'],
      completionRate: 89.2,
      avgTimeToComplete: 12.3,
      dropOffPoints: ['Parameters Setup'],
      users: 2156
    },
    {
      id: 'deal_creation',
      name: 'Deal Simulation Creation',
      description: 'Creating and analyzing deal scenarios',
      steps: ['Deal Setup', 'Terms Configuration', 'Scenario Running', 'Results Review', 'Export/Save'],
      completionRate: 67.8,
      avgTimeToComplete: 25.7,
      dropOffPoints: ['Terms Configuration', 'Scenario Running'],
      users: 892
    }
  ];

  const featureUsage: FeatureUsage[] = [
    {
      id: 'catalog_valuation',
      name: 'Catalog Valuation',
      category: 'Core Features',
      totalUsers: 2847,
      activeUsers: 2156,
      avgSessionTime: 15.3,
      adoptionRate: 94.2,
      retentionRate: 87.5,
      satisfactionScore: 4.6
    },
    {
      id: 'deal_simulator',
      name: 'Deal Simulator',
      category: 'Core Features',
      totalUsers: 1567,
      activeUsers: 892,
      avgSessionTime: 22.8,
      adoptionRate: 56.9,
      retentionRate: 73.2,
      satisfactionScore: 4.3
    },
    {
      id: 'contract_management',
      name: 'Contract Management',
      category: 'Business Tools',
      totalUsers: 987,
      activeUsers: 654,
      avgSessionTime: 18.9,
      adoptionRate: 35.7,
      retentionRate: 78.9,
      satisfactionScore: 4.1
    },
    {
      id: 'analytics_dashboard',
      name: 'Analytics Dashboard',
      category: 'Analytics',
      totalUsers: 2234,
      activeUsers: 1789,
      avgSessionTime: 8.7,
      adoptionRate: 80.1,
      retentionRate: 82.3,
      satisfactionScore: 4.4
    },
    {
      id: 'sync_licensing',
      name: 'Sync Licensing',
      category: 'Revenue Tools',
      totalUsers: 456,
      activeUsers: 287,
      avgSessionTime: 13.4,
      adoptionRate: 16.5,
      retentionRate: 68.7,
      satisfactionScore: 3.9
    }
  ];

  const userSegments: UserSegment[] = [
    {
      id: 'power_users',
      name: 'Power Users',
      description: 'Heavy platform users with high engagement',
      userCount: 267,
      avgSessionTime: 28.5,
      pagesPerSession: 12.3,
      bounceRate: 15.2,
      conversionRate: 89.7,
      topFeatures: ['Catalog Valuation', 'Deal Simulator', 'Analytics Dashboard']
    },
    {
      id: 'regular_users',
      name: 'Regular Users',
      description: 'Consistent users with moderate engagement',
      userCount: 1456,
      avgSessionTime: 15.8,
      pagesPerSession: 7.2,
      bounceRate: 28.9,
      conversionRate: 67.3,
      topFeatures: ['Catalog Valuation', 'Analytics Dashboard', 'Contract Management']
    },
    {
      id: 'new_users',
      name: 'New Users',
      description: 'Recently signed up users still exploring',
      userCount: 892,
      avgSessionTime: 8.4,
      pagesPerSession: 4.1,
      bounceRate: 52.7,
      conversionRate: 23.8,
      topFeatures: ['Catalog Valuation', 'User Profile', 'Help Center']
    },
    {
      id: 'at_risk',
      name: 'At-Risk Users',
      description: 'Users showing signs of disengagement',
      userCount: 234,
      avgSessionTime: 3.7,
      pagesPerSession: 2.1,
      bounceRate: 78.4,
      conversionRate: 12.1,
      topFeatures: ['Login Page', 'Support', 'Account Settings']
    }
  ];

  const getAdoptionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSegmentColor = (segmentId: string) => {
    switch (segmentId) {
      case 'power_users': return 'bg-purple-500';
      case 'regular_users': return 'bg-blue-500';
      case 'new_users': return 'bg-green-500';
      case 'at_risk': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const totalUsers = userSegments.reduce((sum, s) => sum + s.userCount, 0);
  const avgSessionTime = userSegments.reduce((sum, s) => sum + (s.avgSessionTime * s.userCount), 0) / totalUsers;
  const avgBounceRate = userSegments.reduce((sum, s) => sum + (s.bounceRate * s.userCount), 0) / totalUsers;
  const avgConversionRate = userSegments.reduce((sum, s) => sum + (s.conversionRate * s.userCount), 0) / totalUsers;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>User Behavior Analytics</CardTitle>
              <CardDescription>
                Analyze user interactions, feature adoption, and workflow optimization opportunities
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalUsers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{avgSessionTime.toFixed(1)}m</div>
              <div className="text-sm text-muted-foreground">Avg Session Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{avgConversionRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{avgBounceRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Bounce Rate</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="features" className="w-full">
          <TabsList>
            <TabsTrigger value="features">Feature Analytics</TabsTrigger>
            <TabsTrigger value="journeys">User Journeys</TabsTrigger>
            <TabsTrigger value="segments">User Segments</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <div className="grid gap-4">
              {featureUsage.map(feature => (
                <Card key={feature.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{feature.name}</h4>
                          <Badge variant="secondary">{feature.category}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">{feature.activeUsers.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Active Users</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">{feature.avgSessionTime}m</div>
                        <div className="text-xs text-muted-foreground">Avg Session</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className={`text-lg font-semibold ${getAdoptionColor(feature.adoptionRate)}`}>
                          {feature.adoptionRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Adoption</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold text-blue-600">{feature.retentionRate}%</div>
                        <div className="text-xs text-muted-foreground">Retention</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold text-purple-600">{feature.satisfactionScore}/5</div>
                        <div className="text-xs text-muted-foreground">Satisfaction</div>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-semibold">
                          {((feature.activeUsers / feature.totalUsers) * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Usage Rate</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Adoption Progress</span>
                        <span>{feature.adoptionRate}%</span>
                      </div>
                      <Progress value={feature.adoptionRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="journeys" className="space-y-4">
            <div className="grid gap-4">
              {userJourneys.map(journey => (
                <Card key={journey.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-lg mb-2">{journey.name}</h4>
                        <p className="text-muted-foreground mb-3">{journey.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{journey.users.toLocaleString()} users</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{journey.avgTimeToComplete}min avg time</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{journey.completionRate}% completion</span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-sm font-medium">Journey Steps:</div>
                          <div className="flex items-center gap-2">
                            {journey.steps.map((step, index) => (
                              <React.Fragment key={step}>
                                <Badge 
                                  variant={journey.dropOffPoints.includes(step) ? "destructive" : "outline"}
                                  className="text-xs"
                                >
                                  {index + 1}. {step}
                                </Badge>
                                {index < journey.steps.length - 1 && (
                                  <Navigation className="h-3 w-3 text-muted-foreground" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Completion Rate</span>
                            <span>{journey.completionRate}%</span>
                          </div>
                          <Progress value={journey.completionRate} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="grid gap-4">
              {userSegments.map(segment => (
                <Card key={segment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-4 h-16 rounded ${getSegmentColor(segment.id)}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-2">{segment.name}</h4>
                          <p className="text-muted-foreground mb-4">{segment.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold">{segment.userCount.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Users</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold">{segment.avgSessionTime}m</div>
                              <div className="text-xs text-muted-foreground">Session Time</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold">{segment.pagesPerSession}</div>
                              <div className="text-xs text-muted-foreground">Pages/Session</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold text-red-600">{segment.bounceRate}%</div>
                              <div className="text-xs text-muted-foreground">Bounce Rate</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold text-green-600">{segment.conversionRate}%</div>
                              <div className="text-xs text-muted-foreground">Conversion</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">Top Features:</div>
                            <div className="flex flex-wrap gap-2">
                              {segment.topFeatures.map(feature => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="optimization">
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Optimization Recommendations</h3>
              <p className="text-muted-foreground mb-4">
                AI-powered insights and recommendations for improving user experience and conversion
              </p>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Generate Optimization Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}