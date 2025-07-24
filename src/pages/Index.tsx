import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updatePageMetadata } from "@/utils/seo";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ModuleCard from "@/components/ModuleCard";
import ModuleFeatureModal from "@/components/ModuleFeatureModal";
import { modules } from "@/data/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<"Free" | "Pro" | "Enterprise">("Pro");
  const [selectedModule, setSelectedModule] = useState<typeof modules[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    updatePageMetadata('home');
  }, []);

  const handleGetStarted = (moduleId: string) => {
    navigate(`/features/${moduleId}`);
  };

  const pricingTiers = [
    {
      name: "Starter Creator",
      price: "$79",
      originalPrice: "$158",
      description: "Perfect for indie songwriters starting out",
      audience: "Indie songwriters",
      features: [
        "Copyright Management",
        "Contract Manager", 
        "Up to 50 works per month",
        "Email support",
        "Save 50%"
      ]
    },
    {
      name: "Publishing Pro",
      price: "$299",
      originalPrice: "$357",
      description: "Complete solution for indie publishers",
      audience: "Indie publishers",
      features: [
        "Advanced royalty management",
        "Bulk copyright processing",
        "Contract automation",
        "Multi-writer splits",
        "Phone support"
      ],
      popular: true
    },
    {
      name: "Enterprise Suite",
      price: "$849",
      originalPrice: "$1,145",
      description: "Everything for large publishers and labels",
      audience: "Enterprise users",
      features: [
        "All modules included",
        "API access",
        "Priority support",
        "Custom integrations",
        "Dedicated account manager",
        "White-label options"
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
              Bundled packages with significant savings, or build your own modular solution
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
                  <p className="text-sm text-muted-foreground mb-4">Ideal for {tier.audience}</p>
                  <div className="space-y-1">
                    {tier.originalPrice && (
                      <div className="text-sm text-muted-foreground line-through">
                        {tier.originalPrice}/mo
                      </div>
                    )}
                    <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      {tier.price}
                      <span className="text-lg text-muted-foreground">/month</span>
                    </div>
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
                      window.location.href = "/pricing";
                    }}
                  >
                    {tier.name === "Enterprise Suite" ? "Contact Sales" : "Get Started"}
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
      <section className="relative py-20 overflow-hidden">
        {/* Record Groove Background */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: `url('/lovable-uploads/ab53c16c-028b-497c-ac9f-feab103ef7de.png')`
        }} />
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-jet-black/40" />
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
              <Button variant="outline" size="lg" className="border-music-purple text-music-purple hover:bg-music-purple hover:text-primary-foreground" asChild>
                <a href="https://calendly.com/encoremts" target="_blank" rel="noopener noreferrer">
                  Schedule a Demo
                </a>
              </Button>
              <Link to="/client-admin">
                <Button variant="ghost" size="lg">Client Admin</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ModuleFeatureModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        module={selectedModule}
      />
    </div>
  );
};

export default Index;
