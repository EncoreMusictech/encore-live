import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ModuleCard from "@/components/ModuleCard";
import { modules } from "@/data/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<"Free" | "Pro" | "Enterprise">("Pro");

  const handleGetStarted = (moduleId: string) => {
    toast({
      title: "Module Access",
      description: "This module is coming soon! Sign up for early access.",
    });
  };

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for independent artists and small operations",
      features: [
        "Contract Management",
        "Copyright Management", 
        "Up to 100 tracks",
        "Basic reporting",
        "Email support"
      ]
    },
    {
      name: "Pro",
      price: "$49",
      description: "Ideal for managers, small labels, and growing businesses",
      features: [
        "Everything in Free",
        "Catalog Valuation",
        "Sync Licensing Tracker",
        "Client Portal",
        "Unlimited tracks",
        "Advanced reporting",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large publishers, labels, and rights organizations",
      features: [
        "Everything in Pro",
        "Royalties Processing",
        "Custom integrations",
        "Dedicated account manager",
        "API access",
        "White-label options",
        "SLA guarantee"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      {/* Modules Section */}
      <section id="modules" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete <span className="bg-gradient-primary bg-clip-text text-transparent">Rights Management</span> Suite
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Six powerful modules designed specifically for music industry professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                title={module.title}
                description={module.description}
                icon={module.icon}
                features={module.features}
                tier={module.tier}
                isPopular={module.isPopular}
                onGetStarted={() => handleGetStarted(module.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your <span className="bg-gradient-accent bg-clip-text text-transparent">Plan</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Flexible pricing for every stage of your music business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`relative transition-all duration-300 hover:shadow-elegant ${
                  tier.popular ? 'ring-2 ring-music-purple shadow-glow scale-105' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-accent text-accent-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {tier.price}
                    {tier.price !== "Custom" && <span className="text-lg text-muted-foreground">/month</span>}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-music-purple flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full mt-6 bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (tier.name === "Free") {
                        window.location.href = "/modules";
                      } else {
                        window.location.href = "/pricing";
                      }
                    }}
                  >
                    {tier.price === "Custom" ? "Contact Sales" : tier.name === "Free" ? "Get Started" : "View Details"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              asChild
              variant="outline" 
              size="lg"
              className="border-music-purple text-music-purple hover:bg-music-purple hover:text-primary-foreground"
            >
              <a href="/pricing">View All Pricing Options</a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-dark">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to Transform Your Rights Management?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of music professionals who trust ENCORE for their rights management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
                Start Your Free Trial
              </Button>
              <Button variant="outline" size="lg" className="border-music-purple text-music-purple hover:bg-music-purple hover:text-primary-foreground">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
