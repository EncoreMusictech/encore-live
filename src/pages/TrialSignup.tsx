import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { updatePageMetadata } from '@/utils/seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Building2, User, Mail, Lock } from 'lucide-react';
import { validateEmail, validatePassword, sanitizeInput, clientRateLimit, logSecurityEvent } from '@/lib/security';
const TrialSignup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();

  // Get trial params from URL
  const trialType = searchParams.get('type') || 'custom';
  const trialIdentifier = searchParams.get('identifier') || 'custom';
  const trialModules = searchParams.get('modules')?.split(',') || [];
  const billingInterval = searchParams.get('billing') as 'month' | 'year' || 'month';
  useEffect(() => {
    updatePageMetadata('trial-signup');
  }, []);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting
    const clientIp = 'trial-signup-attempt';
    if (!clientRateLimit(clientIp, 5, 900000)) {
      toast({
        title: "Too many attempts",
        description: "Please try again later.",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!firstName.trim() || !lastName.trim() || !companyName.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }
    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase(), 320);
    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Weak password",
        description: passwordValidation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: sanitizeInput(firstName.trim(), 100),
            last_name: sanitizeInput(lastName.trim(), 100),
            company_name: sanitizeInput(companyName.trim(), 200),
            trial_type: trialType,
            trial_identifier: trialIdentifier,
            trial_modules: trialModules,
            billing_interval: billingInterval
          }
        }
      });
      if (error) {
        logSecurityEvent('trial_signup_failed', {
          email: sanitizedEmail,
          error: error.message
        });
        let errorMessage = "Sign up failed. Please try again.";
        if (error.message.includes('already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        }
        toast({
          title: "Sign up failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      logSecurityEvent('trial_signup_success', {
        email: sanitizedEmail
      });

      // If user was created, update their profile with additional info
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          first_name: sanitizeInput(firstName.trim(), 100),
          last_name: sanitizeInput(lastName.trim(), 100),
          company_name: sanitizeInput(companyName.trim(), 200)
        });
      }
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account, then you'll be directed to accept our terms."
      });

      // Redirect to terms page - they'll be redirected there after email confirmation
      navigate('/terms');
    } catch (error: any) {
      console.error('Trial signup error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Start Your Free Trial</CardTitle>
          </div>
          <CardDescription>Create your account to begin your 14-day free trial. You will not be charged until the trial has ended.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="firstName" type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} className="pl-9" required maxLength={100} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="lastName" type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className="pl-9" required maxLength={100} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="companyName" type="text" placeholder="Your Company" value={companyName} onChange={e => setCompanyName(e.target.value)} className="pl-9" required maxLength={200} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="john@company.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required maxLength={320} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Choose a secure password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required minLength={8} />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account & Continue'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <Button type="button" variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/auth')}>
                Sign in
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>;
};
export default TrialSignup;