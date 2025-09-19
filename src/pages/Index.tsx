import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { updatePageMetadata } from "@/utils/seo";
import { useAuth } from "@/hooks/useAuth";
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedTier, setSelectedTier] = useState<"Free" | "Pro" | "Enterprise">("Pro");
  const [selectedUserCase, setSelectedUserCase] = useState<typeof userCases[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    updatePageMetadata('home');
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);
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

      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Navigate the Complex <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Music Ecosystem</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From PROs to streaming platforms, manage all your music rights in one unified platform
            </p>
          </div>

          <div className="relative w-full h-[600px] max-w-6xl mx-auto overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700">
            {/* Animated Background Musical Notes */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl opacity-20 animate-pulse text-blue-300"
                style={{
                  left: `${10 + (i * 12)}%`,
                  top: `${20 + ((i % 3) * 25)}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '3s'
                }}
              >
                🎵
              </div>
            ))}

            {/* Central Artist Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <span className="text-white font-bold text-lg">ARTIST</span>
                </div>
                
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '500px', height: '500px', left: '-184px', top: '-184px' }}>
                  {[
                    { x: 250, y: 100, angle: 0 }, // Spotify
                    { x: 400, y: 150, angle: 30 }, // Apple
                    { x: 450, y: 250, angle: 60 }, // BMI
                    { x: 400, y: 350, angle: 90 }, // YouTube
                    { x: 300, y: 400, angle: 120 }, // Amazon
                    { x: 200, y: 400, angle: 150 }, // Netflix
                    { x: 100, y: 350, angle: 180 }, // Hulu
                    { x: 50, y: 250, angle: 210 }, // SESAC
                    { x: 100, y: 150, angle: 240 }, // PRS
                    { x: 200, y: 100, angle: 270 }, // MLC
                    { x: 150, y: 50, angle: 300 }, // PPL
                  ].map((item, index) => (
                    <line
                      key={index}
                      x1="250"
                      y1="250"
                      x2={item.x}
                      y2={item.y}
                      stroke="rgba(139, 92, 246, 0.3)"
                      strokeWidth="2"
                      className="animate-pulse"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Surrounding Platform Circles */}
            {[
              { name: "Spotify", color: "bg-green-500", top: "15%", left: "50%", size: "w-16 h-16" },
              { name: "Apple", color: "bg-gray-600", top: "25%", left: "70%", size: "w-14 h-14" },
              { name: "BMI", color: "bg-gray-800", top: "50%", left: "80%", size: "w-14 h-14" },
              { name: "YouTube", color: "bg-red-600", top: "70%", left: "70%", size: "w-16 h-16" },
              { name: "Amazon", color: "bg-blue-600", top: "80%", left: "50%", size: "w-14 h-14" },
              { name: "Netflix", color: "bg-red-600", top: "80%", left: "30%", size: "w-16 h-16" },
              { name: "Hulu", color: "bg-green-600", top: "70%", left: "15%", size: "w-14 h-14" },
              { name: "SESAC", color: "bg-red-500", top: "50%", left: "10%", size: "w-16 h-16" },
              { name: "PRS", color: "bg-red-800", top: "25%", left: "15%", size: "w-14 h-14" },
              { name: "MLC", color: "bg-green-500", top: "15%", left: "30%", size: "w-14 h-14" },
              { name: "PPL", color: "bg-orange-500", top: "8%", left: "40%", size: "w-12 h-12" },
            ].map((platform, index) => (
              <div
                key={platform.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-fade-in hover-scale"
                style={{
                  top: platform.top,
                  left: platform.left,
                  animationDelay: `${index * 0.3}s`
                }}
              >
                <div className={`${platform.size} ${platform.color} rounded-full flex items-center justify-center shadow-lg hover:shadow-glow transition-all duration-300`}>
                  <span className="text-white font-medium text-xs">
                    {platform.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              The music industry ecosystem is incredibly complex, with dozens of stakeholders,
              rights organizations, and platforms. Our platform simplifies this complexity by
              providing a single hub to manage all your music rights and royalties.
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