import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updatePageMetadata } from "@/utils/seo";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { userCases } from "@/data/user-cases";
import UserCaseCard from "@/components/UserCaseCard";
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
  const [selectedUserCase, setSelectedUserCase] = useState<typeof userCases[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    updatePageMetadata('home');
  }, []);
  const handleGetStarted = (userCaseId: string) => {
    navigate(`/use-cases/${userCaseId}`);
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
              Solutions for Every <span className="bg-gradient-primary bg-clip-text text-transparent">Music Professional</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tailored workflows and tools designed for your specific role in the music industry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
            {userCases.map(userCase => <UserCaseCard key={userCase.id} title={userCase.title} description={userCase.description} icon={userCase.icon} audience={userCase.audience} benefits={userCase.benefits} recommendedTier={userCase.recommendedTier} isPopular={userCase.isPopular} onGetStarted={() => handleGetStarted(userCase.id)} />)}
          </div>
        </div>
      </section>

      {/* Music Publishing Ecosystem Section */}
      <section className="py-20 bg-gradient-to-br from-secondary/20 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Navigate the Complex <span className="bg-gradient-primary bg-clip-text text-transparent">Music Ecosystem</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The music publishing ecosystem involves dozens of stakeholders, rights organizations, and revenue streams. 
              Our platform connects and manages them all in one unified system.
            </p>
          </div>

          <div className="w-full max-w-6xl mx-auto">
            {/* Central Publisher Hub */}
            <div className="flex justify-center mb-12">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-lg">PUBLISHER</span>
                </div>
                {/* Connection lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-0.5 h-20 bg-gradient-to-b from-primary to-transparent origin-bottom"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-80px)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Stakeholder Rings */}
            <div className="space-y-16">
              {/* Inner Ring - Core Creators */}
              <div className="flex justify-center items-center gap-16 flex-wrap">
                {[
                  { name: "Songwriters", color: "bg-emerald-500" },
                  { name: "Artists", color: "bg-pink-500" },
                  { name: "Producers", color: "bg-orange-500" },
                ].map((stakeholder) => (
                  <div key={stakeholder.name} className="text-center">
                    <div className={`w-20 h-20 ${stakeholder.color} rounded-full flex items-center justify-center mb-2 shadow-lg`}>
                      <span className="text-white font-medium text-sm">{stakeholder.name.slice(0, 4)}</span>
                    </div>
                    <p className="text-sm font-medium">{stakeholder.name}</p>
                  </div>
                ))}
              </div>

              {/* Middle Ring - Rights Organizations & Platforms */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 justify-items-center">
                {[
                  { name: "ASCAP", color: "bg-blue-500" },
                  { name: "BMI", color: "bg-purple-600" },
                  { name: "SESAC", color: "bg-pink-500" },
                  { name: "MLC", color: "bg-emerald-500" },
                  { name: "Spotify", color: "bg-green-500" },
                  { name: "Apple Music", color: "bg-red-500" },
                ].map((stakeholder) => (
                  <div key={stakeholder.name} className="text-center">
                    <div className={`w-16 h-16 ${stakeholder.color} rounded-full flex items-center justify-center mb-2 shadow-lg`}>
                      <span className="text-white font-medium text-xs">{stakeholder.name.slice(0, 5)}</span>
                    </div>
                    <p className="text-xs font-medium">{stakeholder.name}</p>
                  </div>
                ))}
              </div>

              {/* Outer Ring - International & Specialized */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center">
                {[
                  { name: "GEMA", color: "bg-yellow-500" },
                  { name: "SACEM", color: "bg-emerald-500" },
                  { name: "PRS", color: "bg-blue-500" },
                  { name: "SOCAN", color: "bg-pink-500" },
                  { name: "Sync Agents", color: "bg-orange-500" },
                  { name: "Sub-Publishers", color: "bg-purple-600" },
                ].map((stakeholder) => (
                  <div key={stakeholder.name} className="text-center">
                    <div className={`w-12 h-12 ${stakeholder.color} rounded-full flex items-center justify-center mb-2 shadow-lg`}>
                      <span className="text-white font-medium text-xs">{stakeholder.name.slice(0, 4)}</span>
                    </div>
                    <p className="text-xs font-medium">{stakeholder.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              <strong>Ecosystem Overview:</strong> Visual representation of how publishers connect with songwriters, PROs, streaming platforms, 
              international CMOs, and sync agents in the complex music rights landscape.
            </p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ready to customize your solution?</h2>
            <p className="text-xl text-muted-foreground">
              Professional music rights management platform with unified dashboard and module-based tabs.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90" asChild>
                <Link to="/dashboard">
                  Launch Dashboard
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

      {/* Modal removed for user cases - direct navigation instead */}
    </div>;
};
export default Index;