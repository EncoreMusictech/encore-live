export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
}

export const pageMetadata: Record<string, PageMetadata> = {
  home: {
    title: "ENCORE Music Tech Solutions",
    description: "Professional music rights management software for publishers, labels, and creators. Manage copyrights, contracts, royalties, sync licensing, and catalog valuation in one platform.",
    keywords: ["music rights management", "music publishing software", "royalty management", "copyright management", "sync licensing", "catalog valuation", "music contracts"],
    canonical: "/"
  },
  modules: {
    title: "My Modules - Encore Music Tech Solutions",
    description: "Access your subscribed music industry modules including copyright management, contract management, royalty processing, sync licensing, and catalog valuation tools.",
    keywords: ["music modules", "music industry tools", "copyright management", "contract management", "royalty processing"],
    canonical: "/modules"
  },
  pricing: {
    title: "Pricing - Encore Music Tech Solutions",
    description: "Flexible pricing plans for music industry professionals. Choose individual modules or bundled packages with significant savings. Plans for indie creators to enterprise publishers.",
    keywords: ["music software pricing", "royalty management pricing", "music publishing software cost", "copyright management pricing"],
    canonical: "/pricing"
  },
  auth: {
    title: "Sign In - Encore Music Tech Solutions",
    description: "Sign in to your Encore Music account to manage your music rights, contracts, royalties, and sync licensing. Free demo account available.",
    keywords: ["music software login", "encore music login", "music rights management login"],
    canonical: "/auth"
  },
  catalogValuation: {
    title: "Catalog Valuation - AI-Powered Music IP Valuation | Encore Music",
    description: "Professional music catalog valuation using AI-powered analysis, DCF modeling, and real streaming data. Get accurate valuations for music IP assets and investment decisions.",
    keywords: ["music catalog valuation", "music IP valuation", "song valuation", "music asset valuation", "DCF modeling music"],
    canonical: "/catalog-valuation"
  },
  dealSimulator: {
    title: "Deal Simulator - Music Acquisition Analysis | Encore Music",
    description: "Advanced deal simulation and modeling tools for music acquisitions. Analyze ROI, payback periods, and scenario comparisons for music catalog purchases.",
    keywords: ["music deal simulator", "music acquisition analysis", "music investment modeling", "catalog deal analysis"],
    canonical: "/deal-simulator"
  },
  contractManagement: {
    title: "Contract Management - Music Industry Agreements | Encore Music",
    description: "Comprehensive contract management for music industry professionals. Create, store, and track publishing, artist, producer, sync, and distribution agreements.",
    keywords: ["music contract management", "music publishing contracts", "artist agreements", "producer contracts", "sync agreements"],
    canonical: "/contract-management"
  },
  copyrightManagement: {
    title: "Copyright Management - Music Rights Registration | Encore Music",
    description: "Professional copyright management and work registration system. Track writers, publishers, and rights with automated PRO submissions and CWR file generation.",
    keywords: ["music copyright management", "song registration", "music rights tracking", "PRO submissions", "CWR files"],
    canonical: "/copyright-management"
  },
  syncLicensing: {
    title: "Sync Licensing - Music Synchronization Management | Encore Music",
    description: "Complete sync licensing workflow management. Track pitches, manage licenses, handle approvals, and generate deal memos for TV, film, and advertising placements.",
    keywords: ["sync licensing management", "music synchronization", "sync deals", "music placement tracking", "sync licensing software"],
    canonical: "/sync-licensing"
  },
  reconciliation: {
    title: "Royalty Reconciliation - Statement Processing | Encore Music",
    description: "Advanced royalty reconciliation and statement processing. Import from multiple sources, match to your catalog, and prepare accurate allocations.",
    keywords: ["royalty reconciliation", "music statement processing", "royalty allocation", "music accounting"],
    canonical: "/reconciliation"
  },
  royalties: {
    title: "Royalty Management - Music Revenue Allocation | Encore Music",
    description: "Comprehensive royalty management system for music publishers and administrators. Handle complex splits, recoupment, and multi-source revenue streams.",
    keywords: ["royalty management", "music royalty software", "publisher accounting", "royalty splits", "music revenue management"],
    canonical: "/royalties"
  },
  payouts: {
    title: "Payouts & Client Accounting - Music Revenue Distribution | Encore Music",
    description: "Streamlined payout management and client accounting for music publishers. Generate statements, process payments, and manage client relationships.",
    keywords: ["music payouts", "client accounting", "publisher statements", "royalty payments", "music revenue distribution"],
    canonical: "/payouts"
  },
  clientPortal: {
    title: "Client Portal - Artist & Manager Dashboard | Encore Music",
    description: "Secure client portal for artists and managers to view statements, track performance, access contracts, and monitor sync licensing opportunities.",
    keywords: ["music client portal", "artist dashboard", "manager portal", "music statements online"],
    canonical: "/client-portal"
  }
};

export const updatePageMetadata = (pageKey: string | { title: string; description: string; keywords?: string }) => {
  let metadata: PageMetadata;
  
  if (typeof pageKey === 'string') {
    metadata = pageMetadata[pageKey];
    if (!metadata) return;
  } else {
    metadata = {
      title: pageKey.title,
      description: pageKey.description,
      keywords: typeof pageKey.keywords === 'string' ? [pageKey.keywords] : undefined
    };
  }

  // Update title
  document.title = metadata.title;

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', metadata.description);
  }

  // Update meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords && metadata.keywords) {
    metaKeywords.setAttribute('content', metadata.keywords.join(', '));
  }

  // Update Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', metadata.title);
  }

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', metadata.description);
  }

  // Update Twitter Card tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', metadata.title);
  }

  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', metadata.description);
  }

  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (metadata.canonical) {
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}${metadata.canonical}`);
  }
};