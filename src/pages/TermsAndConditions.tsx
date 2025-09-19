import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { updatePageMetadata } from '@/utils/seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TermsAndConditions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    updatePageMetadata('terms');
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleScroll = () => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const scrollTop = scrollArea.scrollTop;
    const scrollHeight = scrollArea.scrollHeight;
    const clientHeight = scrollArea.clientHeight;
    
    // Check if scrolled to bottom (with 10px tolerance)
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptTerms = async () => {
    if (!user || !hasScrolledToBottom || !agreedToTerms) return;

    try {
      setAccepting(true);

      // Update user profile to mark terms as accepted
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          onboarding_complete: false // Will be set to true after welcome modal
        });

      if (error) throw error;

      toast({
        title: "Terms Accepted",
        description: "Welcome to Encore Music! Redirecting to dashboard...",
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Error accepting terms:', error);
      toast({
        title: "Error",
        description: "Failed to save terms acceptance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Please review and accept our terms and conditions to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="relative">
            <ScrollArea 
              ref={scrollAreaRef}
              className="h-[60vh] w-full rounded-md border p-6"
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
                    and catalog valuation. Our platform enables efficient management of music intellectual property 
                    and related business operations.
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
                    We implement industry-standard security measures to protect your data.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Financial Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our fee structure and payment terms are outlined in your specific service agreement. 
                    All fees are non-refundable unless otherwise specified. We reserve the right to modify 
                    our pricing with appropriate notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To the maximum extent permitted by law, Encore Music shall not be liable for any indirect, 
                    incidental, special, or consequential damages arising from your use of our services. Our 
                    total liability shall not exceed the amount paid by you for our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Either party may terminate this agreement with appropriate notice as specified in your 
                    service agreement. Upon termination, certain provisions of these terms shall survive, 
                    including those related to intellectual property and limitation of liability.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    These terms shall be governed by and construed in accordance with the laws of the 
                    jurisdiction in which Encore Music operates, without regard to conflict of law principles.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about these Terms and Conditions, please contact us at 
                    support@encoremusic.tech or through our customer support channels.
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
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
                  Accept Terms & Continue
                </>
              ) : (
                'Accept Terms & Continue'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsAndConditions;