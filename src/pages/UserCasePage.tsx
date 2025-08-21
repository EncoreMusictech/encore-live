import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle2, Music, Scale, Briefcase, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { userCases } from '@/data/user-cases';
import { modules } from '@/data/modules';
import { moduleScreenshots } from '@/data/module-screenshots';
import Header from '@/components/Header';
import ModuleScreenshotSlideshow from '@/components/ModuleScreenshotSlideshow';
import { updatePageMetadata } from '@/utils/seo';
import { useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

export default function UserCasePage() {
  const { userCaseId } = useParams<{ userCaseId: string }>();
  const navigate = useNavigate();
  const { createCheckout } = useSubscription();
  
  const userCase = userCases.find(uc => uc.id === userCaseId);

  useEffect(() => {
    if (userCase) {
      updatePageMetadata(`${userCase.title} - Solutions`);
    }
  }, [userCase]);

  if (!userCase) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Use Case Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The requested use case could not be found.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const Icon = userCase.icon;
  const primaryModulesData = userCase.primaryModules.map(moduleId => 
    modules.find(m => m.id === moduleId)
  ).filter(Boolean);

  const tierColors = {
    Free: "bg-secondary text-secondary-foreground",
    Pro: "bg-music-purple text-primary-foreground",
    Enterprise: "bg-music-gold text-accent-foreground",
    "Growth Bundle": "bg-gradient-primary text-primary-foreground"
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* User Case Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-primary rounded-lg p-3">
              <Icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{userCase.title}</h1>
              </div>
              <p className="text-lg text-muted-foreground mb-2">{userCase.description}</p>
              <p className="text-sm font-medium text-music-purple">{userCase.audience}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Featured Modules Screenshots */}
            {primaryModulesData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Featured Tools</CardTitle>
                  <CardDescription>
                    Primary modules that power your workflows
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {primaryModulesData.map((module, index) => {
                    if (!module) return null;
                    const ModuleIcon = module.icon;
                    const screenshots = moduleScreenshots[module.id];
                    
                    return (
                      <div key={module.id}>
                        {index > 0 && <Separator className="my-6" />}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-primary rounded-lg p-2">
                              <ModuleIcon className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{module.title}</h4>
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate('/auth')}
                            >
                              Try Now
                            </Button>
                          </div>
                          
                          {screenshots && screenshots.length > 0 && (
                            <div className="rounded-lg overflow-hidden">
                              <ModuleScreenshotSlideshow 
                                screenshots={screenshots.slice(0, 2)} 
                                autoPlay={true}
                                interval={4000}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Testimonial */}
            {userCase.testimonial && (
              <Card className="bg-gradient-subtle border-0">
                <CardContent className="p-6">
                  <blockquote className="text-lg italic text-foreground mb-4">
                    "{userCase.testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-semibold">
                        {userCase.testimonial.author.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{userCase.testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{userCase.testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Key Benefits</CardTitle>
                <CardDescription>
                  Why {userCase.title.toLowerCase()} choose our platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {userCase.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-music-purple mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommended Plan */}
            <Card className="border-music-purple">
              <CardHeader>
                <CardTitle className="text-music-purple">Recommended Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userCase.recommendedTier === "Pro" && userCase.id === "indie-creators" && (
                  <div>
                    <h4 className="font-semibold mb-2">Starter Creator</h4>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">$79</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Perfect for indie songwriters starting their music career
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground mb-4">
                      <li>• Metadata management</li>
                      <li>• Writer/publisher splits</li>
                      <li>• Basic contract templates</li>
                      <li>• Auto-tag by deal type</li>
                    </ul>
                    <Button 
                      className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                      onClick={() => createCheckout('bundle', 'starter')}
                    >
                      Start 14-Day Free Trial
                    </Button>
                  </div>
                )}
                
                {userCase.recommendedTier === "Pro" && userCase.id !== "indie-creators" && (
                  <div>
                    <h4 className="font-semibold mb-2">Publishing Pro</h4>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">$299</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete solution for indie publishers and growing catalogs
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground mb-4">
                      <li>• Complete royalty processing</li>
                      <li>• Advanced copyright tracking</li>
                      <li>• Smart contract management</li>
                      <li>• Writer/publisher split management</li>
                      <li>• Professional client reporting</li>
                    </ul>
                    <Button 
                      className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                      onClick={() => createCheckout('bundle', 'publishing-pro')}
                    >
                      Purchase Plan
                    </Button>
                  </div>
                )}
                
                {userCase.recommendedTier === "Growth Bundle" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Growth Bundle</h4>
                      <span className="text-xs bg-music-purple/10 text-music-purple px-2 py-1 rounded">Save 13%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ideal for Scaling publishers
                    </p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm text-muted-foreground line-through">$450/mo</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-music-purple">$399</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">or $4499/yr</p>
                    
                    <div className="mb-4">
                      <p className="font-medium text-sm mb-2">Includes:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          <span>Royalties</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          <span>Copyright</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <span>Contract</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Catalog Valuation</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-music-purple" />
                        <span>Full royalty management suite</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-music-purple" />
                        <span>Advanced copyright tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-music-purple" />
                        <span>Contract automation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-music-purple" />
                        <span>Catalog valuation tools</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-music-purple" />
                        <span>Priority support</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                      onClick={() => createCheckout('bundle', 'growth')}
                    >
                      Subscribe to Plan
                    </Button>
                  </div>
                )}
                
                {userCase.recommendedTier === "Enterprise" && (
                  <div>
                    <h4 className="font-semibold mb-2">Enterprise Suite</h4>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xl font-semibold">Custom Pricing</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Full-scale solution for large catalogs and institutional investors
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground mb-4">
                      <li>• All modules included</li>
                      <li>• White-label branding</li>
                      <li>• Custom integrations & SLAs</li>
                      <li>• Advanced analytics & reporting</li>
                      <li>• Dedicated account manager</li>
                      <li>• 24/7 priority support</li>
                    </ul>
                    <Button 
                      className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                      onClick={() => navigate('/contact')}
                    >
                      Contact Sales
                    </Button>
                  </div>
                )}
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/pricing')}
                >
                  View All Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}