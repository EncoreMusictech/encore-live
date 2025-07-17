import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClientPortal } from '@/hooks/useClientPortal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, FileText, Music, DollarSign, Bell, Download } from 'lucide-react';
import { ClientDashboardOverview } from './client-portal/ClientDashboardOverview';
import { ClientContracts } from './client-portal/ClientContracts';
import { ClientWorks } from './client-portal/ClientWorks';
import { ClientSyncDeals } from './client-portal/ClientSyncDeals';
import { ClientRoyalties } from './client-portal/ClientRoyalties';
import { ClientNotifications } from './client-portal/ClientNotifications';

export const ClientPortal = () => {
  const { user } = useAuth();
  const { isClient, getClientPermissions } = useClientPortal();
  const [clientAccess, setClientAccess] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkClientAccess = async () => {
      if (!user) return;
      
      try {
        const isClientUser = await isClient();
        setClientAccess(isClientUser);
        
        if (isClientUser) {
          const clientPermissions = await getClientPermissions();
          setPermissions((clientPermissions as Record<string, any>) || {});
        }
      } catch (error) {
        console.error('Error checking client access:', error);
      } finally {
        setLoading(false);
      }
    };

    checkClientAccess();
  }, [user, isClient, getClientPermissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!clientAccess) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have access to the client portal. Please contact your administrator for access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enabledTabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: Users, enabled: true },
    { id: 'contracts', label: 'My Contracts', icon: FileText, enabled: permissions.contracts?.enabled },
    { id: 'works', label: 'My Works', icon: Music, enabled: permissions.copyright?.enabled },
    { id: 'sync-deals', label: 'Sync Deals', icon: FileText, enabled: permissions['sync-licensing']?.enabled },
    { id: 'royalties', label: 'Royalties & Payouts', icon: DollarSign, enabled: permissions.royalties?.enabled },
    { id: 'notifications', label: 'Notifications & Downloads', icon: Bell, enabled: true }
  ].filter(tab => tab.enabled);

  const defaultTab = enabledTabs[0]?.id || 'overview';

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Client Portal</h1>
        <p className="text-muted-foreground mt-2">
          Manage your works, contracts, and royalties
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full">
          {enabledTabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ClientDashboardOverview permissions={permissions} />
        </TabsContent>

        {permissions.contracts?.enabled && (
          <TabsContent value="contracts" className="space-y-6">
            <ClientContracts permissions={permissions.contracts} />
          </TabsContent>
        )}

        {permissions.copyright?.enabled && (
          <TabsContent value="works" className="space-y-6">
            <ClientWorks permissions={permissions.copyright} />
          </TabsContent>
        )}

        {permissions['sync-licensing']?.enabled && (
          <TabsContent value="sync-deals" className="space-y-6">
            <ClientSyncDeals permissions={permissions['sync-licensing']} />
          </TabsContent>
        )}

        {permissions.royalties?.enabled && (
          <TabsContent value="royalties" className="space-y-6">
            <ClientRoyalties permissions={permissions.royalties} />
          </TabsContent>
        )}

        <TabsContent value="notifications" className="space-y-6">
          <ClientNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
};