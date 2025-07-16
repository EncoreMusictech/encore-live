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
  Calendar,
  Cpu,
  Database,
  Network,
  BrainCircuit,
  Binary,
  Hexagon,
  Bot,
  Eye,
  Command
} from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [currentDemo, setCurrentDemo] = useState(0);
  const [activeHex, setActiveHex] = useState(0);
  const [glitchText, setGlitchText] = useState("Rights Management");

  const demoModules = [
    {
      id: "royalties",
      title: "AI Royalties Engine",
      subtitle: "Neural network-powered distribution algorithms",
      icon: BrainCircuit,
      color: "from-cyan-400 to-blue-600",
      features: ["Quantum calculations", "Predictive analytics", "Auto-reconciliation"],
      videoPlaceholder: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=450&fit=crop",
      hexColor: "#00ffff"
    },
    {
      id: "copyright",
      title: "Blockchain Rights Registry", 
      subtitle: "Immutable ownership verification system",
      icon: Database,
      color: "from-purple-400 to-indigo-600",
      features: ["Smart contracts", "Cryptographic proof", "Global registry"],
      videoPlaceholder: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop",
      hexColor: "#8b5cf6"
    },
    {
      id: "contracts",
      title: "Digital Contract Matrix",
      subtitle: "Self-executing agreement infrastructure",
      icon: Network,
      color: "from-green-400 to-emerald-600", 
      features: ["Auto-execution", "Multi-sig validation", "Legal AI assist"],
      videoPlaceholder: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop",
      hexColor: "#10b981"
    },
    {
      id: "sync",
      title: "Sync Intelligence Hub",
      subtitle: "Predictive placement optimization",
      icon: Eye,
      color: "from-yellow-400 to-orange-600",
      features: ["Market scanning", "Auto-matching", "Revenue forecasting"], 
      videoPlaceholder: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=450&fit=crop",
      hexColor: "#f59e0b"
    },
    {
      id: "valuation",
      title: "Quantum Valuation Core",
      subtitle: "Multiverse asset analysis engine",
      icon: Command,
      color: "from-indigo-400 to-purple-600",
      features: ["Quantum modeling", "Parallel scenarios", "AI predictions"],
      videoPlaceholder: "https://images.unsplash.com/photo-1551038247-3d9af20df552?w=800&h=450&fit=crop",
      hexColor: "#6366f1"
    },
    {
      id: "dashboard",
      title: "Holographic Interface",
      subtitle: "Immersive data visualization portal",
      icon: Bot,
      color: "from-pink-400 to-rose-600",
      features: ["3D analytics", "AR overlays", "Voice commands"],
      videoPlaceholder: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=450&fit=crop",
      hexColor: "#ec4899"
    }
  ];

  const stats = [
    { value: "∞", label: "Quantum Calculations/sec", icon: Cpu },
    { value: "99.99%", label: "Neural Accuracy", icon: BrainCircuit },
    { value: "0.001ms", label: "Latency", icon: Zap },
    { value: "256-bit", label: "Encryption", icon: Shield }
  ];

  const testimonials = [
    {
      quote: "ENCORE's AI completely revolutionized our workflow. It's like having a team of experts working 24/7.",
      author: "Dr. Sarah Chen",
      title: "Chief Technology Officer, NeuroSound Labs",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=64&h=64&fit=crop&crop=face"
    },
    {
      quote: "The quantum valuation algorithms predicted market trends with 99.7% accuracy. Unprecedented.",
      author: "Marcus Webb", 
      title: "Head of Digital Assets, FutureMusic Corp",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
    },
    {
      quote: "This isn't just software - it's the future of rights management. Pure digital evolution.",
      author: "Elena Rodriguez",
      title: "Blockchain Specialist, Quantum Rights",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
    }
  ];

  const glitchTexts = ["Rights Management", "Digital Evolution", "Quantum Computing", "Neural Networks"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demoModules.length);
      setActiveHex((prev) => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const randomText = glitchTexts[Math.floor(Math.random() * glitchTexts.length)];
      setGlitchText(randomText);
    }, 3000);
    return () => clearInterval(glitchInterval);
  }, []);

  const HexagonGrid = () => (
    <div className="absolute inset-0 overflow-hidden opacity-10">
      <div className="grid grid-cols-8 gap-4 transform rotate-12 scale-150">
        {[...Array(48)].map((_, i) => (
          <Hexagon 
            key={i} 
            className={`w-8 h-8 ${i === activeHex * 8 + (activeHex % 6) ? 'text-cyan-400' : 'text-white/20'} transition-colors duration-1000`} 
          />
        ))}
      </div>
    </div>
  );

  const DigitalGrid = () => (
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header />
      
      {/* Futuristic Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Digital Grid */}
        <DigitalGrid />
        
        {/* Hexagon Pattern */}
        <HexagonGrid />
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Circuit Lines */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/50 to-transparent" />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white w-fit border-0">
                  <Binary className="w-4 h-4 mr-2" />
                  Next-Gen Technology • Quantum-Powered
                </Badge>
                
                <h1 className="text-5xl md:text-7xl font-bold leading-tight font-mono">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                    {glitchText}
                  </span>
                  <br />
                  <span className="text-white relative">
                    <span className="absolute inset-0 text-cyan-400 opacity-50 blur-sm">Evolved</span>
                    Evolved
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-xl font-light">
                  AI-powered rights management platform. Neural networks. Quantum computing. The future is now.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.7)] transition-all group border-0"
                >
                  Initialize System
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Neural Demo
                </Button>
              </div>

              {/* Futuristic Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="text-center space-y-2 group">
                      <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg p-3 w-fit mx-auto border border-cyan-500/30 group-hover:border-cyan-400 transition-colors">
                        <IconComponent className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-bold text-cyan-400 font-mono">{stat.value}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right - Holographic Interface */}
            <div className="relative animate-slide-up">
              <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.3)] overflow-hidden backdrop-blur-sm">
                {/* Holographic Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 rounded-2xl" />
                
                {/* Demo Interface */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black p-1">
                  <div className="relative w-full h-full rounded-xl overflow-hidden">
                    <img 
                      src={demoModules[currentDemo].videoPlaceholder}
                      alt={demoModules[currentDemo].title}
                      className="w-full h-full object-cover opacity-80"
                    />
                    
                    {/* Digital Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-purple-500/20" />
                    
                    {/* Holographic UI Elements */}
                    <div className="absolute inset-0 p-4">
                      {/* Top HUD */}
                      <div className="flex justify-between items-start">
                        <Badge className={`bg-gradient-to-r ${demoModules[currentDemo].color} text-white border-0`}>
                          <Cpu className="w-3 h-3 mr-1" />
                          {demoModules[currentDemo].title}
                        </Badge>
                        <div className="text-xs text-cyan-400 font-mono">
                          [{String(currentDemo + 1).padStart(2, '0')}/06] ACTIVE
                        </div>
                      </div>
                      
                      {/* Center Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          size="lg"
                          className="bg-black/50 backdrop-blur-sm border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400"
                        >
                          <Play className="mr-2 h-6 w-6" />
                          Initialize {demoModules[currentDemo].title}
                        </Button>
                      </div>
                      
                      {/* Bottom Status */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/60 backdrop-blur-sm rounded border border-cyan-500/30 p-2">
                          <div className="text-xs text-cyan-400 font-mono mb-1">SYSTEM STATUS</div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-400">● ONLINE</span>
                            <span className="text-cyan-400">NEURAL LOAD: 23%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module Info Panel */}
                <div className="p-6 space-y-4 bg-gradient-to-br from-gray-900/90 to-black/90">
                  <div>
                    <h3 className="text-xl font-semibold text-cyan-400 font-mono">
                      {demoModules[currentDemo].title}
                    </h3>
                    <p className="text-gray-300">{demoModules[currentDemo].subtitle}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {demoModules[currentDemo].features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Indicators */}
                <div className="flex justify-center space-x-2 pb-6">
                  {demoModules.map((module, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDemo(index)}
                      className={`w-3 h-3 rounded-full border transition-all ${
                        index === currentDemo 
                          ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]' 
                          : 'border-cyan-500/30 hover:border-cyan-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neural Network Modules */}
      <section className="py-32 bg-gradient-to-b from-black via-gray-900 to-black relative">
        <DigitalGrid />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20 animate-fade-in">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-4 border-0">
              <BrainCircuit className="w-4 h-4 mr-2" />
              Neural Architecture
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-mono">
              Six Quantum Modules.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Infinite Possibilities.
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Each module powered by advanced AI algorithms and quantum computing principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {demoModules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <Card 
                  key={module.id}
                  className="group transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,255,255,0.3)] hover:-translate-y-2 cursor-pointer border border-cyan-500/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm"
                  onClick={() => setCurrentDemo(index)}
                >
                  <CardHeader className="space-y-4">
                    <div className={`bg-gradient-to-r ${module.color} rounded-xl p-4 w-fit relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <IconComponent className="h-8 w-8 text-white relative z-10" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-cyan-400 transition-colors font-mono">
                        {module.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {module.subtitle}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {module.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-gradient-to-r group-hover:from-cyan-500/20 group-hover:to-purple-500/20 group-hover:text-cyan-400 transition-all border border-cyan-500/20 group-hover:border-cyan-400"
                    >
                      Access Module
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Digital Testimonials */}
      <section className="py-32 bg-gradient-to-b from-black via-gray-900 to-black relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1439337153520-7082a56a81f4?w=1200&h=800&fit=crop')] opacity-5 bg-cover bg-center" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white mb-4 border-0">
              <Eye className="w-4 h-4 mr-2" />
              User Feedback Matrix
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-mono">
              Digital Testimonials
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-cyan-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-cyan-400 text-cyan-400" />
                    ))}
                  </div>
                  
                  <blockquote className="text-lg leading-relaxed text-gray-300 font-light">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img 
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/30"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20" />
                    </div>
                    <div>
                      <div className="font-semibold text-cyan-400 font-mono">{testimonial.author}</div>
                      <div className="text-sm text-gray-400">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final Quantum CTA */}
      <section className="py-32 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494891848038-7bd202a2afeb?w=1200&h=800&fit=crop')] opacity-10 bg-cover bg-center" />
        <DigitalGrid />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0">
              <Globe className="w-4 h-4 mr-2" />
              Join the Digital Revolution
            </Badge>
            
            <h2 className="text-4xl md:text-6xl font-bold font-mono">
              Initialize Your
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Digital Evolution
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Access the quantum realm of rights management. Neural networks included.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.7)] transition-all group px-8 py-6 text-lg border-0"
              >
                Initialize System
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 px-8 py-6 text-lg"
                asChild
              >
                <a href="https://calendly.com/encoremts" target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-5 w-5" />
                  Neural Consultation
                </a>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Quantum-secured trial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span>Neural integration ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span>Instant deployment</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;