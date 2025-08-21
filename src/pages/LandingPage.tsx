import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Music, TrendingUp, Shield, CheckCircle, Star, Users, Zap, Lock, Database, FileText, BarChart3, DollarSign, Clock, Award, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { updatePageMetadata } from "@/utils/seo";
import { userCases } from "@/data/user-cases";
import UserCaseCard from "@/components/UserCaseCard";

const LandingPage = () => {
  useEffect(() => {
    updatePageMetadata({
      title: "Encore Music Technology - Complete Music Rights Management Platform",
      description: "Professional music rights management, catalog valuation, and royalty processing platform. Trusted by publishers, artists, and music professionals worldwide.",
      keywords: "music rights management, catalog valuation, royalty processing, music publishing, sync licensing"
    });
  }, []);

  const handleGetStarted = (tier?: string) => {
    if (tier === "enterprise") {
      window.open("https://calendly.com/encoremts", "_blank");
    } else {
      window.location.href = "/pricing";
    }
  };

  const handleUserCaseSelect = (userCaseId: string) => {
    window.location.href = `/use-cases/${userCaseId}`;
  };

  const problems = [
    {
      icon: FileText,
      title: "Manual Rights Tracking",
      description: "Spreadsheets and paper contracts lead to missed royalties and compliance issues"
    },
    {
      icon: DollarSign,
      title: "Inaccurate Valuations",
      description: "Outdated methods fail to capture true catalog value in today's streaming economy"
    },
    {
      icon: Clock,
      title: "Slow Deal Processing",
      description: "Weeks of back-and-forth negotiations slow down revenue opportunities"
    },
    {
      icon: Shield,
      title: "Compliance Risks",
      description: "Complex regulations and reporting requirements create costly legal exposure"
    }
  ];

  const solutions = [
    {
      icon: Database,
      title: "Centralized Rights Database",
      description: "All copyrights, contracts, and ownership data in one secure platform"
    },
    {
      icon: BarChart3,
      title: "AI-Powered Valuations",
      description: "Real-time catalog valuations using streaming data and market analysis"
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Streamlined deal processing and contract management"
    },
    {
      icon: Award,
      title: "Industry Compliance",
      description: "Built-in compliance tools for MLC, PROs, and international reporting"
    }
  ];

  const features = [
    {
      title: "Copyright Management",
      description: "Track and manage all your musical works with automated CWR generation",
      icon: FileText
    },
    {
      title: "Contract Administration",
      description: "Comprehensive contract lifecycle management with AI-powered parsing",
      icon: Users
    },
    {
      title: "Royalty Processing",
      description: "Automated royalty calculations and distribution with audit trails",
      icon: DollarSign
    },
    {
      title: "Catalog Valuation",
      description: "Real-time valuations using streaming data and market analytics",
      icon: TrendingUp
    },
    {
      title: "Sync Licensing",
      description: "End-to-end sync deal management from pitch to payment",
      icon: Music
    },
    {
      title: "Client Portal",
      description: "Secure access for artists and stakeholders with role-based permissions",
      icon: Shield
    }
  ];

  const testimonials = [
    {
      quote: "Encore has transformed how we manage our catalog. The valuation tools saved us $2M in a recent acquisition.",
      author: "Sarah Chen",
      title: "VP, Catalog Investments",
      company: "Independent Music Group",
      rating: 5
    },
    {
      quote: "The automated royalty processing cut our month-end close from 2 weeks to 2 days.",
      author: "Marcus Rodriguez",
      title: "Finance Director",
      company: "Meridian Publishing",
      rating: 5
    },
    {
      quote: "Finally, a platform that understands the complexity of music rights. Game changer for our firm.",
      author: "Jennifer Walsh",
      title: "Partner",
      company: "Entertainment Law Partners",
      rating: 5
    }
  ];

  const pricingTiers = [
    {
      name: "Creator",
      price: { monthly: 99, annual: 999 },
      description: "For independent artists and small publishers",
      features: [
        "Up to 500 copyrights",
        "Basic catalog valuation",
        "Contract templates",
        "Client portal access",
        "Email support"
      ],
      tier: "creator",
      popular: false
    },
    {
      name: "Professional",
      price: { monthly: 299, annual: 2999 },
      description: "For established publishers and management companies",
      features: [
        "Up to 5,000 copyrights",
        "Advanced analytics",
        "Custom workflows",
        "API access",
        "Priority support",
        "White-label client portal"
      ],
      tier: "professional",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large catalogs and institutional investors",
      features: [
        "Unlimited copyrights",
        "Custom integrations",
        "Dedicated success manager",
        "Advanced security features",
        "SLA guarantees",
        "On-premise deployment"
      ],
      tier: "enterprise",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "How quickly can we get started?",
      answer: "Most clients are up and running within 24-48 hours. Our onboarding team provides personalized setup and data migration assistance."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We use bank-level encryption, SOC 2 compliance, and offer on-premise deployments for enterprise clients."
    },
    {
      question: "Can you integrate with our existing systems?",
      answer: "Absolutely. We offer APIs and custom integrations with most music industry platforms including PROs, distributors, and accounting systems."
    },
    {
      question: "What about international compliance?",
      answer: "Encore handles global compliance including MLC registration, international PRO reporting, and territory-specific requirements."
    },
    {
      question: "Do you offer training and support?",
      answer: "Yes. We provide comprehensive onboarding, video tutorials, live training sessions, and ongoing support based on your plan."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="space-y-6">
              <Badge variant="outline" className="border-electric-lavender text-electric-lavender">
                ANALOG SOUL • DIGITAL SPINE
              </Badge>
              <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Music Rights Management
                </span>
                <br />
                <span className="text-foreground">
                  That Actually Works
                </span>
              </h1>
              
              <p className="font-body text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                The complete platform for managing copyrights, contracts, and catalog valuations. 
                Trusted by publishers, artists, and investors worldwide.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-fader transition-all duration-300 hover:scale-105"
                onClick={() => handleGetStarted()}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-electric-lavender text-electric-lavender hover:bg-electric-lavender hover:text-jet-black transition-all duration-300"
                onClick={() => window.open("https://calendly.com/encoremts", "_blank")}
              >
                Schedule Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">Trusted by 500+ music professionals</p>
              <div className="flex justify-center items-center space-x-4 text-dusty-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
                <span className="ml-2 text-sm">4.9/5 from 200+ reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              The Music Industry Has a <span className="text-destructive">Problem</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Traditional methods can't keep up with today's complex rights landscape
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {problems.map((problem, index) => (
              <Card key={index} className="text-center border-destructive/20">
                <CardHeader>
                  <div className="bg-destructive/10 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                    <problem.icon className="h-6 w-6 text-destructive" />
                  </div>
                  <CardTitle className="text-lg">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              ENCORE <span className="bg-gradient-primary bg-clip-text text-transparent">Solves This</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Modern technology meets music industry expertise
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, index) => (
              <Card key={index} className="text-center border-success/20">
                <CardHeader>
                  <div className="bg-success/10 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                    <solution.icon className="h-6 w-6 text-success" />
                  </div>
                  <CardTitle className="text-lg">{solution.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Cases Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              Built for <span className="bg-gradient-primary bg-clip-text text-transparent">Every Music Professional</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tailored workflows for your specific role in the music industry
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {userCases.slice(0, 6).map((userCase) => (
              <UserCaseCard
                key={userCase.id}
                title={userCase.title}
                description={userCase.description}
                icon={userCase.icon}
                audience={userCase.audience}
                benefits={userCase.benefits}
                recommendedTier={userCase.recommendedTier}
                isPopular={userCase.id === "music-publishers"}
                onGetStarted={() => handleUserCaseSelect(userCase.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              Complete <span className="bg-gradient-primary bg-clip-text text-transparent">Rights Management</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to manage, value, and monetize your music catalog
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="bg-gradient-primary rounded-full p-3 w-12 h-12 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              Trusted by <span className="bg-gradient-primary bg-clip-text text-transparent">Industry Leaders</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="space-y-4">
                  <div className="flex text-dusty-gold">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg italic">"{testimonial.quote}"</blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              Simple, <span className="bg-gradient-primary bg-clip-text text-transparent">Transparent Pricing</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that scales with your catalog
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`relative ${tier.popular ? 'border-electric-lavender shadow-glow' : ''}`}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {typeof tier.price === 'string' ? tier.price : `$${tier.price.monthly}`}
                      {typeof tier.price !== 'string' && <span className="text-sm text-muted-foreground">/month</span>}
                    </div>
                    {typeof tier.price !== 'string' && (
                      <div className="text-sm text-muted-foreground">
                        or ${tier.price.annual}/year (save 17%)
                      </div>
                    )}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => handleGetStarted(tier.tier)}
                  >
                    {tier.tier === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="bg-gradient-primary bg-clip-text text-transparent">Questions</span>
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {faq.question}
                    <ChevronDown className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to Transform Your Music Business?
            </h2>
            <p className="text-xl text-primary-foreground/80">
              Join hundreds of music professionals who've modernized their rights management with Encore
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 py-3"
                onClick={() => handleGetStarted()}
              >
                Start Free Trial - No Credit Card Required
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                onClick={() => window.open("https://calendly.com/encoremts", "_blank")}
              >
                Schedule Demo
              </Button>
            </div>
            <div className="text-sm text-primary-foreground/60">
              ✓ 14-day free trial ✓ No setup fees ✓ Cancel anytime
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;