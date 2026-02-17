import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, ArrowRight, Mail, Calendar, Target, TrendingUp,
  Plus, Filter, Building2, Settings, Users, FileText, Shield,
  Globe, Rocket, CheckSquare
} from 'lucide-react';
import { ONBOARDING_PHASES, getPhaseIndex } from '@/constants/onboardingPhases';
import { AssigneeBadge } from '@/components/admin/subaccount/AssigneeBadge';
import { useAllOnboardingProgress, useAllOnboardingChecklists, useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/** Interactive checklist for a single client in the pipeline view */
function PipelineChecklist({ companyId, phaseId }: { companyId: string; phaseId: string }) {
  const { toggleChecklistItem, isItemCompleted } = useOnboardingProgress(companyId);
  const { user } = useAuth();
  const phase = ONBOARDING_PHASES.find(p => p.id === phaseId);

  // Admin check for permission enforcement
  const adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'];
  const isAdmin = adminEmails.includes(user?.email?.toLowerCase() || '');

  if (!phase) return null;

  const isCheckboxDisabled = (assignee: string) => {
    if (isAdmin) {
      return assignee === 'Client';
    }
    return assignee === 'ENCORE';
  };

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
      <h5 className="font-medium mb-3 flex items-center gap-2">
        <CheckSquare className="h-4 w-4" />
        {phase.name} Checklist
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {phase.checklist.map(item => {
          const isChecked = isItemCompleted(phaseId, item.id);
          const disabled = isCheckboxDisabled(item.assignee);
          return (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox
                checked={isChecked}
                disabled={disabled}
                onCheckedChange={(val) =>
                  toggleChecklistItem({
                    phaseId,
                    itemId: item.id,
                    completed: !!val,
                  })
                }
              />
              <span className={`text-sm ${isChecked ? 'line-through text-muted-foreground' : ''} ${disabled ? 'opacity-60' : ''}`}>
                {item.label}
                {item.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <AssigneeBadge assignee={item.assignee} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingPipelineManager() {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: allProgress = [], isLoading } = useAllOnboardingProgress();
  const companyIds = useMemo(() => allProgress.map((p: any) => p.company_id), [allProgress]);
  const { data: allChecklists = [] } = useAllOnboardingChecklists(companyIds);

  const checklistMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    allChecklists.forEach((c: any) => {
      if (!map[c.company_id]) map[c.company_id] = new Set();
      if (c.completed) map[c.company_id].add(`${c.phase_id}:${c.item_id}`);
    });
    return map;
  }, [allChecklists]);

  const getPhaseIcon = (phaseId: string) => {
    const icons: Record<string, React.ReactNode> = {
      account_setup: <Building2 className="h-4 w-4" />,
      module_config: <Settings className="h-4 w-4" />,
      user_onboarding: <Users className="h-4 w-4" />,
      data_ingestion: <FileText className="h-4 w-4" />,
      data_validation: <Shield className="h-4 w-4" />,
      portal_setup: <Globe className="h-4 w-4" />,
      go_live: <Rocket className="h-4 w-4" />
    };
    return icons[phaseId] || <CheckCircle className="h-4 w-4" />;
  };

  const getOwnerBadgeColor = (owner: string) => {
    if (owner === 'ENCORE') return 'bg-primary/10 text-primary border-primary/20';
    if (owner === 'Client') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (owner === 'All Teams') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-orange-50 text-orange-700 border-orange-200';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const clients = useMemo(() => {
    return allProgress.map((p: any) => {
      const company = p.companies;
      return {
        id: p.company_id,
        companyName: company?.name || 'Unknown',
        displayName: company?.display_name || 'Unknown',
        email: company?.contact_email || '',
        tier: company?.subscription_tier || 'enterprise',
        currentPhase: p.current_phase,
        phaseProgress: p.phase_progress,
        weekNumber: p.week_number,
        startDate: p.start_date,
        targetGoLive: p.target_go_live,
        risk: p.risk_level,
        assignedCSM: p.assigned_csm || 'Unassigned',
        status: p.status,
      };
    });
  }, [allProgress]);

  const filteredClients = selectedPhase === 'all'
    ? clients
    : clients.filter((c: any) => c.currentPhase === selectedPhase);

  const totalClients = clients.length;
  const inProgressClients = clients.filter((c: any) => c.status === 'active').length;
  const completedClients = clients.filter((c: any) => c.status === 'completed').length;
  const atRiskClients = clients.filter((c: any) => c.risk === 'high').length;

  const getPhaseClientCount = (phaseId: string) =>
    clients.filter((c: any) => c.currentPhase === phaseId && c.status === 'active').length;

  const getClientChecklist = (companyId: string) => checklistMap[companyId] || new Set<string>();

  const calculateOverallProgress = (client: any) => {
    const currentIdx = getPhaseIndex(client.currentPhase);
    if (currentIdx < 0) return 0;
    const completed = getClientChecklist(client.id);
    const currentPhase = ONBOARDING_PHASES[currentIdx];
    const phaseCompletion = currentPhase
      ? currentPhase.checklist.filter(item => completed.has(`${currentPhase.id}:${item.id}`)).length / currentPhase.checklist.length
      : 0;
    return Math.round(((currentIdx + phaseCompletion) / ONBOARDING_PHASES.length) * 100);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Enterprise Client Onboarding</CardTitle>
              <CardDescription>
                7-phase implementation workflow aligned to Go-Live Tasklist & Milestones
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => navigate('/dashboard/operations')}>
              <Plus className="h-4 w-4 mr-2" />
              New Enterprise Client
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalClients}</div>
              <div className="text-sm text-muted-foreground">Total Implementations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{inProgressClients}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedClients}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{atRiskClients}</div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList>
            <TabsTrigger value="pipeline">Implementation Pipeline</TabsTrigger>
            <TabsTrigger value="phases">Phase Configuration</TabsTrigger>
            <TabsTrigger value="checklist">Go-Live Checklist</TabsTrigger>
            <TabsTrigger value="analytics">Success Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            {selectedClient ? (() => {
              const client = clients.find((c: any) => c.id === selectedClient);
              if (!client) return null;
              const currentPhase = ONBOARDING_PHASES.find(p => p.id === client.currentPhase);
              const overallProgress = calculateOverallProgress(client);
              const phaseIndex = getPhaseIndex(client.currentPhase);

              return (
                <div className="space-y-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                    ← Back to All Clients
                  </Button>

                  {/* Client Header */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-14 w-14 bg-primary/10">
                          <AvatarFallback className="text-primary font-bold text-lg">
                            {client.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{client.companyName}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>Week {client.weekNumber}</span>
                            <span>CSM: {client.assignedCSM}</span>
                            <span>Target: {new Date(client.targetGoLive).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={getRiskColor(client.risk)}>
                            {client.risk} risk
                          </Badge>
                          {client.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-700">Completed</Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/operations/sub-accounts/${client.id}`)}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Sub-Account
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Progress</span>
                          <span className="font-medium">{overallProgress}%</span>
                        </div>
                        <Progress value={overallProgress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Phase Cards */}
                  <div className="grid gap-3">
                    {ONBOARDING_PHASES.map((phase, idx) => {
                      const isCurrent = phase.id === client.currentPhase;
                      const isComplete = idx < phaseIndex;
                      const isFuture = idx > phaseIndex;
                      const clientChecklist = getClientChecklist(client.id);
                      const completedItems = phase.checklist.filter(item => clientChecklist.has(`${phase.id}:${item.id}`)).length;
                      const totalItems = phase.checklist.length;
                      const isExpanded = expandedClient === phase.id;

                      return (
                        <Card
                          key={phase.id}
                          className={`transition-all ${isCurrent ? 'border-primary shadow-sm' : ''} ${isFuture ? 'opacity-60' : ''}`}
                        >
                          <CardContent className="p-4">
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => setExpandedClient(isExpanded ? null : phase.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-9 h-9 rounded-full ${
                                  isComplete ? 'bg-green-100 text-green-600' :
                                  isCurrent ? 'bg-primary/10 text-primary' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {isComplete ? <CheckCircle className="h-4 w-4" /> : getPhaseIcon(phase.id)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{phase.name}</span>
                                    {isCurrent && <Badge className="text-xs">Current</Badge>}
                                    <Badge variant="outline" className={getOwnerBadgeColor(phase.owner)}>
                                      {phase.owner}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {completedItems}/{totalItems} tasks complete · {phase.timeline}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Progress value={(completedItems / totalItems) * 100} className="h-1.5 w-24" />
                                <span className="text-xs text-muted-foreground">{Math.round((completedItems / totalItems) * 100)}%</span>
                              </div>
                            </div>

                            {isExpanded && (
                              <PipelineChecklist companyId={client.id} phaseId={phase.id} />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })() : (
              <>
                {/* Phase Filter */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
                      <Button
                        variant={selectedPhase === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPhase('all')}
                        className="h-auto p-3 flex-col"
                      >
                        <div className="text-lg font-bold">{totalClients}</div>
                        <div className="text-xs">All</div>
                      </Button>
                      {ONBOARDING_PHASES.map(phase => (
                        <Button
                          key={phase.id}
                          variant={selectedPhase === phase.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedPhase(phase.id)}
                          className="h-auto p-2 flex-col gap-1"
                        >
                          {getPhaseIcon(phase.id)}
                          <div className="text-sm font-bold">{getPhaseClientCount(phase.id)}</div>
                          <div className="text-[10px] text-center leading-tight">P{phase.order}</div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Client Tiles */}
                {filteredClients.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No clients in this phase. Create a sub-account and visit its Onboarding tab to begin.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client: any) => {
                      const currentPhase = ONBOARDING_PHASES.find(p => p.id === client.currentPhase);
                      const overallProgress = calculateOverallProgress(client);

                      return (
                        <Card
                          key={client.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedClient(client.id)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar className="h-10 w-10 bg-primary/10">
                                <AvatarFallback className="text-primary font-bold text-sm">
                                  {client.displayName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{client.companyName}</h4>
                                <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                              </div>
                              <Badge variant="outline" className={getRiskColor(client.risk)}>
                                {client.risk}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              {getPhaseIcon(client.currentPhase)}
                              <span className="text-sm font-medium">{currentPhase?.name}</span>
                              {client.status === 'completed' && (
                                <Badge className="text-xs bg-green-100 text-green-700 ml-auto">Done</Badge>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{overallProgress}%</span>
                              </div>
                              <Progress value={overallProgress} className="h-1.5" />
                              <div className="flex gap-1">
                                {ONBOARDING_PHASES.map((phase, idx) => {
                                  const phaseIndex = getPhaseIndex(client.currentPhase);
                                  return (
                                    <div
                                      key={phase.id}
                                      className={`h-1 flex-1 rounded-full ${
                                        idx < phaseIndex ? 'bg-chart-2' :
                                        phase.id === client.currentPhase ? 'bg-primary' :
                                        'bg-muted'
                                      }`}
                                      title={phase.name}
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                              <span>Week {client.weekNumber}</span>
                              <span>Target: {new Date(client.targetGoLive).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <div className="grid gap-4">
              {ONBOARDING_PHASES.map((phase) => (
                <Card key={phase.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                          {getPhaseIcon(phase.id)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{phase.name}</h4>
                            <Badge variant="outline">{phase.timeline}</Badge>
                            <Badge variant="outline" className={getOwnerBadgeColor(phase.owner)}>
                              {phase.owner}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{phase.description}</p>
                          <p className="text-sm text-primary mb-3">
                            📋 Go-Live Reference: {phase.goLiveReference}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span>{phase.checklist.length} checklist items</span>
                            <span>{phase.checklist.filter(c => c.required).length} required</span>
                            <span>{getPhaseClientCount(phase.id)} clients currently</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Automated Actions:</div>
                            <div className="flex flex-wrap gap-1">
                              {phase.automatedActions.map(action => (
                                <Badge key={action} variant="secondary" className="text-xs">
                                  {action}
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

          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Pre-Go-Live Checklist
                </CardTitle>
                <CardDescription>
                  Master checklist for enterprise implementation signoff
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ONBOARDING_PHASES.map(phase => (
                    <div key={phase.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {getPhaseIcon(phase.id)}
                        <h4 className="font-semibold">{phase.name}</h4>
                        <Badge variant="outline">{phase.timeline}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {phase.checklist.map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <Checkbox disabled />
                            <span>
                              {item.label}
                              {item.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                            <AssigneeBadge assignee={item.assignee} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Implementation Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Track implementation velocity, phase conversion rates, and time-to-value metrics
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
