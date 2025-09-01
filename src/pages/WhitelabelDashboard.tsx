import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandConfigurationPanel } from '@/components/whitelabel/BrandConfigurationPanel';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Settings, Users, Globe, Palette, Zap, Shield } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function WhitelabelDashboard() {
  const { user } = useAuth();
  const { tenantConfig, loading, refreshTenant } = useTenant();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  const handleCreateTenant = async () => {
    if (!user) return;

    setCreating(true);
    try {
      const defaultSlug = `tenant-${Date.now()}`;
      const { error } = await supabase
        .from('tenant_configurations')
        .insert({
          user_id: user.id,
          tenant_slug: defaultSlug,
          tenant_name: 'My Enterprise Platform',
          enabled_modules: ['catalog-valuation', 'deal-simulator'],
        });

      if (error) throw error;

      await refreshTenant();
      toast({
        title: 'Tenant created successfully',
        description: 'Your whitelabel configuration has been initialized.',
      });
    } catch (error) {
      toast({
        title: 'Error creating tenant',
        description: 'Failed to initialize your whitelabel configuration.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading whitelabel configuration...</p>
        </div>
      </div>
    );
  }

  if (!tenantConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Enterprise Whitelabel
            </CardTitle>
            <CardDescription>
              Create your branded music rights management platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-medium">Get Started</h3>
              <p className="text-sm text-muted-foreground">
                Initialize your whitelabel configuration to begin customizing your platform
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Palette className="h-3 w-3 text-primary" />
                Custom Branding
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-primary" />
                Custom Domain
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-primary" />
                User Management
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-primary" />
                Enterprise Security
              </div>
            </div>
            
            <Button 
              onClick={handleCreateTenant} 
              disabled={creating}
              className="w-full"
            >
              {creating ? 'Initializing...' : 'Initialize Whitelabel Platform'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Enterprise Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your whitelabel music rights management platform
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              {tenantConfig.subscription_tier}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{tenantConfig.status}</div>
              <p className="text-xs text-muted-foreground">
                Platform status
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enabled Modules</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantConfig.enabled_modules.length}</div>
              <p className="text-xs text-muted-foreground">
                of 6 available modules
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Domain Status</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantConfig.custom_domain ? 'Custom' : 'Default'}
              </div>
              <p className="text-xs text-muted-foreground">
                {tenantConfig.custom_domain || 'No custom domain set'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <BrandConfigurationPanel />
      </div>
    </div>
  );
}