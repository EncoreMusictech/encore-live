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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Complete Music Rights Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Professional-grade tools for catalog valuation, royalty processing, contract management, 
            and sync licensing - all integrated into one powerful platform.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {modules.map((module) => {
            const Icon = module.icon;
            const featuredScreenshot = moduleScreenshots[module.id]?.[0];
            
            return (
              <Card key={module.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-music-purple/10 to-music-gold/10">
                  {featuredScreenshot ? (
                    <img 
                      src={featuredScreenshot.image} 
                      alt={featuredScreenshot.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-primary rounded-lg p-2">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Top 3 Benefits */}
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                        Key Benefits
                      </h4>
                      <ul className="space-y-2">
                        {module.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-music-purple mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full group"
                      onClick={() => navigate(`/features/${module.id}`)}
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-music-purple/10 to-music-gold/10 rounded-2xl p-8 border border-border/50">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Music Business?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of music professionals who trust Encore for their rights management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </Button>
            <Button 
              size="lg" 
              variant="ghost"
              onClick={() => navigate('/contact')}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}