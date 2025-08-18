import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClientPortal } from '@/hooks/useClientPortal';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, FileText, Music, DollarSign, Bell, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientDashboardOverview } from './client-portal/ClientDashboardOverview';
import { ClientContracts } from './client-portal/ClientContracts';
import { ClientWorks } from './client-portal/ClientWorks';
import { ClientSyncDeals } from './client-portal/ClientSyncDeals';
import { ClientRoyalties } from './client-portal/ClientRoyalties';
import { ClientNotifications } from './client-portal/ClientNotifications';
import { ShieldCheck } from 'lucide-react';
import { updatePageMetadata } from '@/utils/seo';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { ClientProfileForm } from './client-portal/ClientProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
const ClientPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { isClient, getClientPermissions, acceptInvitation } = useClientPortal();
  const [clientAccess, setClientAccess] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [invitationAccepted, setInvitationAccepted] = useState(false);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [greeting, setGreeting] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    const handleInvitationAndAccess = async () => {
      if (!user) return;
      
      try {
        // Check if there's an invitation token in the URL
        const token = searchParams.get('token');
        
        if (token) {
          // Try to accept the invitation
          const access = await acceptInvitation(token);

          // Remove token from URL regardless to prevent repeated attempts
          window.history.replaceState({}, '', '/client-portal');
          
          if (access) {
            setInvitationAccepted(true);
            toast({
              title: 'Welcome!',
              description: 'Invitation accepted successfully. Welcome to the client portal!',
            });
            setClientAccess(true);
            const clientPermissions = await getClientPermissions();
            setPermissions((clientPermissions as Record<string, any>) || {});
          } else {
            // Fallback: if access already exists, proceed
            const isClientUser = await isClient();
            setClientAccess(isClientUser);
            if (isClientUser) {
              const clientPermissions = await getClientPermissions();
              setPermissions((clientPermissions as Record<string, any>) || {});
              toast({ title: 'Access active', description: 'Your client portal access is already active.' });
            } else {
              toast({
                title: 'Invalid Invitation',
                description: 'The invitation link is invalid or has expired.',
                variant: 'destructive'
              });
            }
          }
        } else {
          // No token, check existing client access
          const isClientUser = await isClient();
          setClientAccess(isClientUser);
          
          if (isClientUser) {
            const clientPermissions = await getClientPermissions();
            setPermissions((clientPermissions as Record<string, any>) || {});
          }
        }
      } catch (error) {
        console.error('Error handling invitation or checking client access:', error);
        toast({
          title: 'Error',
          description: 'An error occurred while processing your request.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    handleInvitationAndAccess();
  }, [user, searchParams, isClient, getClientPermissions, acceptInvitation, toast]);

  // SEO metadata
  useEffect(() => {
    updatePageMetadata('clientPortal');
  }, []);

  // Load profile and set greeting
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) setProfile(data as any);
      const firstName = (data?.first_name as string) || (user.user_metadata?.first_name as string) || (user.email?.split('@')[0] ?? 'there');
      const msg = data?.onboarding_complete ? `Welcome Back, ${firstName}!` : `Hello, ${firstName}!`;
      setGreeting(msg);
    };
    fetchProfile();
  }, [user]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Temporarily bypass authentication for UI demo
  const showDemo = false; // Authentication enabled
  
  if (!showDemo && !clientAccess) {
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
      window.location.href = '/auth';
    } catch (err: any) {
      console.error('Sign out error:', err);
      toast({ title: 'Sign out failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const defaultTab = enabledTabs[0]?.id || 'overview';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Client Portal</h1>
              <p className="text-white/80">Manage your works, contracts, and royalties</p>
              <p className="text-sm text-white/60 mt-1">
                Signed in as {user?.email}
              </p>
              <Button
                variant="ghost"
                onClick={() => setProfileOpen(true)}
                className="text-white hover:bg-white/10 p-0 h-auto mt-2 text-sm"
              >
                My Profile
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>{((profile?.first_name?.[0] || user?.email?.[0] || 'U') as string).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="font-semibold">{greeting}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Secured Client Access</span>
              </div>
              <Button onClick={handleSignOut} variant="ghost" className="text-white hover:bg-white/10">
                Sign Out
              </Button>
              <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-black rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {invitationAccepted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Welcome to the Client Portal!</span>
            </div>
            <p className="text-green-700 mt-1">Your invitation has been accepted successfully.</p>
          </div>
        )}

        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md max-w-[520px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>My Profile</DialogTitle>
            </DialogHeader>
            <ClientProfileForm
              profile={profile as any}
              userEmail={user?.email || ''}
              onSaved={(p) => {
                setProfile(p as any);
                const name = (p.first_name as string) || (user?.email?.split('@')[0] ?? 'there');
                setGreeting(`Welcome Back, ${name}!`);
                setProfileOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

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
    </div>
  );
};

export default ClientPortal;