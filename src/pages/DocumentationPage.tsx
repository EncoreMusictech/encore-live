import { useState } from "react";
import Header from "@/components/Header";
import { RoyaltiesUserGuideDialog } from "@/components/royalties/guide/RoyaltiesUserGuideDialog";
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
  ExternalLink,
  Copyright,
  Film,
  Archive,
  CreditCard,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Upload,
  Settings,
  Database,
  Calendar,
  Calculator,
  Send,
  Clock
} from "lucide-react";

const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("overview");
  const [royaltiesGuideOpen, setRoyaltiesGuideOpen] = useState(false);

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
      description: "Comprehensive copyright registration and management system with PRO integration",
      icon: Copyright,
      tier: "Free",
      features: [
        "Work Registration & Metadata Management",
        "Writer & Publisher Split Tracking", 
        "PRO Registration Status (ASCAP/BMI/SOCAN/SESAC)",
        "ISRC/ISWC/IPI Number Management",
        "Duplicate Work Detection",
        "CWR & DDEX Export Support",
        "Bulk Upload & Import",
        "Territory & Rights Management"
      ],
      capabilities: {
        registration: [
          "Complete work registration with metadata",
          "Multiple writers and publishers per work",
          "Ownership percentage calculations",
          "Territory-specific rights management",
          "Work classification and type tracking"
        ],
        integration: [
          "ASCAP work lookup and validation",
          "PRO registration status tracking",
          "CWR (Common Works Registration) support",
          "DDEX standard compliance",
          "CSV/Excel bulk import functionality"
        ],
        management: [
          "Work version control and history",
          "Duplicate detection algorithms",
          "Automated validation checks",
          "Activity logging and audit trails",
          "Advanced search and filtering"
        ]
      }
    },
    {
      id: "royalties",
      title: "Royalty Processing",
      description: "End-to-end royalty management from statement import to client payouts",
      icon: DollarSign,
      tier: "Pro",
      features: [
        "Multi-Source Statement Import",
        "Automated Work-to-Rightsholder Mapping",
        "Advanced Allocation Calculations",
        "Batch Processing & Reconciliation",
        "Client Statement Generation",
        "Payment Processing Integration",
        "Recoupment & Expense Management",
        "Analytics & Reporting Dashboard"
      ],
      capabilities: {
        reconciliation: [
          "Import statements from DSPs, PROs, YouTube",
          "Automated source detection and parsing",
          "Field mapping and data validation",
          "Batch processing with error handling",
          "Duplicate detection and merging"
        ],
        allocation: [
          "Song matching with fuzzy logic",
          "Writer and publisher split calculations",
          "Controlled vs non-controlled status tracking",
          "Recoupable expense deductions",
          "Commission and fee calculations"
        ],
        payouts: [
          "Automated payout calculations",
          "Multi-currency support",
          "Payment method integration",
          "Statement generation and delivery",
          "Accounting and balance tracking"
        ]
      }
    },
    {
      id: "contracts",
      title: "Contract Management",
      description: "Complete contract lifecycle management with templates and digital signatures",
      icon: FileText,
      tier: "Free",
      features: [
        "Multi-Type Contract Support",
        "Template Library & Builder",
        "Digital Signature Integration",
        "Automated Field Extraction",
        "Workflow Management",
        "Deadline & Renewal Alerts",
        "Document Version Control",
        "Integration with Royalties"
      ],
      capabilities: {
        creation: [
          "Publishing agreements (exclusive/non-exclusive)",
          "Artist recording agreements",
          "Producer agreements",
          "Sync licensing contracts",
          "Distribution agreements",
          "Custom contract types"
        ],
        management: [
          "Template customization and reuse",
          "Smart field auto-population",
          "Schedule of works integration",
          "Interested parties management",
          "Financial terms tracking"
        ],
        workflow: [
          "Multi-step approval process",
          "DocuSign integration",
          "Contract status tracking",
          "Email notifications",
          "Audit trail and change logs"
        ]
      }
    },
    {
      id: "sync",
      title: "Sync Licensing",
      description: "Comprehensive sync deal pipeline with pitch tracking and rights clearance",
      icon: Film,
      tier: "Pro",
      features: [
        "Opportunity Pipeline Management",
        "Pitch Status Tracking",
        "Rights Clearance Workflow",
        "Media Type Categorization",
        "Territory & Term Management",
        "Deal Memo Generation",
        "Payment Tracking",
        "Contact & Agent Management"
      ],
      capabilities: {
        pipeline: [
          "Lead capture and qualification",
          "Pitch submission tracking",
          "Follow-up scheduling",
          "Win/loss analytics",
          "Revenue forecasting"
        ],
        clearance: [
          "Rights availability checking",
          "Master and sync rights verification",
          "Third-party clearance coordination",
          "Legal review workflow",
          "Approval documentation"
        ],
        execution: [
          "Deal memo generation",
          "Contract execution tracking",
          "Payment milestone management",
          "Revenue allocation",
          "Reporting and analytics"
        ]
      }
    },
    {
      id: "catalog-valuation",
      title: "Catalog Valuation",
      description: "AI-powered catalog assessment with forecasting and deal simulation",
      icon: TrendingUp,
      tier: "Pro",
      features: [
        "Spotify Data Integration",
        "Multi-Methodology Valuation",
        "Growth Forecasting (3-5 years)",
        "Risk-Adjusted Analysis",
        "Deal Structure Simulation",
        "Comparable Analysis",
        "Investor Report Generation",
        "Confidence Scoring"
      ],
      capabilities: {
        valuation: [
          "DCF (Discounted Cash Flow) analysis",
          "Revenue multiple methodology",
          "Risk-adjusted valuation models",
          "Genre-specific benchmarking",
          "Confidence scoring algorithms"
        ],
        simulation: [
          "Acquisition scenario modeling",
          "Licensing deal structures",
          "Co-publishing arrangements",
          "ROI and payback calculations",
          "Sensitivity analysis"
        ],
        reporting: [
          "Professional valuation reports",
          "Executive summaries",
          "Detailed methodology explanations",
          "Comparable transaction analysis",
          "Risk factor assessments"
        ]
      }
    },
    {
      id: "client-portal",
      title: "Client Portal",
      description: "Secure multi-tenant portal with role-based access and custom dashboards",
      icon: Users,
      tier: "Pro",
      features: [
        "Role-Based Access Control",
        "Custom Permission Sets",
        "Artist Earnings Dashboard",
        "Statement & Document Access",
        "Communication Tools",
        "Mobile-Responsive Design",
        "Analytics & Insights"
      ],
      capabilities: {
        access: [
          "Multi-tenant architecture",
          "Granular permission controls",
          "Secure authentication",
          "Session management",
          "Audit logging"
        ],
        dashboard: [
          "Personalized earnings views",
          "Work performance analytics",
          "Payment history tracking",
          "Statement downloads",
          "Contract access"
        ],
        communication: [
          "In-portal messaging",
          "Notification system",
          "Document sharing",
          "Support ticket integration",
          "Announcement broadcasting"
        ]
      }
    }
  ];

  const quickStartGuides = [
    {
      title: "Setting Up Your First Copyright",
      description: "Complete guide to registering musical works with metadata and splits",
      duration: "8 min read",
      category: "Copyright",
      steps: [
        "Navigate to Copyright Management module",
        "Click 'Register New Work' button",
        "Fill in work title and basic metadata",
        "Add writers with ownership percentages",
        "Add publishers and their shares",
        "Set PRO registration status",
        "Add recordings and ISRC codes",
        "Validate and submit for registration"
      ]
    },
    {
      title: "Processing Your First Royalty Statement",
      description: "Step-by-step guide to import and allocate streaming royalties",
      duration: "12 min read",
      category: "Royalties",
      steps: [
        "Go to Reconciliation module",
        "Create new batch for statement period",
        "Upload CSV/Excel statement file",
        "Review field mapping and data validation",
        "Process and import staging records",
        "Navigate to Royalties Allocation",
        "Match songs to existing copyrights",
        "Allocate earnings to writers/publishers",
        "Generate and send client statements"
      ]
    },
    {
      title: "Creating a Publishing Agreement",
      description: "Generate professional publishing contracts using templates",
      duration: "10 min read",
      category: "Contracts",
      steps: [
        "Access Contract Management module",
        "Select 'Publishing Agreement' template",
        "Enter counterparty information",
        "Set financial terms and percentages",
        "Add schedule of works",
        "Configure interested parties",
        "Set territories and term dates",
        "Generate PDF and send for signature"
      ]
    },
    {
      title: "Managing Sync License Opportunities",
      description: "Track and manage synchronization licensing deals end-to-end",
      duration: "7 min read",
      category: "Sync",
      steps: [
        "Open Sync Licensing module",
        "Create new opportunity record",
        "Add project and contact details",
        "Set media type and usage terms",
        "Track pitch submission status",
        "Manage rights clearance process",
        "Execute deal and generate memo",
        "Track payments and renewals"
      ]
    },
    {
      title: "Setting Up Client Portal Access",
      description: "Configure secure client access with custom permissions",
      duration: "6 min read",
      category: "Client Portal",
      steps: [
        "Navigate to Client Administration",
        "Send invitation to client email",
        "Set role and permission levels",
        "Assign relevant data access",
        "Configure dashboard modules",
        "Test client login and access",
        "Provide training and documentation"
      ]
    }
  ];

  const videoTutorials = [
    {
      title: "ENCORE Platform Overview",
      description: "Complete walkthrough of all modules and core functionality",
      duration: "15:30",
      category: "Getting Started"
    },
    {
      title: "Advanced Copyright Registration",
      description: "Master complex work registration with multiple writers and publishers",
      duration: "18:45",
      category: "Copyright"
    },
    {
      title: "Royalty Statement Processing Workflow",
      description: "End-to-end royalty processing from import to payout",
      duration: "25:20",
      category: "Royalties"
    },
    {
      title: "Contract Template Customization",
      description: "Create and customize contract templates for your specific needs",
      duration: "14:15",
      category: "Contracts"
    },
    {
      title: "Sync Licensing Pipeline Management",
      description: "Optimize your sync licensing workflow for maximum efficiency",
      duration: "16:30",
      category: "Sync"
    },
    {
      title: "Catalog Valuation Methodologies",
      description: "Understanding DCF, multiples, and risk-adjusted valuation approaches",
      duration: "22:10",
      category: "Valuation"
    },
    {
      title: "Client Portal Administration",
      description: "Set up and manage multi-tenant client access with custom permissions",
      duration: "12:45",
      category: "Administration"
    }
  ];

  const workflowGuides = [
    {
      title: "End-to-End Royalty Processing",
      description: "Complete workflow from statement receipt to client payment",
      steps: [
        "Receive royalty statements from DSPs/PROs",
        "Create reconciliation batch",
        "Import and validate statement data",
        "Match songs to registered copyrights",
        "Calculate writer/publisher allocations",
        "Apply expenses and recoupments",
        "Generate client statements",
        "Process payments via integrated systems",
        "Update accounting and balance records"
      ]
    },
    {
      title: "Publishing Agreement Lifecycle",
      description: "From initial negotiation to ongoing administration",
      steps: [
        "Initial deal negotiation and terms",
        "Create contract from template",
        "Add schedule of works",
        "Configure financial terms",
        "Send for digital signature",
        "Link works to royalty allocations",
        "Monitor performance and payments",
        "Handle renewals and amendments"
      ]
    },
    {
      title: "Sync Licensing Deal Flow",
      description: "Managing opportunities from pitch to payment",
      steps: [
        "Receive sync opportunity inquiry",
        "Create opportunity record",
        "Assess rights availability",
        "Prepare and submit pitch",
        "Negotiate terms and fees",
        "Execute licensing agreement",
        "Track usage and payments",
        "Manage renewals and extensions"
      ]
    }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">ENCORE Rights Management System</h2>
        <p className="text-lg text-muted-foreground mb-6">
          A comprehensive, enterprise-grade platform for music intellectual property management, 
          designed for publishers, record labels, and rights administrators of all sizes.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bank-level security with end-to-end encryption, audit trails, and SOC 2 compliance
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
                Lightning-fast royalty calculations, instant reporting, and automated workflows
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
                Separate client portals with granular access controls and customization options
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Key Statistics & Capabilities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">1M+</div>
              <div className="text-sm text-muted-foreground">Works Managed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">$10B+</div>
              <div className="text-sm text-muted-foreground">Royalties Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Data Sources</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
          </div>
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                    <CardDescription className="mt-1">{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {module.features.slice(0, 4).map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {module.features.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{module.features.length - 4} more
                    </Badge>
                  )}
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
          Comprehensive documentation for each module in the ENCORE system, including features, 
          capabilities, and integration points.
        </p>
      </div>

      {modules.map((module) => (
        <Card key={module.id} className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <module.icon className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{module.title}</CardTitle>
                </div>
                <CardDescription className="text-base mt-1">{module.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Core Features */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Core Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {module.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Capabilities */}
            {module.capabilities && (
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Detailed Capabilities
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {Object.entries(module.capabilities).map(([category, items]) => (
                    <div key={category} className="bg-muted/30 rounded-lg p-4">
                      <h5 className="font-medium text-base mb-3 capitalize">{category}</h5>
                      <ul className="space-y-2">
                        {items.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View API Docs
              </Button>
              <Button variant="outline" size="sm">
                <PlayCircle className="h-4 w-4 mr-2" />
                Watch Tutorial
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (module.id === "royalties") {
                    setRoyaltiesGuideOpen(true);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Royalties User Guide Dialog */}
      <RoyaltiesUserGuideDialog 
        open={royaltiesGuideOpen} 
        onOpenChange={setRoyaltiesGuideOpen} 
      />
    </div>
  );

  const renderGettingStarted = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Everything you need to know to start using ENCORE effectively, from initial setup 
          to advanced workflows.
        </p>
      </div>

      {/* Quick Start Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Start Guides
          </CardTitle>
          <CardDescription>Step-by-step guides to get you up and running quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quickStartGuides.map((guide, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold">{guide.title}</h4>
                  <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{guide.description}</p>
                <div className="text-xs text-muted-foreground mb-3">{guide.duration}</div>
                
                {/* Steps Preview */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Steps Preview:</div>
                  {guide.steps.slice(0, 3).map((step, stepIndex) => (
                    <div key={stepIndex} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-medium">
                        {stepIndex + 1}
                      </div>
                      {step}
                    </div>
                  ))}
                  {guide.steps.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{guide.steps.length - 3} more steps...
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Read Full Guide
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5 transform rotate-90" />
            End-to-End Workflows
          </CardTitle>
          <CardDescription>Complete workflows for common business processes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {workflowGuides.map((workflow, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{workflow.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {workflow.steps.slice(0, 9).map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {stepIndex + 1}
                      </div>
                      <span className="text-xs">{step}</span>
                    </div>
                  ))}
                </div>
                
                {workflow.steps.length > 9 && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    +{workflow.steps.length - 9} additional steps in full workflow...
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Requirements & Compatibility
          </CardTitle>
          <CardDescription>Technical requirements and supported integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Supported Browsers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Chrome 90+ (Recommended)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Firefox 88+
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Safari 14+
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Edge 90+
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">File Format Support</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Audio:</span>
                  <span className="text-muted-foreground ml-2">MP3, WAV, FLAC, AAC, M4A</span>
                </div>
                <div>
                  <span className="font-medium">Documents:</span>
                  <span className="text-muted-foreground ml-2">PDF, DOC, DOCX, XLS, XLSX</span>
                </div>
                <div>
                  <span className="font-medium">Royalty Data:</span>
                  <span className="text-muted-foreground ml-2">CSV, XLS, XLSX, XML, JSON</span>
                </div>
                <div>
                  <span className="font-medium">Industry Standards:</span>
                  <span className="text-muted-foreground ml-2">CWR 3.0, DDEX, ISRC, ISWC</span>
                </div>
              </div>
            </div>
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
          Comprehensive training resources including video tutorials, live sessions, and certification programs.
        </p>
      </div>

      {/* Video Tutorials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Video Tutorial Library
          </CardTitle>
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
                <p className="text-sm text-muted-foreground mb-3">{video.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {video.duration}
                  </span>
                  <PlayCircle className="h-5 w-5 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Training & Certification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Live Training Sessions
            </CardTitle>
            <CardDescription>Join our weekly live training sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Weekly Schedule</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>New User Onboarding</span>
                  <Badge variant="outline">Tuesdays 2PM EST</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Advanced Features</span>
                  <Badge variant="outline">Thursdays 11AM EST</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Q&A Sessions</span>
                  <Badge variant="outline">Fridays 3PM EST</Badge>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Upcoming Sessions</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Copyright Management Deep Dive</li>
                <li>• Royalty Processing Best Practices</li>
                <li>• Contract Template Customization</li>
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
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Certification Program
            </CardTitle>
            <CardDescription>Become an ENCORE certified administrator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Certification Levels</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Level 1</Badge>
                  <span className="text-sm">Basic User Certification</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Level 2</Badge>
                  <span className="text-sm">Advanced Administrator</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Level 3</Badge>
                  <span className="text-sm">System Specialist</span>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Benefits</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Priority technical support</li>
                <li>• Access to beta features</li>
                <li>• Professional recognition</li>
                <li>• Continuing education credits</li>
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
          API documentation, integration guides, and technical specifications for developers and system administrators.
        </p>
      </div>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            API Documentation
          </CardTitle>
          <CardDescription>RESTful API for system integration and automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Available Endpoints</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded">/api/v1/copyrights</code>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">POST</Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded">/api/v1/royalties/allocate</code>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">PUT</Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded">/api/v1/contracts/[id]</code>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded">/api/v1/sync-licenses</code>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Authentication</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• OAuth 2.0 Bearer tokens</li>
                <li>• API key authentication</li>
                <li>• Rate limiting: 1000 req/hour</li>
                <li>• HTTPS only encryption</li>
              </ul>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Complete API Documentation
          </Button>
        </CardContent>
      </Card>

      {/* Integration Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Integrations
          </CardTitle>
          <CardDescription>Connect ENCORE with your existing business systems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Music Platforms</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Spotify for Artists API</li>
                <li>• Apple Music Partner</li>
                <li>• YouTube Content ID</li>
                <li>• SoundCloud Premier</li>
                <li>• Deezer Pro</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">PROs & Societies</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• ASCAP Data Exchange</li>
                <li>• BMI Repertoire API</li>
                <li>• SOCAN WebServices</li>
                <li>• SESAC Repertory</li>
                <li>• PRS for Music API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Business Systems</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• QuickBooks Integration</li>
                <li>• DocuSign eSignature</li>
                <li>• Salesforce CRM</li>
                <li>• Slack Notifications</li>
                <li>• Zapier Workflows</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Import/Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Data Migration & Import/Export
          </CardTitle>
          <CardDescription>Migrate existing data and set up automated data flows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                Copyright Data
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• CWR (Common Works Registration) format</li>
                <li>• DDEX standard compliance</li>
                <li>• CSV templates for bulk import</li>
                <li>• Metadata validation and cleanup</li>
                <li>• Duplicate detection algorithms</li>
              </ul>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Royalty Statements
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Standard DSP statement formats</li>
                <li>• PRO royalty report parsing</li>
                <li>• Custom field mapping tools</li>
                <li>• Automated processing rules</li>
                <li>• Error handling and validation</li>
              </ul>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contract Migration
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• AI-powered PDF text extraction</li>
                <li>• Template conversion tools</li>
                <li>• Bulk contract import utilities</li>
                <li>• Metadata standardization</li>
                <li>• Legacy system connectors</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">Migration Services</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Our professional services team provides end-to-end data migration assistance, 
              including data assessment, cleanup, mapping, and validation.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Migration Guide
              </Button>
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Request Migration Consultation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
          <CardDescription>Enterprise-grade security measures and compliance standards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Security Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  End-to-end data encryption (AES-256)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Multi-factor authentication (MFA)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Role-based access control (RBAC)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Comprehensive audit logging
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Regular penetration testing
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Compliance Standards</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  SOC 2 Type II certified
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  GDPR compliant
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  CCPA compliant
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  ISO 27001 aligned
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  HIPAA ready architecture
                </li>
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