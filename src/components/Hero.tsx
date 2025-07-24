import { Button } from "@/components/ui/button";
import { ArrowRight, Music, TrendingUp, Shield } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-vinyl py-20 lg:py-32">
      {/* Vinyl Groove Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--electric-lavender))_0%,transparent_70%)] opacity-20" />
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, hsl(var(--dusty-gold) / 0.1) 1deg, transparent 2deg)`
      }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="space-y-6">
            <div className="font-accent text-dusty-gold text-sm tracking-wider">
              ANALOG SOUL • DIGITAL SPINE
            </div>
            <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Rights Management
              </span>
              <br />
              <span className="text-foreground">
                Reimagined
              </span>
            </h1>
            
            <p className="font-body text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Track the rights like you track the hits. Power your catalog. Protect your legacy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-fader transition-all duration-300 hover:scale-105">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
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
              <h3 className="font-headline font-semibold">Complete Rights Management</h3>
              <p className="font-body text-sm text-muted-foreground">
                Track copyrights, contracts, and licensing deals
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="bg-gradient-primary rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-headline font-semibold">Catalog Valuation</h3>
              <p className="font-body text-sm text-muted-foreground">
                AI-powered forecasting and market analysis
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="bg-gradient-primary rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-headline font-semibold">Secure Client Portal</h3>
              <p className="font-body text-sm text-muted-foreground">
                Tier-based access for artists and stakeholders
              </p>
            </div>
          </div>

          {/* Tech Aesthetic Graphics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 opacity-60">
            <div className="relative overflow-hidden rounded-lg border border-electric-lavender/20 shadow-fader">
              <img 
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" 
                alt="Circuit board representing digital infrastructure"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-vinyl opacity-80"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="font-headline text-lg font-bold">Digital Spine</h4>
                <p className="font-body text-sm opacity-90">Powered by cutting-edge technology</p>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-lg border border-dusty-gold/20 shadow-fader">
              <img 
                src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=80" 
                alt="Code on monitor representing software interface"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-accent opacity-80"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="font-headline text-lg font-bold">Analog Soul</h4>
                <p className="font-body text-sm opacity-90">Classic workflow, modern precision</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;