import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { modules } from '@/data/modules';
import Header from '@/components/Header';
import { updatePageMetadata } from '@/utils/seo';
import { useEffect } from 'react';

export default function FeaturesPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  
  const module = modules.find(m => m.id === moduleId);

  useEffect(() => {
    if (module) {
      updatePageMetadata(`${module.title} - Features`);
    }
  }, [module]);

  if (!module) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Module Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The requested module could not be found.
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

  const Icon = module.icon;

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

        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-primary rounded-lg p-3">
              <Icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{module.title}</h1>
                <Badge 
                  className={
                    module.tier === 'Free' 
                      ? 'bg-secondary text-secondary-foreground'
                      : module.tier === 'Pro'
                      ? 'bg-music-purple text-primary-foreground'
                      : 'bg-music-gold text-accent-foreground'
                  }
                >
                  {module.tier}
                </Badge>
                {module.isPopular && (
                  <Badge className="bg-gradient-accent text-accent-foreground">
                    Most Popular
                  </Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground">{module.description}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>
                  Everything included in the {module.title} module
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {module.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-music-purple mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Sub-modules */}
            {module.subModules && module.subModules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Module Components</CardTitle>
                  <CardDescription>
                    Individual tools and workflows within this module
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {module.subModules.map((subModule, index) => {
                    const SubIcon = subModule.icon;
                    return (
                      <div key={subModule.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex items-start space-x-4">
                          <div className="bg-gradient-primary rounded-lg p-2 mt-1">
                            <SubIcon className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{subModule.title}</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(subModule.path)}
                                className="ml-4"
                              >
                                Try Now
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {subModule.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {module.subModules && module.subModules.length > 0 ? (
                  <Button 
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={() => navigate(module.subModules![0].path)}
                  >
                    Try {module.title}
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={() => {
                      // Navigate to the appropriate page based on module ID
                      const routeMap: Record<string, string> = {
                        'contract-management': '/contract-management',
                        'copyright-management': '/copyright-management',
                        'sync-licensing': '/sync-licensing',
                        'client-portal': '/client-portal'
                      };
                      const route = routeMap[module.id];
                      if (route) {
                        navigate(route);
                      }
                    }}
                  >
                    Try {module.title}
                  </Button>
                )}
                
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

            {/* Module Info */}
            <Card>
              <CardHeader>
                <CardTitle>Module Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tier:</span>
                  <Badge 
                    className={
                      module.tier === 'Free' 
                        ? 'bg-secondary text-secondary-foreground'
                        : module.tier === 'Pro'
                        ? 'bg-music-purple text-primary-foreground'
                        : 'bg-music-gold text-accent-foreground'
                    }
                  >
                    {module.tier}
                  </Badge>
                </div>
                
                {module.subModules && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Components:</span>
                    <span className="text-sm font-medium">{module.subModules.length}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Features:</span>
                  <span className="text-sm font-medium">{module.features.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}