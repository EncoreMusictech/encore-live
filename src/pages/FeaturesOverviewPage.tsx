import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import { modules } from '@/data/modules';
import { moduleScreenshots } from '@/data/module-screenshots';
import { updatePageMetadata } from '@/utils/seo';
import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export default function FeaturesOverviewPage() {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageMetadata('features');
  }, []);

  const coreModules = modules.slice(0, 3); // Show first 3 modules prominently
  const additionalModules = modules.slice(3); // Rest in simpler format

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - More breathing room */}
      <section className="relative py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-6">
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
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features - Highlighted prominently */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Modules</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Essential tools that form the foundation of your music rights management
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {coreModules.map((module) => {
              const Icon = module.icon;
              const featuredScreenshot = moduleScreenshots[module.id]?.[0];
              
              return (
                <Card key={module.id} className="group hover:shadow-xl transition-all duration-500 border-border/50 overflow-hidden">
                  {/* Screenshot with overlay */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-electric-lavender/5 to-dusty-gold/5">
                    {featuredScreenshot ? (
                      <img 
                        src={featuredScreenshot.image} 
                        alt={featuredScreenshot.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-20 h-20 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-primary rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold">{module.title}</h3>
                    </div>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {module.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      {module.features.slice(0, 2).map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-electric-lavender mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full group/btn hover:bg-gradient-primary hover:text-primary-foreground"
                      onClick={() => navigate(`/features/${module.id}`)}
                    >
                      Explore Module
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features - Simplified grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Additional Capabilities</h2>
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
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50"
                  onClick={() => navigate(`/features/${module.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-primary rounded-lg p-2.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="font-bold text-lg group-hover:text-electric-lavender transition-colors">
                          {module.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {module.description}
                        </p>
                        <div className="flex items-center text-xs text-electric-lavender opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Learn more <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action - Simplified */}
      <section className="py-20 bg-gradient-to-r from-electric-lavender/10 to-dusty-gold/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of music professionals transforming their rights management
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/pricing')}
                className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/contact')}
                className="hover:bg-electric-lavender hover:text-background transition-colors"
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