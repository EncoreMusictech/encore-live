import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { updatePageMetadata } from '@/utils/seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, FileText, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuditLog } from '@/hooks/useAuditLog';

const TERMS_VERSION = '1.2.0';
const TERMS_LAST_UPDATED = 'January 8, 2025';

const TermsAndConditions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { logTermsAcceptance } = useAuditLog();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToValuationDisclaimer, setAgreedToValuationDisclaimer] = useState(false);
  const [isSophisticatedInvestor, setIsSophisticatedInvestor] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if user is signing up for valuation module
  const modules = searchParams.get('modules')?.split(',') || [];
  const hasValuationModule = modules.includes('valuation') || 
    searchParams.get('identifier') === 'enterprise' ||
    searchParams.get('type') === 'bundle';

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

  const canAccept = () => {
    if (!hasScrolledToBottom || !agreedToTerms) return false;
    if (hasValuationModule && (!agreedToValuationDisclaimer || !isSophisticatedInvestor)) return false;
    return true;
  };

  const handleAcceptTerms = async () => {
    if (!user || !canAccept()) return;

    try {
      setAccepting(true);

      const acceptedAt = new Date().toISOString();

      // Update user profile to mark terms as accepted with version tracking
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          terms_accepted: true,
          terms_accepted_at: acceptedAt,
          terms_version: TERMS_VERSION,
          onboarding_complete: false // Will be set to true after welcome modal
        });

      if (error) throw error;

      // Log terms acceptance for SOC2 compliance
      await logTermsAcceptance(TERMS_VERSION, acceptedAt);

      if (error) throw error;

      toast({
        title: "Terms Accepted",
        description: "Setting up your payment method...",
      });

      // Redirect to payment setup instead of dashboard
      const { data, error: checkoutError } = await supabase.functions.invoke('create-setup-checkout', {
        method: 'POST'
      });

      if (checkoutError) throw checkoutError;
      if (!data?.url) throw new Error('No checkout URL returned');

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Error accepting terms:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save terms acceptance. Please try again.",
        variant: "destructive"
      });
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
                    and catalog valuation tools. Our platform enables efficient management of music intellectual property 
                    and related business operations.
                  </p>
                </section>

                {/* Financial & Investment Disclaimer Section */}
                <section className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h2 className="text-xl font-semibold text-amber-600 dark:text-amber-400">3. Important Financial Disclaimer</h2>
                  </div>
                  <div className="text-muted-foreground leading-relaxed space-y-4">
                    <p className="font-medium text-foreground">
                      ENCORE MUSIC IS NOT A REGISTERED INVESTMENT ADVISOR, BROKER-DEALER, OR FINANCIAL PLANNER. 
                      THE INFORMATION PROVIDED THROUGH OUR PLATFORM, INCLUDING BUT NOT LIMITED TO THE CATALOG 
                      VALUATION TOOL, DEAL SIMULATION FEATURES, AND ANY FINANCIAL PROJECTIONS, IS FOR 
                      INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY.
                    </p>
                    <div className="space-y-2">
                      <p><strong>No Investment Advice:</strong> Nothing contained on our platform constitutes investment advice, 
                      a recommendation, or a solicitation to buy, sell, or hold any security, financial product, or instrument. 
                      Any valuation estimates, projections, or analyses provided are hypothetical in nature and should not be 
                      relied upon for making investment decisions.</p>
                      
                      <p><strong>No Financial Advisory Relationship:</strong> Use of our services does not create a fiduciary, 
                      advisory, or professional relationship between you and Encore Music. We do not provide personalized 
                      financial, legal, tax, or accounting advice.</p>
                      
                      <p><strong>Accuracy of Information:</strong> While we strive to provide accurate and up-to-date information, 
                      we make no representations or warranties regarding the accuracy, completeness, or reliability of any 
                      valuations, projections, or estimates generated by our tools. Market conditions, industry trends, and 
                      individual circumstances can significantly affect actual outcomes.</p>
                      
                      <p><strong>Independent Professional Advice:</strong> Before making any investment, acquisition, or significant 
                      financial decision regarding music catalogs or intellectual property, you should consult with qualified 
                      professionals including registered investment advisors, attorneys, accountants, and other specialists 
                      appropriate to your situation.</p>
                      
                      <p><strong>Risk Acknowledgment:</strong> Investing in music catalogs and intellectual property involves 
                      substantial risk, including the potential loss of principal. Past performance is not indicative of 
                      future results. Valuations provided by our tools are estimates only and may differ materially from 
                      actual market values or transaction prices.</p>
                    </div>
                  </div>
                </section>

                {/* Catalog Valuation Tool Specific Disclaimer */}
                <section className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">4. Catalog Valuation Tool Disclaimer</h2>
                    <Badge variant="outline" className="ml-2">Valuation Module</Badge>
                  </div>
                  <div className="text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      The Catalog Valuation Tool and Deal Simulation features are analytical tools designed to provide 
                      educational insights into music catalog valuation methodologies. These tools utilize publicly 
                      available data, industry benchmarks, and standardized financial models to generate estimates.
                    </p>
                    <div className="bg-background/50 rounded p-3 border">
                      <p className="font-medium text-foreground mb-2">By using the Catalog Valuation Tool, you acknowledge and agree that:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                        <li>Valuations are estimates only and are <strong>NOT investment recommendations</strong></li>
                        <li>Actual market values may vary significantly from tool-generated estimates</li>
                        <li>The tool does not account for all factors that may affect catalog value</li>
                        <li>Revenue projections are based on historical patterns and may not reflect future performance</li>
                        <li>DCF calculations use assumptions that may not apply to your specific situation</li>
                        <li>Multiple-based valuations rely on industry benchmarks that may not be current</li>
                        <li>You will seek independent professional valuation advice before any transaction</li>
                        <li>Encore Music bears no responsibility for decisions made based on tool outputs</li>
                      </ul>
                    </div>
                    <p className="text-xs italic">
                      *This tool is intended for sophisticated investors, music industry professionals, and individuals 
                      with experience in intellectual property transactions who understand the inherent limitations 
                      of financial modeling tools.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">5. User Responsibilities</h2>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>As a user of our services, you agree to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Provide accurate and complete information</li>
                      <li>Maintain the confidentiality of your account credentials</li>
                      <li>Use the services in compliance with all applicable laws</li>
                      <li>Respect intellectual property rights</li>
                      <li>Not interfere with the proper functioning of our services</li>
                      <li>Conduct your own due diligence before making financial decisions</li>
                      <li>Seek professional advice for investment and transaction decisions</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Intellectual Property Rights</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    All content, features, and functionality of our services are owned by Encore Music and are 
                    protected by copyright, trademark, and other intellectual property laws. You retain ownership 
                    of your content but grant us necessary licenses to provide our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Data Privacy and Security</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We are committed to protecting your privacy and personal information. Our data handling 
                    practices are governed by our Privacy Policy, which forms an integral part of these terms. 
                    We implement industry-standard security measures to protect your data.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Financial Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our fee structure and payment terms are outlined in your specific service agreement. 
                    All fees are non-refundable unless otherwise specified. We reserve the right to modify 
                    our pricing with appropriate notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      To the maximum extent permitted by law, Encore Music shall not be liable for any indirect, 
                      incidental, special, or consequential damages arising from your use of our services. Our 
                      total liability shall not exceed the amount paid by you for our services.
                    </p>
                    <p className="font-medium">
                      WITHOUT LIMITING THE FOREGOING, ENCORE MUSIC SPECIFICALLY DISCLAIMS ALL LIABILITY FOR ANY 
                      LOSSES, DAMAGES, OR COSTS ARISING FROM RELIANCE ON VALUATIONS, PROJECTIONS, OR OTHER 
                      FINANCIAL INFORMATION PROVIDED BY OUR TOOLS, INCLUDING THE CATALOG VALUATION TOOL AND 
                      DEAL SIMULATION FEATURES.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You agree to indemnify, defend, and hold harmless Encore Music, its officers, directors, 
                    employees, and agents from any claims, damages, losses, or expenses arising from your use 
                    of our services, including but not limited to any investment or business decisions made 
                    based on information obtained through our platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Either party may terminate this agreement with appropriate notice as specified in your 
                    service agreement. Upon termination, certain provisions of these terms shall survive, 
                    including those related to intellectual property, limitation of liability, and indemnification.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    These terms shall be governed by and construed in accordance with the laws of the 
                    jurisdiction in which Encore Music operates, without regard to conflict of law principles.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">13. Contact Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about these Terms and Conditions, please contact us at 
                    support@encoremusic.tech or through our customer support channels.
                  </p>
                </section>

                {/* Small Print Disclaimer */}
                <section className="border-t pt-6 mt-6">
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    *DISCLAIMER: Encore Music and its Catalog Valuation Tool are not registered investment advisors, 
                    broker-dealers, or financial planners. All valuation estimates, projections, and analyses are 
                    provided for informational and educational purposes only and do not constitute investment advice, 
                    recommendations, or endorsements. Past performance is not indicative of future results. Users 
                    should consult with qualified financial, legal, and tax professionals before making any investment 
                    or transaction decisions. Encore Music makes no guarantees regarding the accuracy or reliability 
                    of any information provided and disclaims all liability for decisions made based on such information. 
                    By using our services, you acknowledge that you understand these limitations and assume full 
                    responsibility for your investment and business decisions.
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Last updated: {TERMS_LAST_UPDATED}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Version {TERMS_VERSION}
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

          {/* General Terms Agreement */}
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

          {/* Valuation Disclaimer Agreement - Only shown for users with valuation module access */}
          {hasValuationModule && (
            <>
              <div className="flex items-center space-x-2 p-4 border border-amber-500/30 rounded-lg bg-amber-500/5">
                <Checkbox 
                  id="valuation-disclaimer" 
                  checked={agreedToValuationDisclaimer}
                  onCheckedChange={(checked) => setAgreedToValuationDisclaimer(checked === true)}
                  disabled={!hasScrolledToBottom}
                />
                <label 
                  htmlFor="valuation-disclaimer" 
                  className={`text-sm leading-relaxed ${!hasScrolledToBottom ? 'text-muted-foreground' : 'cursor-pointer'}`}
                >
                  <span className="font-medium">Financial Disclaimer:</span> I understand that Encore Music is NOT a 
                  financial advisor and that all valuations, projections, and analyses provided by the Catalog Valuation 
                  Tool are for informational purposes only and do NOT constitute investment advice or recommendations.
                </label>
              </div>

              {/* Sophisticated Investor Self-Identification */}
              <div className="flex items-start space-x-2 p-4 border border-primary/30 rounded-lg bg-primary/5">
                <Checkbox 
                  id="sophisticated-investor" 
                  checked={isSophisticatedInvestor}
                  onCheckedChange={(checked) => setIsSophisticatedInvestor(checked === true)}
                  disabled={!hasScrolledToBottom}
                  className="mt-1"
                />
                <label 
                  htmlFor="sophisticated-investor" 
                  className={`text-sm leading-relaxed ${!hasScrolledToBottom ? 'text-muted-foreground' : 'cursor-pointer'}`}
                >
                  <span className="font-medium">Sophisticated Investor Acknowledgment:</span> I represent that I am a 
                  sophisticated investor, music industry professional, or individual with experience in intellectual 
                  property transactions. I understand the inherent risks and limitations of financial modeling tools, 
                  and I have the knowledge and experience to evaluate the merits and risks of any investment decisions. 
                  I acknowledge that I will conduct my own due diligence and seek independent professional advice 
                  before making any acquisition, investment, or significant financial decision based on information 
                  from the Catalog Valuation Tool.
                </label>
              </div>
            </>
          )}

          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleAcceptTerms}
              disabled={!canAccept() || accepting}
              size="lg"
              className="min-w-[200px] animate-fade-in"
            >
              {accepting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent mr-2" />
                  Accepting...
                </>
              ) : canAccept() ? (
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