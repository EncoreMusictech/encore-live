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
import CopyrightManagement3D from '@/components/features/CopyrightManagement3D';
import SyncLicensing3D from '@/components/features/SyncLicensing3D';
import ClientPortal3D from '@/components/features/ClientPortal3D';

export default function FeaturesOverviewPage() {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageMetadata('features');
  }, []);

  const get3DComponent = (moduleId: string) => {
    switch (moduleId) {
      case 'royalties-processing':
        return <RoyaltiesProcessing3D />;
      case 'catalog-valuation':
        return <CatalogValuation3D />;
      case 'contract-management':
        return <ContractManagement3D />;
      case 'copyright-management':
        return <CopyrightManagement3D />;
      case 'sync-licensing':
        return <SyncLicensing3D />;
      case 'client-portal':
        return <ClientPortal3D />;
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
                  Explore Our Features
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The power to create your own rights management system, using only the tools you need at a price you can afford.
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

      {/* All Features - Horizontal Sections with 3D Graphics */}
      {modules.map((module, index) => {
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
                        {graphic3D || (
                          <div className="w-full h-80 bg-gradient-to-br from-electric-lavender/10 to-dusty-gold/10 rounded-2xl flex items-center justify-center">
                            <Icon className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )}
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