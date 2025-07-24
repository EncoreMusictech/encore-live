import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  BookOpen,
  PlayCircle,
  Download,
  FileText,
  Music,
  DollarSign,
  Users,
  Shield,
  Zap,
  ChevronRight,
  Home,
  ArrowLeft,
  ExternalLink
} from "lucide-react";

const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("overview");

  const categories = [
    { id: "overview", title: "System Overview", icon: Home },
    { id: "modules", title: "Module Documentation", icon: BookOpen },
    { id: "getting-started", title: "Getting Started", icon: Zap },
    { id: "training", title: "Training Materials", icon: PlayCircle },
    { id: "technical", title: "Technical Docs", icon: FileText },
  ];

  const modules = [
    {
      id: "copyright",
      title: "Copyright Management",
      description: "Comprehensive copyright registration and management system",
      icon: Shield,
      features: ["Work Registration", "Writer Management", "Publisher Tracking", "CWR Support"]
    },
    {
      id: "royalties",
      title: "Royalty Processing",
      description: "Advanced royalty calculation and distribution system",
      icon: DollarSign,
      features: ["Statement Import", "Allocation Management", "Payout Processing", "Reconciliation"]
    },
    {
      id: "contracts",
      title: "Contract Management",
      description: "Complete contract lifecycle management",
      icon: FileText,
      features: ["Agreement Creation", "Template Library", "Digital Signatures", "Workflow Management"]
    },
    {
      id: "sync",
      title: "Sync Licensing",
      description: "Synchronization licensing and rights clearance",
      icon: Music,
      features: ["License Management", "Rights Clearance", "Deal Tracking", "Revenue Management"]
    },
    {
      id: "client-portal",
      title: "Client Portal",
      description: "Self-service portal for clients and writers",
      icon: Users,
      features: ["Account Access", "Statement Views", "Document Management", "Communication"]
    }
  ];

  const quickStartGuides = [
    {
      title: "Setting Up Your First Copyright",
      description: "Learn how to register and manage your first musical work",
      duration: "5 min read",
      category: "Copyright"
    },
    {
      title: "Processing Your First Royalty Statement",
      description: "Import and allocate royalties from streaming platforms",
      duration: "8 min read",
      category: "Royalties"
    },
    {
      title: "Creating a Publishing Agreement",
      description: "Generate your first publishing contract with templates",
      duration: "10 min read",
      category: "Contracts"
    },
    {
      title: "Managing Sync Licenses",
      description: "Track and manage synchronization licensing deals",
      duration: "7 min read",
      category: "Sync"
    }
  ];

  const videoTutorials = [
    {
      title: "ENCORE Platform Overview",
      description: "Complete walkthrough of the ENCORE Rights Management System",
      duration: "15:30",
      category: "Getting Started"
    },
    {
      title: "Advanced Royalty Allocation",
      description: "Master complex royalty splits and allocation scenarios",
      duration: "22:45",
      category: "Royalties"
    },
    {
      title: "Contract Template Customization",
      description: "Create and customize contract templates for your needs",
      duration: "18:20",
      category: "Contracts"
    },
    {
      title: "Client Portal Administration",
      description: "Set up and manage client access and permissions",
      duration: "12:15",
      category: "Administration"
    }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">ENCORE Rights Management System</h2>
        <p className="text-lg text-muted-foreground mb-6">
          A comprehensive platform for music intellectual property management, designed for publishers, 
          record labels, and rights administrators.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bank-level security with end-to-end encryption and audit trails
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Real-time Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Lightning-fast royalty calculations and instant reporting
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Multi-tenant Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Separate client portals with customizable access controls
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-2xl font-semibold mb-4">Core Modules</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((module) => (
            <Card key={module.id} className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <module.icon className="h-6 w-6 text-primary" />
                  <CardTitle>{module.title}</CardTitle>
                </div>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {module.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModules = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Module Documentation</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Detailed documentation for each module in the ENCORE system.
        </p>
      </div>

      {modules.map((module) => (
        <Card key={module.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <module.icon className="h-6 w-6 text-primary" />
              <CardTitle>{module.title}</CardTitle>
            </div>
            <CardDescription>{module.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Key Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {module.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View Documentation
              </Button>
              <Button variant="outline" size="sm">
                <PlayCircle className="h-4 w-4 mr-2" />
                Watch Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderGettingStarted = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Everything you need to know to start using ENCORE effectively.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guides</CardTitle>
          <CardDescription>Step-by-step guides to get you up and running quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickStartGuides.map((guide, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{guide.title}</h4>
                  <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{guide.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{guide.duration}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Requirements</CardTitle>
          <CardDescription>Technical requirements and browser compatibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Supported Browsers:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Chrome 90+ (Recommended)</li>
              <li>Firefox 88+</li>
              <li>Safari 14+</li>
              <li>Edge 90+</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">File Formats Supported:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Audio: MP3, WAV, FLAC, AAC</li>
              <li>Documents: PDF, DOC, DOCX, XLS, XLSX</li>
              <li>Royalty Statements: CSV, XLS, XLSX, PDF</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Training Materials</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Comprehensive training resources including video tutorials, webinars, and certification programs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Tutorials</CardTitle>
          <CardDescription>Step-by-step video guides for all system features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoTutorials.map((video, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{video.title}</h4>
                  <Badge variant="outline" className="text-xs">{video.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{video.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{video.duration}</span>
                  <PlayCircle className="h-4 w-4 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Training Sessions</CardTitle>
            <CardDescription>Join our weekly live training sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Weekly Schedule:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>Tuesdays 2PM EST - New User Onboarding</li>
                <li>Thursdays 11AM EST - Advanced Features</li>
                <li>Fridays 3PM EST - Q&A Sessions</li>
              </ul>
            </div>
            <Button className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Register for Training
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certification Program</CardTitle>
            <CardDescription>Become an ENCORE certified administrator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Certification Levels:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>Basic User Certification</li>
                <li>Advanced Administrator</li>
                <li>System Specialist</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              View Certification Info
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTechnical = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Technical Documentation</h2>
        <p className="text-lg text-muted-foreground mb-6">
          API documentation, integration guides, and technical specifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>RESTful API for system integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Available Endpoints:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Copyright Management API</li>
                <li>Royalty Processing API</li>
                <li>Contract Management API</li>
                <li>Reporting & Analytics API</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View API Docs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Guides</CardTitle>
            <CardDescription>Connect ENCORE with your existing systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Popular Integrations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Spotify for Artists</li>
                <li>ASCAP/BMI Reporting</li>
                <li>DocuSign Integration</li>
                <li>QuickBooks Sync</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Guides
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Import/Export</CardTitle>
          <CardDescription>Migrate your existing data to ENCORE</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Copyright Data</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>CWR Format Support</li>
                <li>DDEX Compatibility</li>
                <li>Custom CSV Templates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Royalty Statements</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Standard Statement Formats</li>
                <li>Custom Field Mapping</li>
                <li>Automated Processing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contract Migration</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>PDF Parsing</li>
                <li>Template Conversion</li>
                <li>Bulk Import Tools</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (selectedCategory) {
      case "overview":
        return renderOverview();
      case "modules":
        return renderModules();
      case "getting-started":
        return renderGettingStarted();
      case "training":
        return renderTraining();
      case "technical":
        return renderTechnical();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 bg-gradient-primary">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              ENCORE Documentation
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Complete guide to mastering the ENCORE Rights Management System
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                className="pl-10 bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                      selectedCategory === category.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <category.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{category.title}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contact
              </Button>
            </div>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;