import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Music } from 'lucide-react';

type Step = 'loading' | 'create-account' | 'set-password' | 'accepting' | 'success' | 'error';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [invitation, setInvitation] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Validate the token
  useEffect(() => {
    if (!token) {
      setStep('error');
      setErrorMessage('No invitation token provided.');
      return;
    }

    const validateToken = async () => {
      const { data, error } = await supabase
        .from('client_invitations')
        .select('*')
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setStep('error');
        setErrorMessage('This invitation is invalid, expired, or has already been accepted.');
        return;
      }

      setInvitation(data);
      setEmail(data.email);

      // If user is already logged in with the right email, skip to accepting
      if (user && user.email?.toLowerCase() === data.email.toLowerCase()) {
        await acceptInvitation(data, user.id, user.email!);
        return;
      }

      // Check if user already exists
      // We try to sign in with a dummy password to detect if the account exists
      // Better approach: check via edge function
      setStep('create-account');
    };

    validateToken();
  }, [token]);

  // If user logs in while on this page
  useEffect(() => {
    if (user && invitation && step === 'create-account') {
      if (user.email?.toLowerCase() === invitation.email.toLowerCase()) {
        acceptInvitation(invitation, user.id, user.email!);
      }
    }
  }, [user, invitation, step]);

  const acceptInvitation = async (inv: any, userId: string, userEmail: string) => {
    setStep('accepting');
    try {
      const { error } = await supabase.rpc('accept_client_invitation', {
        p_token: inv.invitation_token,
        p_accepter: userId,
        p_accepter_email: userEmail,
      });

      if (error) throw error;
      setStep('success');
    } catch (err: any) {
      console.error('Accept invitation error:', err);
      // Check if they already have access
      const { data: existing } = await supabase
        .from('client_portal_access')
        .select('*')
        .eq('client_user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        setStep('success');
      } else {
        setStep('error');
        setErrorMessage(err.message || 'Failed to accept invitation.');
      }
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Try signing in first (account may have been auto-provisioned with temp password)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split('@')[0] },
        },
      });

      if (signUpError) {
        // Account exists — try sign in
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          // If auto-provisioned, they need to sign in with temp password first, then update
          setStep('set-password');
          setLoading(false);
          return;
        }
        throw signUpError;
      }

      // Sign in after sign up
      const { error: loginError } = await signIn(email, password);
      if (loginError) throw loginError;

      // acceptInvitation will be triggered by the user useEffect
    } catch (err: any) {
      console.error('Account creation error:', err);
      toast({
        title: 'Account creation failed',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      // acceptInvitation will be triggered by the user useEffect
    } catch (err: any) {
      toast({
        title: 'Sign in failed',
        description: err.message || 'Invalid credentials.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPortal = () => {
    navigate('/client-portal');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <Music className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">ENCORE</span>
          </div>
        </div>

        {step === 'loading' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Validating your invitation...</p>
            </CardContent>
          </Card>
        )}

        {step === 'create-account' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome to ENCORE</CardTitle>
              <CardDescription>
                Create your account to access the client portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Account & Accept Invitation
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setStep('set-password')}
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'set-password' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Sign in with your existing credentials to accept the invitation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In & Accept Invitation
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setStep('create-account')}
                  >
                    Don't have an account? Create one
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'accepting' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Setting up your portal access...</p>
            </CardContent>
          </Card>
        )}

        {step === 'success' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle className="h-12 w-12 text-primary" />
              <h2 className="text-xl font-semibold">You're all set!</h2>
              <p className="text-muted-foreground text-center">
                Your client portal access has been activated. You can now view your works, contracts, royalties, and more.
              </p>
              <Button onClick={handleGoToPortal} className="w-full max-w-xs">
                Go to Client Portal
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'error' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Invitation Error</h2>
              <p className="text-muted-foreground text-center">{errorMessage}</p>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
