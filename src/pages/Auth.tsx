import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updatePageMetadata } from '@/utils/seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PlayCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useClientPortal } from '@/hooks/useClientPortal';
import { fetchActiveCompanyMemberships, isInternalEnterpriseMembership } from '@/lib/companyMembership';


const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSetNewPassword, setShowSetNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signIn, signUp, user, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isClient } = useClientPortal();
  const fromFeatures = (location.state as any)?.fromFeatures;
  const moduleName = (location.state as any)?.moduleName;
  

  // Update page metadata
  useEffect(() => {
    updatePageMetadata('auth');
  }, []);

useEffect(() => {
  // Detect Supabase recovery link and auth event
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const hasRecoveryInHash = hash.includes('type=recovery');
  const params = new URLSearchParams(search);
  if (hasRecoveryInHash || params.get('recovery') === '1') {
    setShowSetNewPassword(true);
    if (hasRecoveryInHash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      setShowSetNewPassword(true);
    }
  });
  return () => subscription.unsubscribe();
}, []);

  // Redirect authenticated users to appropriate page
  useEffect(() => {
    if (!user) return;
    
    // Don't redirect if we're in password recovery mode
    if (showSetNewPassword) return;
    
    // Don't redirect if user is already on client portal (allow admins to view it)
    if (location.pathname === '/client-portal') return;
    
    (async () => {
      const ADMIN_EMAILS = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'];
      const isDemoAccount = user.email === 'demo@encoremusic.tech';
      const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
      
      try {
        // Check if user has accepted terms and completed payment setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('terms_accepted, onboarding_complete, payment_method_collected')
          .eq('id', user.id)
          .single();

        // Check if user belongs to an internal enterprise company (no payment required)
        const memberships = await fetchActiveCompanyMemberships(user.id);
        const isInternalEnterprise = isInternalEnterpriseMembership(memberships);

        // Check if user has client portal access (invited user under sub-account)
        const hasPortal = await isClient();
        
        // Check if user is a sub-account team member (company_users)
        const { data: companyMembership } = await supabase
          .from('company_users')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        const isInvitedUser = hasPortal || !!companyMembership;

        // Invited users (clients/team members) bypass payment but must accept terms
        if (isInvitedUser && !profile?.terms_accepted) {
          navigate('/invited-terms', { replace: true });
          return;
        }

        // Non-invited users: standard terms flow
        if (!isInvitedUser && !profile?.terms_accepted) {
          navigate('/terms', { replace: true });
          return;
        }

        // Non-invited users: payment setup required
        if (!isInvitedUser && !profile?.payment_method_collected && !isDemoAccount && !isAdmin && !isInternalEnterprise) {
          navigate('/payment-setup', { replace: true });
          return;
        }

        // Invited client users go to client portal — but NOT if they are
        // a team member of a non-client-label company (sub-account users get dashboard)
        if (hasPortal && !isAdmin) {
          const isSubAccountTeamMember = memberships.some((m) => {
            const c = m.companies as any;
            return c && c.company_type !== 'client_label';
          });
          if (!isSubAccountTeamMember) {
            navigate('/client-portal', { replace: true });
            return;
          }
        }

        // If user has completed payment setup or is invited team member, go to dashboard
        if (profile?.payment_method_collected || isDemoAccount || isAdmin || isInternalEnterprise || isInvitedUser) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.error('Auth redirect error:', e);
        // Fallback to dashboard for any errors
      }
      
      // Default to dashboard for authenticated users
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    })();
  }, [user, navigate, location, isClient, showSetNewPassword]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signUp(email, password);
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await resetPassword(email);
    setLoading(false);
    setShowForgotPassword(false);
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (newPassword.length < 6) {
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Update password error:', error);
      } else {
        await supabase.auth.signOut();
        setShowSetNewPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        navigate('/auth', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      console.log('Starting demo login...');
      
      // Try to sign in first
      const { error: signInError } = await signIn('demo@encoremusic.tech', 'demo123');
      console.log('First sign in attempt result:', { signInError });
      
      if (signInError) {
        console.log('Sign in failed, attempting to create demo user...');
        
        // If sign in fails, create the demo user via edge function
        const response = await supabase.functions.invoke('create-demo-user', {
          method: 'POST'
        });
        
        console.log('Create demo user response:', response);
        
        if (!response.error) {
          console.log('Demo user created, attempting sign in again...');
          // Try to sign in again after creating the user
          const { error: secondSignInError } = await signIn('demo@encoremusic.tech', 'demo123');
          console.log('Second sign in attempt result:', { secondSignInError });
        } else {
          console.error('Failed to create demo user:', response.error);
        }
      } else {
        console.log('Demo login successful on first attempt');
      }
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Encore Music</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one to manage your music copyrights and contracts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fromFeatures && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-center">
              <p className="font-medium">Want to explore {moduleName || 'this feature'}?</p>
              <p className="text-muted-foreground mt-1">
                Use the <strong>Try Demo Account</strong> button below to get instant access — no signup needed.
              </p>
            </div>
          )}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {showSetNewPassword ? (
                <form onSubmit={handleSetNewPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setShowSetNewPassword(false)}
                  >
                    Back to Sign In
                  </Button>
                </form>
              ) : showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending reset link...' : 'Send Reset Link'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Back to Sign In
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-sm text-muted-foreground"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <Separator className="my-4" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Want to try the app without signing up?
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                {loading ? 'Logging in...' : 'Try Demo Account'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Demo account has access to all modules
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;