import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Mail,
  Phone,
  Calendar,
  Target,
  Users,
  TrendingUp,
  Plus,
  Filter
} from 'lucide-react';

interface OnboardingStage {
  id: string;
  name: string;
  description: string;
  order: number;
  expectedDays: number;
  automatedActions: string[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  signupDate: string;
  currentStage: string;
  progress: number;
  daysInStage: number;
  risk: 'low' | 'medium' | 'high';
  value: number;
  lastActivity: string;
  assignedCSM: string;
  csmName: string;
}

export function OnboardingPipelineManager() {
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const onboardingStages: OnboardingStage[] = [
    {
      id: 'welcome',
      name: 'Welcome & Account Setup',
      description: 'Initial welcome, account verification, and basic profile completion',
      order: 1,
      expectedDays: 1,
      automatedActions: ['Welcome email', 'Account verification', 'Profile setup reminder']
    },
    {
      id: 'discovery',
      name: 'Product Discovery',
      description: 'Feature introduction, guided tour, and initial preferences setup',
      order: 2,
      expectedDays: 3,
      automatedActions: ['Feature tour email', 'Tutorial video series', 'Preferences survey']
    },
    {
      id: 'first_value',
      name: 'First Value Achievement',
      description: 'Complete first catalog valuation or contract upload',
      order: 3,
      expectedDays: 7,
      automatedActions: ['Guided walkthrough', 'Success celebration', 'Next steps email']
    },
    {
      id: 'feature_adoption',
      name: 'Feature Adoption',
      description: 'Explore additional features and integrations',
      order: 4,
      expectedDays: 14,
      automatedActions: ['Feature recommendations', 'Integration setup', 'Usage tips']
    },
    {
      id: 'optimization',
      name: 'Workflow Optimization',
      description: 'Optimize workflows and establish regular usage patterns',
      order: 5,
      expectedDays: 30,
      automatedActions: ['Optimization tips', 'Best practices guide', 'CSM introduction']
    },
    {
      id: 'success',
      name: 'Onboarding Complete',
      description: 'Fully onboarded and achieving regular value from platform',
      order: 6,
      expectedDays: 45,
      automatedActions: ['Success celebration', 'Expansion opportunities', 'Referral program']
    }
  ];

  const customers: Customer[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@harmonicmusic.com',
      company: 'Harmonic Music Publishing',
      industry: 'Music Publishing',
      signupDate: '2024-01-08',
      currentStage: 'first_value',
      progress: 65,
      daysInStage: 4,
      risk: 'low',
      value: 5000,
      lastActivity: '2024-01-12',
      assignedCSM: 'john-doe',
      csmName: 'John Doe'
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'mike@independentartist.com',
      company: 'Independent Artist',
      industry: 'Artist Management',
      signupDate: '2024-01-10',
      currentStage: 'discovery',
      progress: 30,
      daysInStage: 2,
      risk: 'medium',
      value: 1200,
      lastActivity: '2024-01-11',
      assignedCSM: 'jane-smith',
      csmName: 'Jane Smith'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@globalrecords.com',
      company: 'Global Records',
      industry: 'Record Label',
      signupDate: '2024-01-05',
      currentStage: 'feature_adoption',
      progress: 80,
      daysInStage: 8,
      risk: 'low',
      value: 15000,
      lastActivity: '2024-01-13',
      assignedCSM: 'john-doe',
      csmName: 'John Doe'
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david@creativecommons.org',
      company: 'Creative Commons Collective',
      industry: 'Rights Management',
      signupDate: '2024-01-12',
      currentStage: 'welcome',
      progress: 15,
      daysInStage: 1,
      risk: 'high',
      value: 800,
      lastActivity: '2024-01-12',
      assignedCSM: 'sarah-wilson',
      csmName: 'Sarah Wilson'
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStageProgress = (stageId: string) => {
    const stageCustomers = customers.filter(c => c.currentStage === stageId);
    return {
      count: stageCustomers.length,
      avgProgress: stageCustomers.length > 0 
        ? stageCustomers.reduce((sum, c) => sum + c.progress, 0) / stageCustomers.length 
        : 0
    };
  };

  const filteredCustomers = selectedStage === 'all' 
    ? customers 
    : customers.filter(c => c.currentStage === selectedStage);

  const totalCustomers = customers.length;
  const avgProgress = customers.reduce((sum, c) => sum + c.progress, 0) / totalCustomers;
  const completedCustomers = customers.filter(c => c.currentStage === 'success').length;
  const atRiskCustomers = customers.filter(c => c.risk === 'high').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Onboarding Pipeline Manager</CardTitle>
              <CardDescription>
                Track customer onboarding progress and optimize success workflows
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Manual Onboarding
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Onboarding Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalCustomers}</div>
              <div className="text-sm text-muted-foreground">Active Onboarding</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{avgProgress.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Avg Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{completedCustomers}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{atRiskCustomers}</div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList>
            <TabsTrigger value="pipeline">Onboarding Pipeline</TabsTrigger>
            <TabsTrigger value="stages">Stage Configuration</TabsTrigger>
            <TabsTrigger value="analytics">Success Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            {/* Stage Overview */}
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4">Onboarding Stages Overview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <Button
                      variant={selectedStage === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStage('all')}
                      className="h-auto p-3 flex-col"
                    >
                      <div className="text-lg font-bold">{totalCustomers}</div>
                      <div className="text-xs">All Stages</div>
                    </Button>
                    {onboardingStages.map(stage => {
                      const stageData = getStageProgress(stage.id);
                      return (
                        <Button
                          key={stage.id}
                          variant={selectedStage === stage.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedStage(stage.id)}
                          className="h-auto p-3 flex-col"
                        >
                          <div className="text-lg font-bold">{stageData.count}</div>
                          <div className="text-xs text-center leading-tight">{stage.name}</div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer List */}
            <div className="space-y-3">
              {filteredCustomers.map(customer => {
                const currentStage = onboardingStages.find(s => s.id === customer.currentStage);
                const isOverdue = customer.daysInStage > (currentStage?.expectedDays || 0);

                return (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {customer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{customer.name}</h4>
                              <Badge variant="outline" className={getRiskColor(customer.risk)}>
                                {customer.risk} risk
                              </Badge>
                              {isOverdue && (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-2">
                              {customer.company} • {customer.industry} • ${customer.value.toLocaleString()} value
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>Stage: {currentStage?.name}</span>
                              <span>{customer.daysInStage} days in stage</span>
                              <span>CSM: {customer.csmName}</span>
                              <span>Last activity: {customer.lastActivity}</span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Onboarding Progress</span>
                                <span>{customer.progress}%</span>
                              </div>
                              <Progress value={customer.progress} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule
                          </Button>
                          <Button size="sm">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Advance Stage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="stages" className="space-y-4">
            <div className="grid gap-4">
              {onboardingStages.map((stage, index) => (
                <Card key={stage.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                          {stage.order}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg mb-1">{stage.name}</h4>
                          <p className="text-muted-foreground mb-3">{stage.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span>Expected duration: {stage.expectedDays} days</span>
                            <span>{getStageProgress(stage.id).count} customers currently</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Automated Actions:</div>
                            <div className="flex flex-wrap gap-1">
                              {stage.automatedActions.map(action => (
                                <Badge key={action} variant="secondary" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Onboarding Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Detailed analytics on onboarding success rates, stage conversion, and optimization opportunities
              </p>
              <Button>
                <Target className="h-4 w-4 mr-2" />
                View Analytics Dashboard
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}