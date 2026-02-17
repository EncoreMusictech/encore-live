import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, FileText, Clock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuditLog } from '@/hooks/useAuditLog';
import InvitedUserWelcomeModal from '@/components/InvitedUserWelcomeModal';

const TERMS_VERSION = '1.2.0';
const TERMS_LAST_UPDATED = 'January 8, 2025';

const InvitedUserTerms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logTermsAcceptance } = useAuditLog();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [companyName, setCompanyName] = useState<string>();
  const [userRole, setUserRole] = useState<string>();
  const [isClientUser, setIsClientUser] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Fetch company context for the invited user
    const fetchContext = async () => {
      // Check client_portal_access for role info
      const { data: access } = await supabase
        .from('client_portal_access')
        .select('subscriber_user_id, role, status')
        .eq('client_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (access) {
        setIsClientUser(true);
        setUserRole(access.role);
      }

      // Check company membership
      const { data: membership } = await supabase
        .from('company_users')
        .select('company_id, role, companies(display_name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership?.companies) {
        setCompanyName((membership.companies as any).display_name);
        if (!access) setUserRole(membership.role);
      }

      // Check if terms already accepted → skip to welcome or dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('terms_accepted, onboarding_complete')
        .eq('id', user.id)
        .single();

      if (profile?.terms_accepted && profile?.onboarding_complete) {
        // Already fully onboarded
        navigate(access ? '/client-portal' : '/dashboard', { replace: true });
      } else if (profile?.terms_accepted && !profile?.onboarding_complete) {
        // Terms accepted, show welcome
        setShowWelcome(true);
      }
    };

    fetchContext();
  }, [user, navigate]);

  const handleScroll = () => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    if (scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptTerms = async () => {
    if (!user || !hasScrolledToBottom || !agreedToTerms) return;

    try {
      setAccepting(true);
      const acceptedAt = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          terms_accepted: true,
          terms_accepted_at: acceptedAt,
          terms_version: TERMS_VERSION,
          onboarding_complete: false,
          // Mark payment as collected for invited users (they're under sub-account subscription)
          payment_method_collected: true,
          payment_setup_at: acceptedAt,
        });

      if (error) throw error;

      await logTermsAcceptance(TERMS_VERSION, acceptedAt);

      toast({ title: 'Terms Accepted', description: 'Setting up your account...' });

      // Show welcome modal instead of redirecting to payment
      setShowWelcome(true);
    } catch (error: any) {
      console.error('Error accepting terms:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save terms acceptance.',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    if (isClientUser) {
      navigate('/client-portal', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl mx-auto animate-fade-in">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Please review and accept our terms to get started
            </CardDescription>
            {companyName && (
              <Badge variant="secondary" className="mx-auto mt-2">
                <Shield className="h-3 w-3 mr-1" />
                Joining {companyName}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="relative">
              <ScrollArea
                ref={scrollAreaRef}
                className="h-[55vh] w-full rounded-md border p-6"
                onScrollCapture={handleScroll}
              >
                <div className="space-y-6 pr-4">
                  <section>
                    <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      By accessing and using Encore Music's services, you acknowledge that you have read,
                      understood, and agree to be bound by these Terms and Conditions. These terms constitute
                      a legally binding agreement between you and Encore Music.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">2. Description of Services</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Encore Music provides comprehensive music industry management services including but not
                      limited to copyright management, contract administration, royalty processing, sync licensing,
                      and catalog valuation tools.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
                    <div className="text-muted-foreground leading-relaxed space-y-2">
                      <p>As a user of our services, you agree to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Provide accurate and complete information</li>
                        <li>Maintain the confidentiality of your account credentials</li>
                        <li>Use the services in compliance with all applicable laws</li>
                        <li>Respect intellectual property rights</li>
                        <li>Not interfere with the proper functioning of our services</li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">4. Intellectual Property Rights</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      All content, features, and functionality of our services are owned by Encore Music and are
                      protected by copyright, trademark, and other intellectual property laws. You retain ownership
                      of your content but grant us necessary licenses to provide our services.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">5. Data Privacy and Security</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      We are committed to protecting your privacy and personal information. Our data handling
                      practices are governed by our Privacy Policy, which forms an integral part of these terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">6. Confidentiality</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      You agree to keep confidential any proprietary or sensitive information you may access through
                      our platform, including but not limited to financial data, contract terms, royalty information,
                      and catalog details belonging to other parties.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      To the maximum extent permitted by law, Encore Music shall not be liable for any indirect,
                      incidental, special, or consequential damages arising from your use of our services.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Either party may terminate this agreement with appropriate notice. Upon termination,
                      your access to the platform and its data will be revoked.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      These terms shall be governed by and construed in accordance with applicable laws.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      If you have any questions about these Terms and Conditions, please contact us at
                      support@encoremusic.tech.
                    </p>
                  </section>

                  <section className="border-t pt-6 mt-6">
                    <p className="text-sm text-muted-foreground">Last updated: {TERMS_LAST_UPDATED}</p>
                    <p className="text-xs text-muted-foreground mt-1">Version {TERMS_VERSION}</p>
                  </section>
                </div>
              </ScrollArea>

              {!hasScrolledToBottom && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Clock className="h-4 w-4" />
                    Please scroll to the bottom to continue
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/20">
              <Checkbox
                id="terms-agreement"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                disabled={!hasScrolledToBottom}
              />
              <label
                htmlFor="terms-agreement"
                className={`text-sm leading-relaxed ${!hasScrolledToBottom ? 'text-muted-foreground' : 'cursor-pointer'}`}
              >
                I have read, understood, and agree to be bound by these Terms and Conditions
              </label>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleAcceptTerms}
                disabled={!hasScrolledToBottom || !agreedToTerms || accepting}
                size="lg"
                className="min-w-[200px] animate-fade-in"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent mr-2" />
                    Accepting...
                  </>
                ) : hasScrolledToBottom && agreedToTerms ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Continue
                  </>
                ) : (
                  'Accept & Continue'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <InvitedUserWelcomeModal
        open={showWelcome}
        onClose={handleWelcomeClose}
        companyName={companyName}
        role={userRole}
      />
    </>
  );
};

export default InvitedUserTerms;
