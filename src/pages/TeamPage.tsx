import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Linkedin, Twitter, Mail, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { updatePageMetadata } from "@/utils/seo";

const TeamPage = () => {
  useEffect(() => {
    updatePageMetadata({
      title: "Meet Our Team - Encore Music Technology",
      description: "Meet the visionary team and strategic advisors behind Encore's revolutionary music rights management platform.",
      keywords: "team, leadership, music industry experts, strategic advisors, encore team"
    });
  }, []);

  const teamMembers = [
    {
      name: "Janishia Jones",
      role: "CEO & Co-Founder",
      image: "/placeholder.svg",
      bio: "Former Head of Digital Strategy at Universal Music Group with 15+ years in music tech innovation.",
      linkedin: "#",
      twitter: "#",
      email: "janishia@encore.tech"
    },
    {
      name: "Marcus Rodriguez", 
      role: "CTO & Co-Founder",
      image: "/placeholder.svg",
      bio: "Previously led engineering at Spotify's creator platform. Expert in music data analytics and scalable systems.",
      linkedin: "#",
      twitter: "#", 
      email: "marcus@encore.tech"
    },
    {
      name: "Jennifer Walsh",
      role: "VP of Product",
      image: "/placeholder.svg",
      bio: "Former Product Lead at ASCAP, specializing in rights management workflows and industry compliance.",
      linkedin: "#",
      twitter: "#",
      email: "jennifer@encore.tech"
    },
    {
      name: "David Kim",
      role: "Head of Engineering",
      image: "/placeholder.svg", 
      bio: "Ex-Google senior engineer with expertise in AI/ML applications for music catalog analysis and valuation.",
      linkedin: "#",
      twitter: "#",
      email: "david@encore.tech"
    }
  ];

  const advisors = [
    {
      name: "Michael Thompson",
      role: "Strategic Advisor",
      company: "Former CEO, Warner Music Publishing",
      image: "/placeholder.svg",
      bio: "30+ years leading global music publishing operations. Expert in catalog acquisitions and international rights management."
    },
    {
      name: "Lisa Martinez",
      role: "Industry Advisor", 
      company: "Former VP, BMI",
      image: "/placeholder.svg",
      bio: "20+ years in performance rights organizations. Specialist in royalty distribution and industry compliance."
    },
    {
      name: "Robert Chen",
      role: "Technology Advisor",
      company: "Former CTO, Pandora",
      image: "/placeholder.svg",
      bio: "Pioneer in music streaming technology and data science. Expert in music recommendation and analytics systems."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="space-y-6">
              <Badge variant="outline" className="border-electric-lavender text-electric-lavender">
                ANALOG SOUL • DIGITAL SPINE
              </Badge>
              <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Meet the Team
                </span>
                <br />
                <span className="text-foreground">
                  Behind the Music
                </span>
              </h1>
              
              <p className="font-body text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Visionary leaders and industry experts revolutionizing music rights management 
                with deep expertise and cutting-edge technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              Our <span className="bg-gradient-primary bg-clip-text text-transparent">Leadership Team</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Industry veterans combining deep music expertise with world-class technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center group hover:shadow-elegant transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="h-24 w-24 mx-auto border-4 border-electric-lavender/20 group-hover:border-electric-lavender/40 transition-colors">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-xl font-bold">{member.name}</CardTitle>
                  <CardDescription className="text-electric-lavender font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                  <div className="flex justify-center space-x-3">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Advisors Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
              Strategic <span className="bg-gradient-primary bg-clip-text text-transparent">Advisors</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seasoned executives guiding our vision with decades of industry leadership
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {advisors.map((advisor, index) => (
              <Card key={index} className="text-center group hover:shadow-elegant transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="h-20 w-20 mx-auto border-4 border-dusty-gold/20 group-hover:border-dusty-gold/40 transition-colors">
                      <AvatarImage src={advisor.image} alt={advisor.name} />
                      <AvatarFallback className="bg-gradient-accent text-accent-foreground text-lg font-semibold">
                        {advisor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-lg font-bold">{advisor.name}</CardTitle>
                  <CardDescription className="text-dusty-gold font-medium">
                    {advisor.role}
                  </CardDescription>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {advisor.company}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{advisor.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary-foreground">
              Join Our Mission
            </h2>
            <p className="text-xl text-primary-foreground/80">
              We're always looking for passionate individuals to help revolutionize the music industry
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8 py-3"
                onClick={() => window.open("mailto:careers@encore.tech", "_blank")}
              >
                View Open Positions
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                onClick={() => window.open("mailto:hello@encore.tech", "_blank")}
              >
                Get in Touch
                <Mail className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeamPage;