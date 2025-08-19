import { Button } from "@/components/ui/button";
import { ArrowRight, Music, TrendingUp, Shield } from "lucide-react";
const Hero = () => {
  return <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-background via-background/95 to-electric-lavender/10">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-electric-lavender to-dusty-gold rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-electric-lavender/60 to-primary/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-transparent via-electric-lavender/10 to-transparent rounded-full animate-[spin_20s_linear_infinite]"></div>
      </div>

      {/* Geometric Accent Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-16 h-16 bg-electric-lavender/20 transform rotate-45 animate-bounce"></div>
        <div className="absolute bottom-32 left-16 w-8 h-8 bg-dusty-gold/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-24 bg-gradient-to-b from-electric-lavender to-transparent transform rotate-12"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-12 animate-fade-in">
          <div className="space-y-8">
            {/* Enhanced Badge with Modern Styling */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-electric-lavender/20 to-electric-lavender/10 border border-electric-lavender/30 rounded-full px-6 py-3 backdrop-blur-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-electric-lavender rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-dusty-gold rounded-full animate-pulse" style={{
                animationDelay: '0.2s'
              }}></div>
                <div className="w-2 h-2 bg-electric-lavender/60 rounded-full animate-pulse" style={{
                animationDelay: '0.4s'
              }}></div>
              </div>
              <span className="font-accent text-electric-lavender text-sm font-semibold tracking-wider">ANALOG SOUL. DIGITAL SPINE.</span>
            </div>
            
            {/* Bold, Modern Typography */}
            <div className="space-y-4">
              <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
                <span className="block relative">
                  <span className="bg-gradient-to-r from-electric-lavender via-electric-lavender to-dusty-gold bg-clip-text text-transparent italic inline-block">
                    ENCORE!
                  </span>
                </span>
              </h1>
              
              {/* Subtitle with modern styling */}
              <div className="bg-electric-lavender/90 text-background px-8 py-4 rounded-2xl inline-block transform -rotate-1 shadow-lg">
                <p className="font-body text-lg md:text-xl font-bold">
                  The Future of Music Rights, Royalties & Licensing
                </p>
              </div>
            </div>
            
            <p className="font-body text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Track your rights like you track your hits.
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
    </section>;
};
export default Hero;