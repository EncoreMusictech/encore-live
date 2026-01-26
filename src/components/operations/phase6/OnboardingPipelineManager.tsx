import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  UserPlus,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Mail,
  Calendar,
  Target,
  TrendingUp,
  Plus,
  Filter,
  Building2,
  Settings,
  Users,
  FileText,
  Shield,
  Globe,
  Rocket,
  CheckSquare
} from 'lucide-react';

interface EnterprisePhase {
  id: string;
  name: string;
  description: string;
  order: number;
  timeline: string;
  owner: 'ENCORE' | 'Client' | 'ENCORE + Client' | 'All Teams';
  goLiveReference: string;
  checklist: ChecklistItem[];
  automatedActions: string[];
}

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

interface EnterpriseClient {
  id: string;
  companyName: string;
  displayName: string;
  primaryContact: string;
  email: string;
  tier: 'enterprise_internal' | 'enterprise' | 'pro';
  contractVolume: number;
  adminUsers: number;
  internalUsers: number;
  externalUsers: number;
  currentPhase: string;
  phaseProgress: number;
  weekNumber: number;
  startDate: string;
  targetGoLive: string;
  risk: 'low' | 'medium' | 'high';
  assignedCSM: string;
  completedChecklist: string[];
}

export function OnboardingPipelineManager() {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // 7-Phase Enterprise Onboarding Structure (aligned to PDF plan)
  const enterprisePhases: EnterprisePhase[] = [
    {
      id: 'account_setup',
      name: 'Phase 1: Account Setup',
      description: 'Create sub-account, configure subscription tier, verify system values',
      order: 1,
      timeline: 'Week 1',
      owner: 'ENCORE',
      goLiveReference: 'Week 1 – Kickoff meeting completed',
      checklist: [
        { id: 'create_sub_account', label: 'Create Sub-Account in Dashboard → Operations → Sub-Accounts', required: true },
        { id: 'populate_company_name', label: 'Populate Company Name (legal entity)', required: true },
        { id: 'set_display_name', label: 'Set Display Name', required: true },
        { id: 'set_primary_email', label: 'Set Primary Contact Email', required: true },
        { id: 'set_subscription_tier', label: 'Set Subscription Tier (enterprise_internal)', required: true },
        { id: 'verify_tier_status', label: 'Verify subscription_tier and subscription_status = active', required: true },
      ],
      automatedActions: ['Account creation notification', 'Welcome email to primary contact']
    },
    {
      id: 'module_config',
      name: 'Phase 2: Module Configuration',
      description: 'Enable required modules per client scope and validate access',
      order: 2,
      timeline: 'Week 1',
      owner: 'ENCORE',
      goLiveReference: 'Weeks 4–5 – Configuration & Customization',
      checklist: [
        { id: 'enable_contract_mgmt', label: 'Enable Contract Management module', required: true },
        { id: 'enable_copyright_mgmt', label: 'Enable Copyright Management module', required: false },
        { id: 'enable_royalty_processing', label: 'Enable Royalty Processing module', required: false },
        { id: 'enable_client_portal', label: 'Enable Client Portal module', required: false },
        { id: 'verify_dashboard_display', label: 'Confirm enabled modules display correctly in dashboard', required: true },
        { id: 'verify_sidebar_nav', label: 'Verify sidebar navigation matches enabled modules', required: true },
        { id: 'test_view_as_mode', label: 'Test module access using "View As Sub-Account"', required: true },
      ],
      automatedActions: ['Module activation audit log', 'Configuration snapshot']
    },
    {
      id: 'user_onboarding',
      name: 'Phase 3: User Onboarding',
      description: 'Add admin and internal users with role-based permissions',
      order: 3,
      timeline: 'Week 1',
      owner: 'ENCORE + Client',
      goLiveReference: 'Week 1 – Finalize user roles and permissions matrix',
      checklist: [
        { id: 'send_admin_invites', label: 'Send signup instructions to admin users', required: true },
        { id: 'admin_signup_complete', label: 'Admins complete platform signup using company email', required: true },
        { id: 'add_admins_to_account', label: 'Add admin users to sub-account with Admin role', required: true },
        { id: 'verify_admin_bypass', label: 'Verify admins bypass payment setup automatically', required: true },
        { id: 'add_internal_users', label: 'Add internal users with appropriate roles (Manager/User/Viewer)', required: false },
        { id: 'verify_role_permissions', label: 'Verify role-based access levels are correct', required: true },
      ],
      automatedActions: ['User invitation emails', 'Role assignment notifications', 'Access verification checks']
    },
    {
      id: 'data_ingestion',
      name: 'Phase 4: Contract & Data Ingestion',
      description: 'Upload contracts via AI parsing or manual entry, import associated works',
      order: 4,
      timeline: 'Weeks 2-3',
      owner: 'ENCORE + Client',
      goLiveReference: 'Weeks 2–3 – Data delivery & migration',
      checklist: [
        { id: 'collect_contract_pdfs', label: 'Collect PDF copies of all contracts from client', required: true },
        { id: 'collect_metadata_spreadsheet', label: 'OR collect spreadsheet with contract metadata', required: false },
        { id: 'ai_parsing_upload', label: 'Upload contracts via AI-Assisted Parsing (OCR + extraction)', required: false },
        { id: 'manual_entry_complete', label: 'OR complete manual entry using contract-type forms', required: false },
        { id: 'review_parsed_data', label: 'Review parsed contract data prior to finalization', required: true },
        { id: 'bulk_works_upload', label: 'Bulk upload associated works (if applicable)', required: false },
        { id: 'link_works_to_contracts', label: 'Link works to correct contracts', required: false },
      ],
      automatedActions: ['Import progress tracking', 'Parsing completion notifications', 'Data validation alerts']
    },
    {
      id: 'data_validation',
      name: 'Phase 5: Data Validation & QA',
      description: 'Quality assurance checks, metadata enrichment, confidence scoring',
      order: 5,
      timeline: 'Weeks 2-3',
      owner: 'ENCORE',
      goLiveReference: 'Weeks 2–3 – Migration review & signoff',
      checklist: [
        { id: 'contracts_visible', label: 'All contracts visible and classified correctly', required: true },
        { id: 'financial_terms_verified', label: 'Financial terms verified', required: true },
        { id: 'works_linked_correctly', label: 'Works linked to correct contracts', required: true },
        { id: 'parties_splits_accurate', label: 'Interested parties and splits accurate', required: true },
        { id: 'iswc_lookups', label: 'ISWC lookups completed (optional)', required: false },
        { id: 'writer_publisher_verified', label: 'Writer and publisher chain verification', required: false },
        { id: 'confidence_scoring', label: 'Confidence scoring logged for audit', required: true },
      ],
      automatedActions: ['QA validation report', 'Data quality scoring', 'Enrichment notifications']
    },
    {
      id: 'portal_setup',
      name: 'Phase 6: Client Portal Setup',
      description: 'Configure external contributor access and permissions',
      order: 6,
      timeline: 'Weeks 4-5',
      owner: 'ENCORE',
      goLiveReference: 'Weeks 4–5 – Dashboard & permission configuration',
      checklist: [
        { id: 'navigate_invite_client', label: 'Navigate to Clients → Invite Client', required: false },
        { id: 'assign_view_contracts', label: 'Assign permission: View contracts', required: false },
        { id: 'assign_view_works', label: 'Assign permission: View works', required: false },
        { id: 'assign_view_statements', label: 'Assign permission: View statements (if enabled)', required: false },
        { id: 'send_branded_invitations', label: 'Send branded, tokenized invitation emails', required: false },
        { id: 'verify_external_access', label: 'Verify external user access model', required: false },
      ],
      automatedActions: ['Client portal invitation emails', 'Permission assignment audit']
    },
    {
      id: 'go_live',
      name: 'Phase 7: Go-Live Readiness',
      description: 'Pre-launch verification, production launch, post-launch monitoring',
      order: 7,
      timeline: 'Week 7',
      owner: 'All Teams',
      goLiveReference: 'Week 7 – Go-live approval & production launch',
      checklist: [
        { id: 'sub_account_active', label: 'Sub-account active and verified', required: true },
        { id: 'modules_enabled', label: 'Modules enabled per scope', required: true },
        { id: 'users_validated', label: 'Users added and validated', required: true },
        { id: 'contracts_approved', label: 'Contracts ingested and approved', required: true },
        { id: 'works_validated', label: 'Works linked and validated', required: true },
        { id: 'portal_invitations_sent', label: 'Client Portal invitations sent (if applicable)', required: false },
        { id: 'login_no_redirect', label: 'Login verification without payment redirects', required: true },
        { id: 'module_visibility_test', label: 'Module visibility validation', required: true },
        { id: 'data_isolation_test', label: 'Data isolation testing', required: true },
        { id: 'audit_log_review', label: 'Audit log review', required: true },
      ],
      automatedActions: ['Go-live approval workflow', 'Launch notification', 'Post-launch monitoring']
    }
  ];

  // Sample enterprise clients (would come from companies table in production)
  const enterpriseClients: EnterpriseClient[] = [
    {
      id: '1',
      companyName: 'PAQ Publishing',
      displayName: 'PAQ',
      primaryContact: 'John Smith',
      email: 'john@paqpublishing.com',
      tier: 'enterprise_internal',
      contractVolume: 40,
      adminUsers: 3,
      internalUsers: 5,
      externalUsers: 10,
      currentPhase: 'data_ingestion',
      phaseProgress: 45,
      weekNumber: 2,
      startDate: '2026-01-13',
      targetGoLive: '2026-03-03',
      risk: 'low',
      assignedCSM: 'Sarah Wilson',
      completedChecklist: [
        'create_sub_account', 'populate_company_name', 'set_display_name', 'set_primary_email',
        'set_subscription_tier', 'verify_tier_status', 'enable_contract_mgmt', 'verify_dashboard_display',
        'verify_sidebar_nav', 'test_view_as_mode', 'send_admin_invites', 'admin_signup_complete',
        'add_admins_to_account', 'verify_admin_bypass', 'verify_role_permissions', 'collect_contract_pdfs'
      ]
    }
  ];

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

  const getPhaseProgress = (phaseId: string) => {
    const phaseClients = enterpriseClients.filter(c => c.currentPhase === phaseId);
    return {
      count: phaseClients.length,
      clients: phaseClients
    };
  };

  const calculateChecklistProgress = (client: EnterpriseClient, phaseId: string) => {
    const phase = enterprisePhases.find(p => p.id === phaseId);
    if (!phase) return 0;
    const completed = phase.checklist.filter(item => 
      client.completedChecklist.includes(item.id)
    ).length;
    return Math.round((completed / phase.checklist.length) * 100);
  };

  const filteredClients = selectedPhase === 'all' 
    ? enterpriseClients 
    : enterpriseClients.filter(c => c.currentPhase === selectedPhase);

  const totalClients = enterpriseClients.length;
  const inProgressClients = enterpriseClients.filter(c => c.currentPhase !== 'go_live').length;
  const goLiveReady = enterpriseClients.filter(c => c.currentPhase === 'go_live' && c.phaseProgress >= 90).length;
  const atRiskClients = enterpriseClients.filter(c => c.risk === 'high').length;

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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Enterprise Client
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Onboarding Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalClients}</div>
              <div className="text-sm text-muted-foreground">Active Implementations</div>
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
              <div className="text-2xl font-bold text-green-600">{goLiveReady}</div>
              <div className="text-sm text-muted-foreground">Go-Live Ready</div>
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
            {/* Phase Overview with 7 phases */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-4">Implementation Phases Overview</h4>
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
                  {enterprisePhases.map(phase => {
                    const phaseData = getPhaseProgress(phase.id);
                    return (
                      <Button
                        key={phase.id}
                        variant={selectedPhase === phase.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPhase(phase.id)}
                        className="h-auto p-2 flex-col gap-1"
                      >
                        {getPhaseIcon(phase.id)}
                        <div className="text-sm font-bold">{phaseData.count}</div>
                        <div className="text-[10px] text-center leading-tight">P{phase.order}</div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Client List */}
            <div className="space-y-3">
              {filteredClients.map(client => {
                const currentPhase = enterprisePhases.find(p => p.id === client.currentPhase);
                const phaseIndex = enterprisePhases.findIndex(p => p.id === client.currentPhase);
                const overallProgress = Math.round(((phaseIndex + (client.phaseProgress / 100)) / enterprisePhases.length) * 100);
                const isExpanded = expandedClient === client.id;

                return (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-12 w-12 bg-primary/10">
                            <AvatarFallback className="text-primary font-bold">
                              {client.displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">{client.companyName}</h4>
                              <Badge variant="outline" className={getRiskColor(client.risk)}>
                                {client.risk} risk
                              </Badge>
                              <Badge variant="outline" className="bg-muted">
                                {client.tier.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span>{client.contractVolume} contracts</span>
                              <span>{client.adminUsers} admins</span>
                              <span>{client.internalUsers} internal users</span>
                              <span>Week {client.weekNumber}</span>
                              <span>CSM: {client.assignedCSM}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              {getPhaseIcon(client.currentPhase)}
                              <span className="font-medium">{currentPhase?.name}</span>
                              <Badge variant="outline" className={getOwnerBadgeColor(currentPhase?.owner || '')}>
                                {currentPhase?.owner}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Target: {new Date(client.targetGoLive).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Overall Implementation Progress</span>
                                <span className="font-medium">{overallProgress}%</span>
                              </div>
                              <Progress value={overallProgress} className="h-2" />
                              
                              <div className="flex gap-1 mt-2">
                                {enterprisePhases.map((phase, idx) => {
                                  const isComplete = idx < phaseIndex;
                                  const isCurrent = phase.id === client.currentPhase;
                                  return (
                                    <div
                                      key={phase.id}
                                      className={`h-1.5 flex-1 rounded-full ${
                                        isComplete ? 'bg-chart-2' :
                                        isCurrent ? 'bg-primary' :
                                        'bg-muted'
                                      }`}
                                      title={phase.name}
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            {/* Expandable Checklist */}
                            {isExpanded && currentPhase && (
                              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                                <h5 className="font-medium mb-3 flex items-center gap-2">
                                  <CheckSquare className="h-4 w-4" />
                                  {currentPhase.name} Checklist
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {currentPhase.checklist.map(item => {
                                    const isChecked = client.completedChecklist.includes(item.id);
                                    return (
                                      <div key={item.id} className="flex items-center gap-2">
                                        <Checkbox checked={isChecked} disabled />
                                        <span className={`text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                          {item.label}
                                          {item.required && <span className="text-red-500 ml-1">*</span>}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                          >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            {isExpanded ? 'Hide' : 'Show'} Checklist
                          </Button>
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
                            Advance Phase
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <div className="grid gap-4">
              {enterprisePhases.map((phase) => (
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
                            <span>{getPhaseProgress(phase.id).count} clients currently</span>
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
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
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
                  {enterprisePhases.map(phase => (
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Post-Go-Live Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'Login verification without payment redirects',
                    'Module visibility validation',
                    'Data isolation testing',
                    'Audit log review'
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <Checkbox disabled />
                      <span>{item}</span>
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
