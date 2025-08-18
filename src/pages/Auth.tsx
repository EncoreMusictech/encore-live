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

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isClient } = useClientPortal();

  // Update page metadata
  useEffect(() => {
    updatePageMetadata('auth');
  }, []);

  // Redirect authenticated users to appropriate page
  useEffect(() => {
    if (!user) return;
    (async () => {
      const ADMIN_EMAIL = 'info@encoremusic.tech';
      try {
        const hasPortal = await isClient();
        if (hasPortal && user.email !== ADMIN_EMAIL) {
          navigate('/client-portal', { replace: true });
          return;
        }
      } catch (e) {
        // ignore and fallback
      }
      const isDemoAccount = user.email === 'demo@encoremusic.tech';
      const defaultRedirect = isDemoAccount ? '/dashboard' : '/';
      const from = (location.state as any)?.from?.pathname || defaultRedirect;
      navigate(from, { replace: true });
    })();
  }, [user, navigate, location, isClient]);

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
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
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