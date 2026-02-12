import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, Users, Shield, Upload, Settings, Eye, Briefcase, ClipboardList, Palette } from 'lucide-react';
import { SubAccountOverview } from '@/components/admin/subaccount/SubAccountOverview';
import { SubAccountUsers } from '@/components/admin/subaccount/SubAccountUsers';
import { SubAccountModules } from '@/components/admin/subaccount/SubAccountModules';
import { SubAccountWorks } from '@/components/admin/subaccount/SubAccountWorks';
import { SubAccountSettings } from '@/components/admin/subaccount/SubAccountSettings';
import { ViewSwitcher } from '@/components/admin/subaccount/ViewSwitcher';
import { ClientsManager } from '@/components/hierarchy/ClientsManager';
import { useClientHierarchy } from '@/hooks/useClientHierarchy';
import { SubAccountOnboarding } from '@/components/admin/subaccount/SubAccountOnboarding';
import { SubAccountBranding } from '@/components/admin/subaccount/SubAccountBranding';

interface Company {
  id: string;
  name: string;
  display_name: string;
  contact_email: string;
  phone: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  slug: string;
  company_type?: string;
  parent_company_id?: string;
}

export default function SubAccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [moduleCount, setModuleCount] = useState(0);
  const [whitelabelEnabled, setWhitelabelEnabled] = useState(false);
  
  // Fetch hierarchy info
  const { isPublishingFirm, hasChildren, childCompanies } = useClientHierarchy(id);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (companyError) throw companyError;

      setCompany(companyData);

      // Fetch counts
      const { count: users } = await supabase
        .from('company_users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', id)
        .eq('status', 'active');

      const { count: modules } = await supabase
        .from('company_module_access')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', id)
        .eq('enabled', true);

      setUserCount(users || 0);
      setModuleCount(modules || 0);

      // Check if whitelabel_branding module is enabled
      const { data: wlModule } = await supabase
        .from('company_module_access')
        .select('enabled')
        .eq('company_id', id)
        .eq('module_id', 'whitelabel_branding')
        .maybeSingle();
      
      setWhitelabelEnabled(wlModule?.enabled || false);
    } catch (error) {
      console.error('Error fetching company details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sub-account details',
        variant: 'destructive',
      });
      navigate('/dashboard/operations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading sub-account details...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/operations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Operations
          </Button>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <p className="text-sm text-muted-foreground">{company.display_name}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
            {company.subscription_status}
          </Badge>
          <Badge variant="outline">{company.subscription_tier}</Badge>
          {(isPublishingFirm || hasChildren) && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Briefcase className="h-3 w-3 mr-1" />
              Publishing Firm ({childCompanies.length} clients)
            </Badge>
          )}
          <ViewSwitcher 
            companyId={company.id} 
            companyName={company.name}
            isPublishingFirm={isPublishingFirm || hasChildren}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moduleCount}</div>
            <p className="text-xs text-muted-foreground">Enabled features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Age</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((Date.now() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
            <p className="text-xs text-muted-foreground">Since creation</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Building2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            <ClipboardList className="h-4 w-4 mr-2" />
            Onboarding
          </TabsTrigger>
          {(isPublishingFirm || hasChildren) && (
            <TabsTrigger value="clients">
              <Briefcase className="h-4 w-4 mr-2" />
              Clients
            </TabsTrigger>
          )}
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="modules">
            <Shield className="h-4 w-4 mr-2" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="works">
            <Upload className="h-4 w-4 mr-2" />
            Works
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          {whitelabelEnabled && (
            <TabsTrigger value="branding">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SubAccountOverview company={company} onUpdate={fetchCompanyDetails} />
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <SubAccountOnboarding companyId={company.id} companyName={company.name} />
        </TabsContent>

        {(isPublishingFirm || hasChildren) && (
          <TabsContent value="clients" className="space-y-6">
            <ClientsManager parentCompanyId={company.id} parentCompanyName={company.display_name} />
          </TabsContent>
        )}

        <TabsContent value="users" className="space-y-6">
          <SubAccountUsers companyId={company.id} onUpdate={fetchCompanyDetails} />
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <SubAccountModules companyId={company.id} onUpdate={fetchCompanyDetails} />
        </TabsContent>

        <TabsContent value="works" className="space-y-6">
          <SubAccountWorks companyId={company.id} companyName={company.name} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SubAccountSettings company={company} onUpdate={fetchCompanyDetails} />
        </TabsContent>

        {whitelabelEnabled && (
          <TabsContent value="branding" className="space-y-6">
            <SubAccountBranding companyId={company.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
