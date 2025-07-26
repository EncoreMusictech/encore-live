// Demo data for different contract types

export interface DemoContractData {
  id: string;
  type: string;
  basicInfo: any;
  terms: any;
  parties: any;
}

// Producer Agreement Demo Data
export const demoProducerData: DemoContractData = {
  id: "producer-demo",
  type: "producer",
  basicInfo: {
    title: "Producer Agreement - Urban Soundscape",
    counterparty_name: "BeatMaker Productions LLC",
    effective_date: new Date("2024-01-15"),
    end_date: new Date("2025-01-15"),
    territory: "worldwide",
    governing_law: "new_york",
    notes: "Standard producer agreement for album production services"
  },
  terms: {
    producer_type: "hybrid",
    track_count: "12",
    upfront_fee: "25000",
    producer_points: "3.5",
    royalty_base: "net_receipts",
    producer_credit: "Produced by BeatMaker Productions",
    credit_size: "equal",
    remix_rights: true,
    sample_clearance: true,
    publishing_share: false,
    exclusive_production: true,
    payment_on_signing: "50",
    payment_on_delivery: "40",
    payment_on_release: "10"
  },
  parties: {
    party1_contact_name: "Marcus Johnson",
    party1_email: "marcus@example.com",
    party1_phone: "+1 (555) 123-4567",
    party1_address: "123 Music Lane, Nashville, TN 37203",
    party1_tax_id: "12-3456789",
    party2_contact_name: "BeatMaker Productions LLC",
    party2_email: "contracts@beatmaker.com",
    party2_phone: "+1 (555) 987-6543",
    party2_address: "456 Producer Blvd, Los Angeles, CA 90210",
    party2_tax_id: "98-7654321"
  }
};

// Sync License Demo Data
export const demoSyncData: DemoContractData = {
  id: "sync-demo",
  type: "sync",
  basicInfo: {
    title: "Sync License - Summer Nights",
    counterparty_name: "Sunset Films Productions",
    effective_date: new Date("2024-02-01"),
    territory: "worldwide",
    governing_law: "california",
    notes: "Synchronization license for feature film use"
  },
  terms: {
    sync_type: "one_time",
    territory: "worldwide",
    license_fee: "15000",
    term_years: "5",
    usage_duration: "2 minutes 30 seconds",
    production_title: "Summer Love Story",
    production_company: "Sunset Films Productions",
    media_usage: ["film", "tv", "web", "social"],
    includes_master: true,
    includes_publishing: true,
    exclusive_usage: false,
    promotional_usage: true,
    reuse_fee: "7500",
    festival_fee: "2500"
  },
  parties: {
    party1_contact_name: "Sarah Chen",
    party1_email: "sarah@musiclabel.com",
    party1_phone: "+1 (555) 234-5678",
    party1_address: "789 Music Row, Nashville, TN 37203",
    party1_tax_id: "45-6789012",
    party2_contact_name: "Sunset Films Productions",
    party2_email: "licensing@sunsetfilms.com",
    party2_phone: "+1 (555) 876-5432",
    party2_address: "321 Hollywood Blvd, Los Angeles, CA 90028",
    party2_tax_id: "65-4321098"
  }
};

// Distribution Agreement Demo Data
export const demoDistributionData: DemoContractData = {
  id: "distribution-demo",
  type: "distribution",
  basicInfo: {
    title: "Distribution Agreement - Global Reach",
    counterparty_name: "WorldWide Music Distribution",
    effective_date: new Date("2024-03-01"),
    end_date: new Date("2027-03-01"),
    territory: "worldwide",
    governing_law: "new_york",
    notes: "Comprehensive distribution deal with label services"
  },
  terms: {
    distribution_type: "label_services",
    territory: "worldwide",
    contract_term: "3",
    release_commitment: "12",
    exclusivity: "exclusive",
    artist_revenue_share: "70",
    label_revenue_share: "30",
    digital_sales_share: "75",
    streaming_share: "70",
    physical_sales_share: "60",
    sync_licensing_share: "50",
    marketing_advance: "50000",
    recording_advance: "75000",
    tour_support: "25000",
    video_budget: "15000",
    cross_collateralization: true,
    marketing_deductible: true,
    video_deductible: true,
    tour_support_deductible: false
  },
  parties: {
    party1_contact_name: "Alex Rivera",
    party1_email: "alex@independentartist.com",
    party1_phone: "+1 (555) 345-6789",
    party1_address: "456 Artist Ave, Brooklyn, NY 11201",
    party1_tax_id: "78-9012345",
    party2_contact_name: "WorldWide Music Distribution",
    party2_email: "deals@worldwidemusic.com",
    party2_phone: "+1 (555) 765-4321",
    party2_address: "123 Distribution Plaza, New York, NY 10001",
    party2_tax_id: "21-0987654"
  }
};

// Publishing Agreement Demo Data
export const demoPublishingData: DemoContractData = {
  id: "publishing-demo",
  type: "publishing",
  basicInfo: {
    title: "Co-Publishing Agreement - Creative Collective",
    counterparty_name: "Harmony Publishing House",
    effective_date: new Date("2024-01-01"),
    end_date: new Date("2026-12-31"),
    territory: "worldwide",
    governing_law: "new_york",
    notes: "50/50 co-publishing deal with administration rights"
  },
  terms: {
    publishing_type: "copub",
    territory: "worldwide",
    duration: "3",
    ownership_percentage: "50",
    pro_affiliation: "ascap",
    writer_share: "100",
    publisher_share: "50",
    mechanical_rate: "9.1",
    performance_rate: "50",
    sync_rate: "50"
  },
  parties: {
    party1_contact_name: "Jordan Blake",
    party1_email: "jordan@songwriter.com",
    party1_phone: "+1 (555) 456-7890",
    party1_address: "789 Songwriter St, Austin, TX 78701",
    party1_tax_id: "34-5678901",
    party2_contact_name: "Harmony Publishing House",
    party2_email: "writers@harmonypub.com",
    party2_phone: "+1 (555) 654-3210",
    party2_address: "987 Publishing Way, Nashville, TN 37203",
    party2_tax_id: "87-6543210"
  }
};

// Getter functions for demo data
export const getDemoContractData = (contractType: string, demoId?: string): DemoContractData | null => {
  const demoMap: Record<string, DemoContractData> = {
    "producer-demo": demoProducerData,
    "sync-demo": demoSyncData,
    "distribution-demo": demoDistributionData,
    "publishing-demo": demoPublishingData,
  };

  if (demoId && demoMap[demoId]) {
    return demoMap[demoId];
  }

  // Fallback to contract type
  const typeMap: Record<string, DemoContractData> = {
    producer: demoProducerData,
    sync: demoSyncData,
    distribution: demoDistributionData,
    publishing: demoPublishingData,
  };

  return typeMap[contractType] || null;
};

// Export all demo data
export const allDemoContracts = [
  demoProducerData,
  demoSyncData,
  demoDistributionData,
  demoPublishingData,
];