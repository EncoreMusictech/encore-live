import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Play, 
  Music, 
  TrendingUp, 
  Shield, 
  Zap,
  FileText,
  Copyright,
  Users,
  BarChart3,
  DollarSign,
  CheckCircle,
  Star,
  Sparkles,
  Globe,
  Lock,
  Calendar
} from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const demoModules = [
    {
      id: "royalties",
      title: "Royalties Module",
      subtitle: "Automate royalty calculations & distributions",
      icon: Music,
      color: "from-purple-500 to-purple-700",
      features: ["Real-time calculations", "Multi-source imports", "Automated statements"],
      videoPlaceholder: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=450&fit=crop"
    },
    {
      id: "copyright",
      title: "Copyright Management", 
      subtitle: "Comprehensive rights tracking & registration",
      icon: Copyright,
      color: "from-blue-500 to-blue-700",
      features: ["Work registration", "PRO submissions", "CWR exports"],
      videoPlaceholder: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop"
    },
    {
      id: "contracts",
      title: "Smart Contracts",
      subtitle: "Digital contract lifecycle management",
      icon: FileText,
      color: "from-green-500 to-green-700", 
      features: ["Template library", "E-signatures", "Automated workflows"],
      videoPlaceholder: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=450&fit=crop"
    },
    {
      id: "sync",
      title: "Sync Licensing",
      subtitle: "Track opportunities & manage placements",
      icon: Zap,
      color: "from-yellow-500 to-orange-700",
      features: ["Pitch tracking", "Usage monitoring", "Fee calculations"], 
      videoPlaceholder: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=450&fit=crop"
    },
    {
      id: "valuation",
      title: "Catalog Valuation",
      subtitle: "AI-powered asset analysis & forecasting",
      icon: TrendingUp,
      color: "from-indigo-500 to-indigo-700",
      features: ["DCF modeling", "Market analysis", "Growth projections"],
      videoPlaceholder: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop"
    },
    {
      id: "dashboard",
      title: "Client Portal",
      subtitle: "Transparent reporting for all stakeholders",
      icon: Users,
      color: "from-pink-500 to-pink-700",
      features: ["Real-time data", "Custom branding", "Mobile access"],
      videoPlaceholder: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop"
    }
  ];

  const stats = [
    { value: "500K+", label: "Works Managed", icon: Music },
    { value: "$50M+", label: "Royalties Processed", icon: DollarSign },
    { value: "10K+", label: "Contracts Executed", icon: FileText },
    { value: "99.9%", label: "Uptime", icon: Shield }
  ];

  const testimonials = [
    {
      quote: "ENCORE transformed our rights management workflow. We're processing royalties 10x faster now.",
      author: "Sarah Johnson",
      title: "VP of Rights, Harmony Music Group",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=64&h=64&fit=crop&crop=face"
    },
    {
      quote: "The catalog valuation tool helped us secure $5M in funding. Incredibly accurate forecasting.",
      author: "Michael Chen", 
      title: "Founder, Beat Capital",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
    },
    {
      quote: "Finally, a platform that speaks our language. Everything we need in one place.",
      author: "Lisa Rodriguez",
      title: "Rights Manager, Indie Publishing Co.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demoModules.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayDemo = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with Video */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/20 to-background min-h-screen flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-secondary/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <Badge className="bg-gradient-primary text-primary-foreground w-fit">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Trusted by 500+ music professionals
                </Badge>
                
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    Rights Management
                  </span>
                  <br />
                  <span className="text-foreground">Perfected</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl">
                  The only platform that scales with your music business. From indie artists to major publishers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handlePlayDemo}
                  className="border-primary/20 hover:bg-primary/5"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="text-center space-y-2">
                      <div className="bg-primary/10 rounded-full p-2 w-fit mx-auto">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right - Interactive Demo */}
            <div className="relative animate-slide-up">
              <div className="relative bg-card border rounded-2xl shadow-2xl overflow-hidden">
                {/* Demo Video/Image */}
                <div className="relative aspect-video bg-gradient-to-br from-secondary to-secondary/50">
                  <img 
                    src={demoModules[currentDemo].videoPlaceholder}
                    alt={demoModules[currentDemo].title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Button
                      size="lg"
                      onClick={handlePlayDemo}
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    >
                      <Play className="mr-2 h-6 w-6" />
                      See {demoModules[currentDemo].title} in Action
                    </Button>
                  </div>

                  {/* Module indicator */}
                  <div className="absolute top-4 left-4">
                    <Badge className={`bg-gradient-to-r ${demoModules[currentDemo].color} text-white`}>
                      {demoModules[currentDemo].title}
                    </Badge>
                  </div>
                </div>

                {/* Demo content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{demoModules[currentDemo].title}</h3>
                    <p className="text-muted-foreground">{demoModules[currentDemo].subtitle}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {demoModules[currentDemo].features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation dots */}
                <div className="flex justify-center space-x-2 pb-6">
                  {demoModules.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDemo(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentDemo ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Showcase */}
      <section className="py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 animate-fade-in">
            <Badge className="bg-primary/10 text-primary mb-4">
              Complete Suite
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Six Powerful Modules.
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                One Unified Platform.
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every tool you need to manage, protect, and monetize your music rights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {demoModules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <Card 
                  key={module.id}
                  className="group transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer border-0 bg-card/50 backdrop-blur-sm"
                  onClick={() => setCurrentDemo(index)}
                >
                  <CardHeader className="space-y-4">
                    <div className={`bg-gradient-to-r ${module.color} rounded-xl p-4 w-fit`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {module.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {module.subtitle}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {module.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Explore Module
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge className="bg-green-100 text-green-800 mb-4">
              <Star className="w-4 h-4 mr-2" />
              Trusted Worldwide
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <blockquote className="text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="flex items-center space-x-4">
                    <img 
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-gradient-to-br from-primary/5 via-secondary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge className="bg-primary/10 text-primary">
              <Globe className="w-4 h-4 mr-2" />
              Join the Revolution
            </Badge>
            
            <h2 className="text-4xl md:text-6xl font-bold">
              Ready to Transform Your
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Music Business?
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start your 14-day free trial. No credit card required. Cancel anytime.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 group px-8 py-6 text-lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-primary/20 hover:bg-primary/5 px-8 py-6 text-lg"
                asChild
              >
                <a href="https://calendly.com/encoremts" target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule Demo
                </a>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;