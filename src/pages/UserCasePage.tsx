import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { userCases } from '@/data/user-cases';
import { modules } from '@/data/modules';
import { moduleScreenshots } from '@/data/module-screenshots';
import Header from '@/components/Header';
import ModuleScreenshotSlideshow from '@/components/ModuleScreenshotSlideshow';
import { updatePageMetadata } from '@/utils/seo';
import { useEffect } from 'react';

export default function UserCasePage() {
  const { userCaseId } = useParams<{ userCaseId: string }>();
  const navigate = useNavigate();
  
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
    Enterprise: "bg-music-gold text-accent-foreground"
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
                <Badge className={tierColors[userCase.recommendedTier]}>
                  {userCase.recommendedTier} Plan
                </Badge>
                {userCase.isPopular && (
                  <Badge className="bg-gradient-accent text-accent-foreground">
                    Most Popular
                  </Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground mb-2">{userCase.description}</p>
              <p className="text-sm font-medium text-music-purple">{userCase.audience}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflows */}
            <Card>
              <CardHeader>
                <CardTitle>Tailored Workflows</CardTitle>
                <CardDescription>
                  Step-by-step processes designed specifically for {userCase.title.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userCase.workflows.map((workflow, index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="my-6" />}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{workflow.title}</h4>
                          <p className="text-muted-foreground mb-3">{workflow.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {workflow.modules.map(moduleId => {
                              const module = modules.find(m => m.id === moduleId);
                              return module ? (
                                <Badge key={moduleId} variant="outline" className="text-xs">
                                  {module.title}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => navigate('/dashboard')}
                          className="ml-4 bg-gradient-primary text-primary-foreground hover:opacity-90"
                        >
                          Try Workflow
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

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
                              onClick={() => navigate(`/features/${module.id}`)}
                            >
                              Learn More
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                  onClick={() => navigate('/dashboard')}
                >
                  Start Free Trial
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/pricing')}
                >
                  View Pricing
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate('/contact')}
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>

            {/* Recommended Plan */}
            <Card className="border-music-purple">
              <CardHeader>
                <CardTitle className="text-music-purple">Recommended Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <Badge className={tierColors[userCase.recommendedTier]} variant="outline">
                    {userCase.recommendedTier} Plan
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Perfect for {userCase.title.toLowerCase()} with your specific needs and workflows
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}