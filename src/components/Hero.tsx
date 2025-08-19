import { Button } from "@/components/ui/button";
import { ArrowRight, Music, TrendingUp, Shield } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-jet-black via-jet-black/95 to-electric-lavender/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-vinyl rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-12 animate-fade-in">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-electric-lavender/10 border border-electric-lavender/20 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-dusty-gold rounded-full animate-pulse"></div>
              <span className="font-accent text-dusty-gold text-sm tracking-wider">
                PROFESSIONAL RIGHTS MANAGEMENT
              </span>
            </div>
            
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none">
              <span className="block text-foreground">Unlock the Value</span>
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                of Your Catalog
              </span>
            </h1>
            
            <p className="font-body text-xl md:text-2xl text-platinum-gray/80 max-w-4xl mx-auto leading-relaxed">
              One platform, endless opportunities to grow your music business. 
              Professional-grade rights management, catalog valuation, and revenue optimization.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-fader transition-all duration-300 hover:scale-105">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-electric-lavender text-electric-lavender hover:bg-electric-lavender hover:text-jet-black transition-all duration-300" asChild>
              <a href="/auth?demo=true">
                Try Now
              </a>
            </Button>
            <Button variant="outline" size="lg" className="border-electric-lavender text-electric-lavender hover:bg-electric-lavender hover:text-jet-black transition-all duration-300" asChild>
              <a href="https://calendly.com/encoremts" target="_blank" rel="noopener noreferrer">
                Schedule Demo
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-slide-up">
            <div className="text-center space-y-2">
              <div className="bg-gradient-primary rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Music className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">Complete Rights Management</h3>
              <p className="text-sm text-muted-foreground">
                Track copyrights, contracts, and licensing deals
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="bg-gradient-primary rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">Catalog Valuation</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered forecasting and market analysis
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="bg-gradient-primary rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">Secure Client Portal</h3>
              <p className="text-sm text-muted-foreground">
                Tier-based access for artists and stakeholders
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;