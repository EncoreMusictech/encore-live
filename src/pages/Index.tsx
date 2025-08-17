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
  const {
    toast
  } = useToast();
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
  const pricingTiers = [{
    name: "Starter Creator",
    price: "$79",
    originalPrice: "$158",
    description: "Perfect for indie songwriters starting out",
    audience: "Indie songwriters",
    features: ["Copyright Management", "Contract Manager", "Unlimited works & users", "24/7 support", "Save 50%"]
  }, {
    name: "Publishing Pro",
    price: "$299",
    originalPrice: "$357",
    description: "Complete solution for indie publishers",
    audience: "Indie publishers",
    features: ["Royalties Processing", "Copyright Management", "Contract Manager", "Unlimited works & users", "24/7 support"],
    popular: true
  }, {
    name: "Enterprise Suite",
    price: "$849",
    originalPrice: "$1,145",
    description: "Everything for large publishers and labels",
    audience: "Enterprise users",
    features: ["All 6 modules included", "Unlimited works & users", "API access", "Custom integrations", "Dedicated account manager", "24/7 support"]
  }];
  return <div className="min-h-screen bg-background">
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
            {modules.map(module => <ModuleCard key={module.id} title={module.title} description={module.description} icon={module.icon} features={module.features} tier={module.tier} isPopular={module.isPopular} onGetStarted={() => handleGetStarted(module.id)} />)}
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
            {pricingTiers.map(tier => <Card key={tier.name} className={`relative transition-all duration-300 hover:shadow-elegant ${tier.popular ? 'ring-2 ring-music-purple shadow-glow scale-105' : ''}`}>
                {tier.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-accent text-accent-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-4">Ideal for {tier.audience}</p>
                  <div className="space-y-1">
                    {tier.originalPrice && <div className="text-sm text-muted-foreground line-through">
                        {tier.originalPrice}/mo
                      </div>}
                    <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      {tier.price}
                      <span className="text-lg text-muted-foreground">/month</span>
                    </div>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => <li key={index} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-music-purple flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>)}
                  </ul>

                  <Button className="w-full mt-6 bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity" onClick={() => {
                window.location.href = "/pricing";
              }}>
                    {tier.name === "Enterprise Suite" ? "Contact Sales" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>)}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="border-music-purple text-music-purple hover:bg-music-purple hover:text-primary-foreground">
              <a href="/pricing">View All Pricing Options</a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ready to access your CRM?</h2>
            <p className="text-xl text-muted-foreground">
              Professional music rights management platform with unified dashboard and module-based tabs.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90" asChild>
                <Link to="/crm">
                  Launch CRM Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-music-purple text-music-purple hover:bg-music-purple hover:text-primary-foreground" asChild>
                <a href="https://calendly.com/encoremts" target="_blank" rel="noopener noreferrer">
                  Schedule a Demo
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ModuleFeatureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} module={selectedModule} />
    </div>;
};
export default Index;