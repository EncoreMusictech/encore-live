import { 
  Music, 
  Building2, 
  Scale, 
  TrendingUp, 
  Radio,
  Users,
  Briefcase,
  Headphones
} from "lucide-react";

export interface UserCase {
  id: string;
  title: string;
  description: string;
  icon: any;
  audience: string;
  isPopular?: boolean;
  primaryModules: string[];
  workflows: {
    title: string;
    description: string;
    modules: string[];
  }[];
  benefits: string[];
  testimonial?: {
    quote: string;
    author: string;
    company: string;
  };
  recommendedTier: "Free" | "Pro" | "Enterprise";
}

export const userCases: UserCase[] = [
  {
    id: "indie-creators",
    title: "Indie Creators",
    description: "Songwriters, artists, and producers managing their own catalogs and royalties",
    icon: Music,
    audience: "Independent artists, songwriters, beat makers",
    isPopular: true,
    primaryModules: ["copyright-management", "contract-management"],
    workflows: [
      {
        title: "Track Your Music Rights",
        description: "Register your songs, track splits, and monitor royalty collections from all sources",
        modules: ["copyright-management", "royalties-processing"]
      },
      {
        title: "Manage Publishing Deals",
        description: "Store contracts, track renewal dates, and ensure proper splits are maintained",
        modules: ["contract-management", "copyright-management"]
      },
      {
        title: "Collect & Distribute Royalties",
        description: "Import statements from PROs, DSPs, and sync sources, then track your earnings",
        modules: ["royalties-processing"]
      }
    ],
    benefits: [
      "Never miss royalty collections",
      "Organize all contracts in one place",
      "Track songwriting splits accurately",
      "Professional client statements",
      "Free tier available for getting started"
    ],
    testimonial: {
      quote: "Finally, a system that helps me keep track of all my collaborations and splits without breaking the bank.",
      author: "Sarah Martinez",
      company: "Independent Singer-Songwriter"
    },
    recommendedTier: "Pro"
  },
  {
    id: "music-publishers",
    title: "Music Publishers", 
    description: "Independent to mid-size publishers managing catalogs and artist relationships",
    icon: Building2,
    audience: "Independent publishers, boutique music companies",
    isPopular: true,
    primaryModules: ["royalties-processing", "contract-management", "copyright-management"],
    workflows: [
      {
        title: "Catalog Management & Registration",
        description: "Centralize all catalog metadata, register works with PROs, and maintain accurate splits",
        modules: ["copyright-management", "contract-management"]
      },
      {
        title: "Royalty Processing & Statements",
        description: "Import royalty statements, allocate to rightsholders, and generate professional client statements",
        modules: ["royalties-processing"]
      },
      {
        title: "Artist & Writer Management",
        description: "Manage contracts and maintain transparent relationships with artists and writers",
        modules: ["contract-management"]
      }
    ],
    benefits: [
      "Streamlined royalty processing",
      "Professional client reporting",
      "Centralized contract management",
      "Transparent artist relationships",
      "Scalable workflow automation"
    ],
    testimonial: {
      quote: "This platform has transformed how we manage our catalog and communicate with our songwriters. Everything is transparent and professional.",
      author: "Mike Johnson",
      company: "Riverside Music Publishing"
    },
    recommendedTier: "Pro"
  },
  {
    id: "entertainment-attorneys",
    title: "Entertainment Attorneys",
    description: "Legal professionals handling music deals, contracts, and rights clearance",
    icon: Scale,
    audience: "Music lawyers, entertainment attorneys, legal firms",
    primaryModules: ["contract-management", "sync-licensing", "catalog-valuation"],
    workflows: [
      {
        title: "Contract Review & Management",
        description: "Organize client contracts, track deadlines, and maintain template libraries",
        modules: ["contract-management"]
      },
      {
        title: "Rights Clearance & Sync Deals",
        description: "Manage sync licensing requests, clear rights, and track deal progress",
        modules: ["sync-licensing", "contract-management"]
      },
      {
        title: "Catalog Valuation for Transactions",
        description: "Provide professional valuations for acquisitions, divorces, and estate planning",
        modules: ["catalog-valuation"]
      }
    ],
    benefits: [
      "Centralized client contract storage",
      "Automated deadline tracking",
      "Professional valuation reports",
      "Sync deal pipeline management",
      "Template library for efficiency"
    ],
    recommendedTier: "Pro"
  },
  {
    id: "catalog-investors",
    title: "Catalog Investors",
    description: "Funds, investors, and companies buying and selling music catalogs",
    icon: TrendingUp,
    audience: "Investment funds, catalog buyers/sellers, A&R executives",
    isPopular: true,
    primaryModules: ["catalog-valuation", "contract-management"],
    workflows: [
      {
        title: "Due Diligence & Valuation",
        description: "Analyze catalog performance, forecast revenues, and simulate deal structures",
        modules: ["catalog-valuation"]
      },
      {
        title: "Deal Structuring & Modeling",
        description: "Model different acquisition structures and predict ROI scenarios",
        modules: ["catalog-valuation"]
      },
      {
        title: "Portfolio Management",
        description: "Track performance of acquired catalogs and manage ongoing contracts",
        modules: ["contract-management"]
      }
    ],
    benefits: [
      "Professional catalog valuations",
      "Advanced deal modeling tools",
      "ROI forecasting & scenario analysis",
      "Due diligence support",
      "Investor-grade reporting"
    ],
    recommendedTier: "Enterprise"
  },
  {
    id: "music-distributors",
    title: "Music Distributors",
    description: "Labels and distributors managing artist catalogs and royalty distributions",
    icon: Radio,
    audience: "Independent labels, distribution companies, aggregators",
    primaryModules: ["royalties-processing", "catalog-valuation", "contract-management", "copyright-management"],
    workflows: [
      {
        title: "Artist Onboarding & Catalog Setup",
        description: "Register new releases, set up splits, and create artist agreements",
        modules: ["copyright-management", "contract-management"]
      },
      {
        title: "Royalty Collection & Distribution",
        description: "Import DSP statements, allocate to artists, and generate transparent reports",
        modules: ["royalties-processing"]
      },
      {
        title: "Catalog Performance & Valuation",
        description: "Analyze catalog performance, track asset values, and make data-driven A&R decisions",
        modules: ["catalog-valuation"]
      }
    ],
    benefits: [
      "Automated royalty processing",
      "Data-driven catalog insights",
      "Efficient catalog management",
      "Professional valuation reports",
      "Scalable for growing rosters"
    ],
    recommendedTier: "Enterprise"
  },
  {
    id: "management-companies",
    title: "Management Companies",
    description: "Artist managers and management companies overseeing multiple artists",
    icon: Briefcase,
    audience: "Artist managers, management companies, booking agents",
    primaryModules: ["client-portal", "sync-licensing", "contract-management", "royalties-processing"],
    workflows: [
      {
        title: "Multi-Artist Portfolio Management",
        description: "Oversee contracts, royalties, and opportunities across your entire roster",
        modules: ["client-portal", "contract-management", "royalties-processing"]
      },
      {
        title: "Sync Opportunity Management",
        description: "Track sync pitches, manage clearances, and pursue placement opportunities",
        modules: ["sync-licensing"]
      },
      {
        title: "Financial Oversight & Reporting",
        description: "Monitor artist earnings, track contract performance, and manage commissions",
        modules: ["royalties-processing", "client-portal"]
      }
    ],
    benefits: [
      "Centralized artist oversight",
      "Sync opportunity tracking",
      "Commission management",
      "Professional artist reporting",
      "Contract deadline monitoring"
    ],
    recommendedTier: "Pro"
  }
];

// Helper function to get modules by user case
export const getModulesForUserCase = (userCaseId: string) => {
  const userCase = userCases.find(uc => uc.id === userCaseId);
  return userCase?.primaryModules || [];
};

// Helper function to get recommended user cases for a module
export const getUserCasesForModule = (moduleId: string) => {
  return userCases.filter(uc => uc.primaryModules.includes(moduleId));
};