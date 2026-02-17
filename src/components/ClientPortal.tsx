import { useState, useEffect } from 'react';
import { ClientPortalProvider } from '@/contexts/ClientPortalContext';
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
import { useClientBranding } from '@/hooks/useClientBranding';
import encoreLogo from '@/assets/encore-logo.png';
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
  const [isAdminViewing, setIsAdminViewing] = useState(false);
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);
  // Resolve branding for the viewed client (admin preview) or logged-in client
  // Resolve branding: try client's chain first, fallback to admin's company
  const brandingTargetId = searchParams.get('client_id') || user?.id;
  const { branding } = useClientBranding(brandingTargetId, user?.id);

  // Apply whitelabel branding as CSS custom properties on document root
  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', branding.colors.primary);
    root.style.setProperty('--accent', branding.colors.accent);
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
    };
  }, [branding]);
  useEffect(() => {
    const handleInvitationAndAccess = async () => {
      if (!user) return;
      
      try {
        // Check if admin is viewing a specific client's portal
        const clientId = searchParams.get('client_id');
        
        if (clientId) {
          // Check if current user is admin by checking user roles
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
            
          const isAdmin = !rolesError && userRoles?.some(r => r.role === 'admin');
          
          if (isAdmin) {
            // Admin viewing client portal - fetch client's permissions
            const { data: clientAccess, error: accessError } = await supabase
              .from('client_portal_access')
              .select('permissions, status')
              .eq('client_user_id', clientId)
              .eq('status', 'active')
              .single();
            
            if (!accessError && clientAccess) {
              setIsAdminViewing(true);
              setViewingClientId(clientId);
              setClientAccess(true);
              setPermissions((clientAccess.permissions as Record<string, any>) || {});
              
              // Get client's profile for greeting
              const { data: clientProfile } = await supabase.functions.invoke('get-user-details', {
                body: { userIds: [clientId] }
              });
              
              // Response shape: { users: [{ id, email, name, first_name, last_name }] }
              const clientUsers = clientProfile?.users || (Array.isArray(clientProfile) ? clientProfile : []);
              const clientData = clientUsers[0];
              if (clientData) {
                setProfile(clientData);
                const clientFirstName = clientData.first_name
                  || clientData.name?.split(' ')[0]
                  || clientData.email?.split('@')[0]
                  || 'Client';
                // Skip generic "User xxxxx" names from edge function
                const displayName = clientFirstName.startsWith('User ') ? (clientData.email?.split('@')[0] || 'Client') : clientFirstName;
                setGreeting(`Welcome Back, ${displayName}!`);
              }
            } else {
              toast({
                title: 'Client Not Found',
                description: 'The specified client does not have active portal access.',
                variant: 'destructive'
              });
              setClientAccess(false);
            }
            setLoading(false);
            return;
          }
        }
        
        // Regular client portal flow
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

  // Load profile and set greeting using user's first name
  useEffect(() => {
    // Wait until loading is done so isAdminViewing is resolved
    if (!user || loading || isAdminViewing) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) setProfile(data as any);
      // Use first_name from profile, then from auth metadata, then parse from email
      const firstName = (data?.first_name as string) 
        || (user.user_metadata?.first_name as string)
        || (user.user_metadata?.full_name as string)?.split(' ')[0]
        || (user.email?.split('@')[0] ?? 'there');
      const msg = data?.onboarding_complete ? `Welcome Back, ${firstName}!` : `Hello, ${firstName}!`;
      setGreeting(msg);
    };
    fetchProfile();
  }, [user, loading, isAdminViewing, branding]);
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

  const effectiveUserId = isAdminViewing && viewingClientId ? viewingClientId : (user?.id || '');

  return (
    <ClientPortalProvider effectiveUserId={effectiveUserId} isAdminPreview={isAdminViewing}>
    <div className="container mx-auto py-6">
      {invitationAccepted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Welcome to the Client Portal!</span>
          </div>
          <p className="text-green-700 mt-1">Your invitation has been accepted successfully.</p>
        </div>
      )}
      
      <header
        className="mb-6 rounded-xl p-6 overflow-hidden text-white relative"
        style={{
          background: branding
            ? `linear-gradient(135deg, hsl(${branding.colors.headerBg}), hsl(${branding.colors.primary}))`
            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
        }}
      >
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={`${branding.display_name || 'Company'} logo`}
                loading="lazy"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            ) : (
              <img
                src={encoreLogo}
                alt="ENCORE logo"
                loading="lazy"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain brightness-0 invert"
              />
            )}
          </div>

          {/* Title & user info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold truncate">
              {branding?.display_name || 'Client Portal'}
            </h1>
            <p className="text-sm opacity-90 mt-1">Manage your works, contracts, and royalties</p>
            {isAdminViewing && profile && (
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs opacity-80">Viewing portal for <span className="font-medium">{profile.name || profile.email || 'Client'}</span></p>
              </div>
            )}
            {!isAdminViewing && user?.email && (
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs opacity-80">Signed in as <span className="font-medium">{user.email}</span></p>
                <button
                  onClick={() => setProfileOpen(true)}
                  className="text-xs font-semibold opacity-90 hover:opacity-100 underline-offset-4 hover:underline"
                  aria-label="Open My Profile"
                >
                  My Profile
                </button>
              </div>
            )}
          </div>

          {/* Avatar & greeting */}
          <div className="hidden md:flex items-center gap-3">
            <Avatar className="h-12 w-12 shadow-md border-2 border-white/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Client avatar" loading="lazy" />
              <AvatarFallback className="bg-white/10 text-white">
                {((isAdminViewing ? (profile?.name?.[0] || 'C') : (profile?.first_name?.[0] || user?.email?.[0] || 'U')) as string).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium leading-tight">
              {greeting}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className="hidden sm:flex bg-white/10 text-white border-white/20 items-center gap-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" /> 
              {isAdminViewing ? 'Admin Preview' : 'Secured Access'}
            </Badge>
            {isAdminViewing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
                aria-label="Return to admin view"
                className="border-white/20 text-white hover:bg-white/10"
              >
                ← Back
              </Button>
            )}
            {!isAdminViewing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                aria-label="Sign out of Client Portal"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
        {branding && (
          <div className="mt-3 text-xs opacity-50">Powered by ENCORE</div>
        )}
      </header>

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
    </ClientPortalProvider>
  );
};

export default ClientPortal;