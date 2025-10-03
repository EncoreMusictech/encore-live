import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Linkedin, Mail, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { updatePageMetadata } from "@/utils/seo";

// Import team member photos
import janishiaPhoto from "@/assets/janishia-jones.png";
import lawrencePhoto from "@/assets/lawrence-berment.png";
import anthonyPhoto from "@/assets/anthony-griffith.png";
import kebuPhoto from "@/assets/kebu-commissiong.png";
import chrisPhoto from "@/assets/chris-mcmurtry.png";
import hazelPhoto from "@/assets/hazel-savage-new.jpg";

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
      role: "CEO & Founder",
      image: janishiaPhoto,
      bio: "15-year rights & royalties management expert & advisor. Formerly UMG / EONE / Kobalt Music Publishing / Empire / Crunchyroll.",
      linkedin: "https://linkedin.com/in/janishiajones",
      email: "janishia@encore.tech"
    },
    {
      name: "Lawrence Berment", 
      role: "CTO",
      image: lawrencePhoto,
      bio: "20+ year infrastructure architect & Grammy-nominated creator. Formerly BlueKai (Oracle) / LA Promise Fund / PayPal / IGT / Mynd Sound.",
      linkedin: "https://linkedin.com/in/lawrenceberment",
      email: "lawrence@encore.tech"
    },
    {
      name: "Anthony Griffith",
      role: "Head of Customer Success",
      image: anthonyPhoto,
      bio: "10+ year A&R strategist & royalties executive. Formerly UMG / Sony / NVLG Music / Entertainment Business Affairs.",
      linkedin: "https://linkedin.com/in/anthony-griffith-id",
      email: "anthony@encore.tech"
    },
    {
      name: "Kebu Commissiong",
      role: "VP, Sales & Growth",
      image: kebuPhoto,
      bio: "15+ year strategic advisor, global rights & royalties expert with A&R + catalog monetization focus. Formerly TuneCore / Sentric Music / Revelator / Tommy Boy / Believe.",
      linkedin: "https://linkedin.com/in/kebu-commissiong-02559047",
      email: "kebu@encore.tech"
    }
  ];

  const advisors = [
    {
      name: "Chris McMurtry",
      role: "Technology Advisor", 
      company: "Former Head of Product at Pex and Exactuals",
      image: chrisPhoto,
      bio: "A former classical label exec turned product visionary, Chris has built pioneering metadata and rights payment platforms across music tech. As founder of Dart Music and Head of Product at Exactuals and Pex, he's spent over a decade solving attribution, data accuracy, and automation issues for global rights holders. Named one of Billboard's Digital Power Players, Chris now advises ENCORE on infrastructure, interoperability, and product-market fit."
    },
    {
      name: "Hazel Savage",
      role: "Strategic Advisor", 
      company: "CEO at Syntho",
      image: hazelPhoto,
      bio: "With 18 years experience in the industry, Hazel is a music-tech lifer, guitarist and former CEO/Co-Founder at Musiio. She started her music-tech journey as an early employee at Shazam and spent time understanding the pain points of the industry at Pandora, Universal and HMV before launching Musiio in 2018 and then selling the business to SoundCloud in 2022. Hazel joined Syntho as CEO in 2025."
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(member.linkedin, "_blank")}
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(`mailto:${member.email}`, "_blank")}
                    >
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="mt-2 text-xs text-center">
                      {advisor.company}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {Array.isArray(advisor.bio) ? (
                    <ul className="text-sm text-muted-foreground leading-relaxed space-y-1">
                      {advisor.bio.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">{advisor.bio}</p>
                  )}
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