import { 
  TrendingUp, 
  FileText, 
  Copyright, 
  Film, 
  DollarSign, 
  Users,
  Archive,
  Music,
  CreditCard
} from "lucide-react";

export const modules = [
  {
    id: "royalties-processing",
    title: "Royalties Processing",
    description: "Complete royalty management system from reconciliation to payouts",
    icon: DollarSign,
    tier: "Pro" as const,
    isPopular: true,
    subModules: [
      {
        id: "reconciliation",
        title: "Reconciliation - Batches",
        description: "Track incoming royalty payments from DSPs, PROs, YouTube, and other sources",
        icon: Archive,
        path: "/reconciliation"
      },
      {
        id: "royalties",
        title: "Royalties Allocation",
        description: "Map works and their rightsholders to reconciled revenue with automated calculations",
        icon: Music,
        path: "/royalties"
      },
      {
        id: "payouts",
        title: "Payouts & Client Accounting", 
        description: "Handle periodic statements and payments for clients with automated calculations",
        icon: CreditCard,
        path: "/payouts"
      }
    ],
    features: [
      "Bulk import royalty statements",
      "Work-to-rightsholder mapping",
      "Automated royalty calculations",
      "Periodic client statements",
      "Payment tracking & history"
    ]
  },
  {
    id: "catalog-valuation",
    title: "Catalog Valuation",
    description: "AI-powered catalog assessment with 3-5 year forecasting and deal simulation tools",
    icon: TrendingUp,
    tier: "Pro" as const,
    isPopular: true,
    subModules: [
      {
        id: "valuation",
        title: "Catalog Valuation",
        description: "AI-powered catalog assessment with 3-5 year forecasting and fair market value analysis",
        icon: TrendingUp,
        path: "/catalog-valuation"
      },
      {
        id: "deal-simulator",
        title: "Deal Simulator",
        description: "Simulate different deal structures and outcomes with advanced modeling",
        icon: TrendingUp,
        path: "/deal-simulator"
      }
    ],
    features: [
      "Revenue history analysis",
      "Growth modeling (CAGR)",
      "Scenario-based estimates",
      "Deal structure simulation",
      "Downloadable investor reports",
      "Comp-based valuation range"
    ]
  },
  {
    id: "contract-management",
    title: "Contract Management",
    description: "Centralized contract storage with smart tagging, alerts, and template library",
    icon: FileText,
    tier: "Free" as const,
    features: [
      "Upload & organize contracts",
      "Auto-tag by deal type",
      "Renewal deadline alerts",
      "Template library access",
      "Smart field extraction"
    ]
  },
  {
    id: "copyright-management",
    title: "Copyright Management",
    description: "Register and track copyrights with split assignments and metadata management",
    icon: Copyright,
    tier: "Free" as const,
    features: [
      "ISRC/ISWC/IPI tracking",
      "Writer/publisher splits",
      "PRO registration status",
      "Duplicate warnings",
      "Metadata form builder"
    ]
  },
  {
    id: "sync-licensing",
    title: "Sync Licensing Tracker",
    description: "Comprehensive sync deal pipeline with pitch tracking and deal memo generation",
    icon: Film,
    tier: "Pro" as const,
    features: [
      "Pitch status tracking",
      "Media type categorization",
      "Territory & term management",
      "Contract attachments",
      "Auto-generated deal memos"
    ]
  },
  {
    id: "client-portal",
    title: "Client Portal",
    description: "Secure tier-based access for artists, managers, and vendors with custom views",
    icon: Users,
    tier: "Pro" as const,
    features: [
      "Artist earnings dashboard",
      "Manager deal oversight",
      "Vendor collaboration",
      "Permission-based content",
      "Custom reporting views"
    ]
  }
];