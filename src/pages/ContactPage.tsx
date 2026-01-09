import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LiveChatInterface from "@/components/LiveChatInterface";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Phone, Mail, Send, Search, Clock, CheckCircle, AlertCircle, FileText, PlayCircle, Users, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RecentTicket {
  id: string;
  subject: string;
  status: 'in_progress' | 'resolved';
  daysAgo: number;
}
const ContactPage = () => {
  const navigate = useNavigate();
  const [ticketForm, setTicketForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    priority: "",
    category: "",
    feature: "",
    subject: "",
    description: ""
  });
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([
    {
      id: "TIC-001",
      subject: "Copyright registration parsing error",
      status: "resolved",
      daysAgo: 2
    },
    {
      id: "TIC-002", 
      subject: "Writer allocation calculation issue",
      status: "in_progress",
      daysAgo: 3
    },
    {
      id: "TIC-003",
      subject: "Royalty statement import failed", 
      status: "resolved",
      daysAgo: 7
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateTicketId = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `TIC-${timestamp}`;
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ticketId = generateTicketId();
      
      // Call the edge function to send email
      const { data, error } = await supabase.functions.invoke('send-support-ticket', {
        body: {
          ...ticketForm,
          ticketId
        }
      });

      if (error) {
        throw error;
      }

      // Add to recent tickets
      const newTicket: RecentTicket = {
        id: ticketId,
        subject: ticketForm.subject,
        status: 'in_progress',
        daysAgo: 0
      };

      setRecentTickets(prev => [newTicket, ...prev]);

      toast({
        title: "Support Ticket Submitted",
        description: `Your ticket ${ticketId} has been submitted. We'll get back to you within 24 hours.`
      });

      // Reset form
      setTicketForm({
        firstName: "",
        lastName: "",
        email: "",
        priority: "",
        category: "",
        feature: "",
        subject: "",
        description: ""
      });

    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRatingSubmit = () => {
    if (rating > 0) {
      setRatingSubmitted(true);
      toast({
        title: "Thank you!",
        description: `Your ${rating}-star rating has been submitted.`,
      });
    }
  };

  const faqItems = ["How do I register my first copyright in the system?", "What royalty statement formats does ENCORE support?", "How do I set up writer splits and allocations?", "Can I integrate ENCORE with my existing accounting system?", "What's the difference between controlled and non-controlled works?", "How do I generate and send client statements?", "What contract templates are available in the system?", "How does the sync licensing pipeline work?"];
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with 3D Customer Service Graphic */}
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="/lovable-uploads/b93af567-da63-46a2-ad53-2fa5350f931c.png" 
            alt="3D Customer Service Representative" 
            className="w-96 h-96 object-contain opacity-20"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Customer Support
            </h1>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
              24/7 dedicated support for all your ENCORE Rights Management needs
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-green-400 font-medium">Online Now</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Methods */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="bg-gradient-primary rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>Get instant help from our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">AI-powered instant support</p>
                <LiveChatInterface />
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="bg-gradient-primary rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Phone className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Phone Support</CardTitle>
                <CardDescription>Speak directly with a support specialist</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary font-medium mb-4">+1 (555) 123-ENCORE</p>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="bg-gradient-primary rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Email Support</CardTitle>
                <CardDescription>Send us a detailed message</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary font-medium mb-4">Support@encoremusic.tech</p>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                  <a href="mailto:Support@encoremusic.tech">Send Email</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Support Ticket Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Submit a Support Ticket
              </CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" value={ticketForm.firstName} onChange={e => setTicketForm({
                    ...ticketForm,
                    firstName: e.target.value
                  })} required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" value={ticketForm.lastName} onChange={e => setTicketForm({
                    ...ticketForm,
                    lastName: e.target.value
                  })} required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={ticketForm.email} onChange={e => setTicketForm({
                  ...ticketForm,
                  email: e.target.value
                })} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={ticketForm.priority} onValueChange={value => setTicketForm({
                    ...ticketForm,
                    priority: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Low - General inquiry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="medium">Medium - Issue affecting workflow</SelectItem>
                        <SelectItem value="high">High - Urgent issue</SelectItem>
                        <SelectItem value="critical">Critical - System down</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={ticketForm.category} onValueChange={value => setTicketForm({
                    ...ticketForm,
                    category: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Account & Billing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="billing">Account & Billing</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="integration">Integration Help</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="feature">Feature</Label>
                    <Select value={ticketForm.feature} onValueChange={value => setTicketForm({
                    ...ticketForm,
                    feature: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select feature" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="catalog-valuation">Catalog Valuation</SelectItem>
                        <SelectItem value="royalties-processing">Royalties Processing</SelectItem>
                        <SelectItem value="copyright-registration">Copyright Registration</SelectItem>
                        <SelectItem value="contract-management">Contract Management</SelectItem>
                        <SelectItem value="sync-licensing">Sync Licensing</SelectItem>
                        <SelectItem value="client-portal">Client Portal</SelectItem>
                        <SelectItem value="reporting">Reporting & Analytics</SelectItem>
                        <SelectItem value="integrations">Third-party Integrations</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Brief description of your issue" value={ticketForm.subject} onChange={e => setTicketForm({
                  ...ticketForm,
                  subject: e.target.value
                })} required />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Please provide detailed information about your issue..." rows={4} value={ticketForm.description} onChange={e => setTicketForm({
                  ...ticketForm,
                  description: e.target.value
                })} required />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-primary-foreground"
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search FAQs..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="space-y-2">
                  {faqItems.map((faq, index) => <button key={index} className="w-full text-left p-2 hover:bg-muted rounded-md transition-colors text-sm">
                      {faq}
                    </button>)}
                </div>
                <Button variant="outline" className="w-full">View All FAQs</Button>
              </CardContent>
            </Card>

            {/* Recent Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Your Recent Tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTickets.map(ticket => <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">#{ticket.id} • {ticket.daysAgo} days ago</p>
                    </div>
                    <Badge variant={ticket.status === "resolved" ? "default" : "secondary"} className="text-xs">
                      {ticket.status === "resolved" ? <><CheckCircle className="h-3 w-3 mr-1" />Resolved</> : <><Clock className="h-3 w-3 mr-1" />In Progress</>}
                    </Badge>
                  </div>)}
              </CardContent>
            </Card>

            {/* Helpful Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Helpful Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/documentation')}>
                  <FileText className="h-4 w-4 mr-2" />
                  User Guide & Documentation
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Video Tutorials
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Community Forum
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rate Our Support */}
        <Separator className="my-12" />
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Rate Our Support</CardTitle>
            <CardDescription>How was your experience with our support team?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!ratingSubmitted ? (
              <>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      className="p-1 transition-transform hover:scale-110"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                    >
                      <Star 
                        className={`h-6 w-6 transition-colors ${
                          star <= (hoveredRating || rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {rating > 0 && `You rated us ${rating} star${rating !== 1 ? 's' : ''}`}
                  {rating === 0 && 'Click a star to rate your experience'}
                </div>
                <Button 
                  className="bg-gradient-primary text-primary-foreground w-full"
                  onClick={handleRatingSubmit}
                  disabled={rating === 0}
                >
                  Submit Rating
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`h-6 w-6 ${
                        star <= rating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Thank you for your feedback!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default ContactPage;