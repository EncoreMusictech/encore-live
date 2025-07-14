import { 
  TrendingUp, 
  FileText, 
  Copyright, 
  Film, 
  DollarSign, 
  Users 
} from "lucide-react";

export const modules = [
  {
    id: "catalog-valuation",
    title: "Catalog Valuation",
    description: "AI-powered catalog assessment with 3-5 year forecasting and fair market value analysis",
    icon: TrendingUp,
    tier: "Pro" as const,
    isPopular: true,
    features: [
      "Revenue history analysis",
      "Growth modeling (CAGR)",
      "Scenario-based estimates",
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
    id: "royalties-processing",
    title: "Royalties Processing",
    description: "Automated royalty statement processing with split calculations and reporting",
    icon: DollarSign,
    tier: "Enterprise" as const,
    features: [
      "CSV/PDF statement upload",
      "Auto-assign to tracks",
      "Split calculations",
      "Recoupment tracking",
      "Contributor statements"
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