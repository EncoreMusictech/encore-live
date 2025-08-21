import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import { modules } from '@/data/modules';
import { moduleScreenshots } from '@/data/module-screenshots';
import { updatePageMetadata } from '@/utils/seo';
import { useEffect, Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import RoyaltiesProcessing3D from '@/components/features/RoyaltiesProcessing3D';
import CatalogValuation3D from '@/components/features/CatalogValuation3D';
import ContractManagement3D from '@/components/features/ContractManagement3D';

export default function FeaturesOverviewPage() {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageMetadata('features');
  }, []);

  const coreModules = modules.slice(0, 3);
  const additionalModules = modules.slice(3);

  const get3DComponent = (moduleId: string) => {
    switch (moduleId) {
      case 'royalties-processing':
        return <RoyaltiesProcessing3D />;
      case 'catalog-valuation':
        return <CatalogValuation3D />;
      case 'contract-management':
        return <ContractManagement3D />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-electric-lavender/5 to-dusty-gold/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="space-y-6">
              <Badge variant="outline" className="border-electric-lavender text-electric-lavender">
                PROFESSIONAL MUSIC MANAGEMENT
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Complete Music Rights
                </span>
                <br />
                <span className="text-foreground">Management Platform</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Professional tools for catalog valuation, royalty processing, and contract management - 
                all integrated into one powerful platform.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={() => navigate('/pricing')}
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 hover:scale-105"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features - Horizontal Sections */}
      {coreModules.map((module, index) => {
        const Icon = module.icon;
        const isEven = index % 2 === 0;
        const graphic3D = get3DComponent(module.id);
        
        return (
          <section 
            key={module.id} 
            className={`py-20 ${index % 2 === 0 ? 'bg-background' : 'bg-card/30'}`}
          >
            <div className="container mx-auto px-4">
              <div className={`flex flex-col lg:flex-row items-center gap-16 ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
                {/* 3D Graphic */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <Suspense fallback={
                      <div className="w-full h-80 bg-gradient-to-br from-electric-lavender/10 to-dusty-gold/10 rounded-2xl flex items-center justify-center">
                        <Icon className="w-16 h-16 text-muted-foreground animate-pulse" />
                      </div>
                    }>
                      <div className="rounded-2xl overflow-hidden shadow-2xl">
                        {graphic3D}
                      </div>
                    </Suspense>
                    {/* Floating elements for extra visual interest */}
                    <div className={`absolute -top-6 ${isEven ? '-right-6' : '-left-6'} w-12 h-12 bg-gradient-primary rounded-full blur-sm opacity-60 animate-pulse`}></div>
                    <div className={`absolute -bottom-4 ${isEven ? '-left-4' : '-right-4'} w-8 h-8 bg-dusty-gold rounded-full blur-sm opacity-40 animate-pulse`} style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-primary rounded-2xl p-4 shadow-lg">
                        <Icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {module.tier} Plan
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <h2 className="text-3xl md:text-4xl font-bold">
                        {module.title}
                      </h2>
                      <p className="text-xl text-muted-foreground leading-relaxed">
                        {module.description}
                      </p>
                    </div>

                    {/* Key Features */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
                        Key Capabilities
                      </h3>
                      <div className="grid gap-3">
                        {module.features.slice(0, 4).map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start gap-3 group">
                            <div className="w-2 h-2 rounded-full bg-electric-lavender mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      size="lg"
                      onClick={() => navigate(`/features/${module.id}`)}
                      className="group hover:shadow-glow transition-all duration-300"
                      variant="outline"
                    >
                      Explore {module.title}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Additional Features - Simplified Grid */}
      <section className="py-20 bg-gradient-to-br from-electric-lavender/5 to-dusty-gold/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold">Additional Capabilities</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced features to streamline your entire music business workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {additionalModules.map((module) => {
              const Icon = module.icon;
              
              return (
                <Card 
                  key={module.id} 
                  className="group hover:shadow-xl transition-all duration-500 cursor-pointer border-border/50 hover:border-electric-lavender/50 hover:-translate-y-1"
                  onClick={() => navigate(`/features/${module.id}`)}
                >
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-primary rounded-xl p-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <Icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {module.tier} Plan
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="font-bold text-xl group-hover:text-electric-lavender transition-colors">
                          {module.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {module.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center text-sm text-electric-lavender opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        Explore module <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-electric-lavender/10 to-dusty-gold/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-electric-lavender/5 to-dusty-gold/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Music Business?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join thousands of music professionals who trust Encore for their complete rights management solution
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/pricing')}
                className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/contact')}
                className="hover:bg-electric-lavender hover:text-background transition-all duration-300 hover:shadow-lg"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}