import { AgreementType } from "@/components/contracts/PublishingAgreementForm";

export interface DemoPublishingContract {
  id: string;
  title: string;
  description: string;
  agreementType: AgreementType;
  formData: any;
  interestedParties: any[];
  scheduleWorks: any[];
}

export const demoPublishingContracts: DemoPublishingContract[] = [
  {
    id: "demo-admin-agreement",
    title: "Artist Rights Administration - Taylor Swift Demo",
    description: "Comprehensive administration agreement for established artist catalog",
    agreementType: "administration",
    formData: {
      title: "Artist Rights Administration - Taylor Swift Demo",
      counterparty_name: "Swift Music Publishing LLC",
      status: "draft",
      effective_date: new Date("2024-01-01"),
      end_date: new Date("2027-01-01"),
      territory: ["United States", "Canada", "United Kingdom"],
      governing_law: "New York State Law",
      delivery_requirements: ["Metadata", "Work Registration", "Lead Sheets"],
      approvals_required: true,
      approval_conditions: "Sync licenses over $50,000 require approval",
      agreement_type: "administration",
      admin_rights: ["Sync", "Mechanical", "Print", "Digital"],
      admin_fee_percentage: 15,
      admin_controlled_share: 100,
      approval_rights: "pre_approved",
      tail_period_months: 6,
      reversion_conditions: "Automatic reversion upon breach or non-payment"
    },
    interestedParties: [
      {
        id: "1",
        name: "Taylor Swift",
        party_type: "writer",
        controlled_status: "C",
        performance_percentage: 50,
        mechanical_percentage: 50,
        synch_percentage: 50,
        print_percentage: 50,
        ipi_number: "123456789",
        affiliation: "ASCAP",
        email: "taylor@swiftmusic.com"
      },
      {
        id: "2", 
        name: "Encore Music Publishing",
        party_type: "publisher",
        controlled_status: "C",
        performance_percentage: 50,
        mechanical_percentage: 50,
        synch_percentage: 50,
        print_percentage: 50,
        cae_number: "987654321",
        administrator_role: "Full Administration"
      }
    ],
    scheduleWorks: [
      {
        id: "1",
        song_title: "Shake It Off",
        work_id: "W20241201-12345678",
        iswc: "T-034.524.680-1",
        isrc: "USCJY1431401",
        artist_name: "Taylor Swift",
        album_title: "1989"
      },
      {
        id: "2",
        song_title: "Blank Space", 
        work_id: "W20241201-12345679",
        iswc: "T-034.524.681-2",
        isrc: "USCJY1431402",
        artist_name: "Taylor Swift",
        album_title: "1989"
      }
    ]
  },
  {
    id: "demo-copub-agreement",
    title: "Co-Publishing Agreement - Emerging Artist",
    description: "50/50 co-publishing deal with emerging songwriter",
    agreementType: "co_publishing",
    formData: {
      title: "Co-Publishing Agreement - Emerging Artist",
      counterparty_name: "Jordan Smith Music Inc.",
      status: "draft",
      effective_date: new Date("2024-06-01"),
      end_date: new Date("2029-06-01"),
      territory: ["Worldwide"],
      governing_law: "California State Law",
      delivery_requirements: ["Metadata", "Sound File", "Lyrics"],
      approvals_required: false,
      approval_conditions: "",
      agreement_type: "co_publishing",
      publisher_share_percentage: 50,
      writer_share_percentage: 50,
      sync_revenue_split: 50,
      print_revenue_split: 50,
      mechanical_revenue_split: 50,
      advance_amount: 25000,
      recoupable: true,
      exclusivity: false,
      delivery_commitment: 12,
      option_periods: true
    },
    interestedParties: [
      {
        id: "1",
        name: "Jordan Smith",
        party_type: "writer",
        controlled_status: "C",
        performance_percentage: 100,
        mechanical_percentage: 100,
        synch_percentage: 100,
        print_percentage: 100,
        ipi_number: "234567890",
        affiliation: "BMI",
        email: "jordan@jordansmithmusic.com"
      },
      {
        id: "2",
        name: "Encore Music Publishing",
        party_type: "publisher", 
        controlled_status: "C",
        performance_percentage: 50,
        mechanical_percentage: 50,
        synch_percentage: 50,
        print_percentage: 50,
        cae_number: "876543210",
        co_publisher: "Jordan Smith Music Inc."
      }
    ],
    scheduleWorks: [
      {
        id: "1",
        song_title: "Breaking Through",
        work_id: "W20241201-23456789",
        artist_name: "Jordan Smith",
        album_title: "First Light"
      },
      {
        id: "2",
        song_title: "City Dreams",
        work_id: "W20241201-23456790", 
        artist_name: "Jordan Smith",
        album_title: "First Light"
      }
    ]
  },
  {
    id: "demo-exclusive-agreement",
    title: "Exclusive Songwriter Agreement - Nashville Writer",
    description: "Exclusive songwriter deal with established Nashville writer",
    agreementType: "exclusive_songwriter",
    formData: {
      title: "Exclusive Songwriter Agreement - Nashville Writer",
      counterparty_name: "Casey Johnson",
      status: "draft",
      effective_date: new Date("2024-03-01"),
      end_date: new Date("2026-03-01"),
      territory: ["United States", "Canada"],
      governing_law: "Tennessee State Law",
      delivery_requirements: ["Metadata", "Sound File", "Lyrics", "Lead Sheets"],
      approvals_required: true,
      approval_conditions: "Co-writes with major artists require approval",
      agreement_type: "exclusive_songwriter",
      exclusivity_period_start: new Date("2024-03-01"),
      exclusivity_period_end: new Date("2026-03-01"),
      advance_amount: 75000,
      delivery_requirement: 20,
      recoupable: true,
      mechanical_royalty_rate: 75,
      sync_royalty_rate: 50,
      print_royalty_rate: 50,
      renewal_options: true,
      exclusivity: true
    },
    interestedParties: [
      {
        id: "1",
        name: "Casey Johnson",
        party_type: "writer",
        controlled_status: "C",
        performance_percentage: 100,
        mechanical_percentage: 100,
        synch_percentage: 100,
        print_percentage: 100,
        ipi_number: "345678901",
        affiliation: "SESAC",
        email: "casey@nashvillemusic.com"
      },
      {
        id: "2",
        name: "Encore Music Publishing",
        party_type: "publisher",
        controlled_status: "C", 
        performance_percentage: 100,
        mechanical_percentage: 100,
        synch_percentage: 100,
        print_percentage: 100,
        cae_number: "765432109",
        administrator_role: "Exclusive Publisher"
      }
    ],
    scheduleWorks: [
      {
        id: "1",
        song_title: "Highway Home",
        work_id: "W20241201-34567890",
        artist_name: "Casey Johnson",
        album_title: "Southern Stories"
      },
      {
        id: "2", 
        song_title: "Tennessee Rain",
        work_id: "W20241201-34567891",
        artist_name: "Casey Johnson", 
        album_title: "Southern Stories"
      },
      {
        id: "3",
        song_title: "Whiskey and Wishes", 
        work_id: "W20241201-34567892",
        artist_name: "Casey Johnson",
        album_title: "Southern Stories"
      }
    ]
  },
  {
    id: "demo-catalog-agreement",
    title: "Catalog Acquisition - Indie Label Back Catalog",
    description: "Strategic acquisition of established indie label's publishing catalog",
    agreementType: "catalog_acquisition", 
    formData: {
      title: "Catalog Acquisition - Indie Label Back Catalog",
      counterparty_name: "Sunset Records Publishing",
      status: "draft",
      effective_date: new Date("2024-08-01"),
      end_date: undefined,
      territory: ["Worldwide"],
      governing_law: "New York State Law",
      delivery_requirements: ["Metadata", "Work Registration", "Masters"],
      approvals_required: false,
      approval_conditions: "",
      agreement_type: "catalog_acquisition",
      acquisition_price: 500000,
      rights_acquired: "100_percent",
      royalty_override_to_seller: 10,
      acquired_work_list_url: "https://sunsetrecords.com/catalog-list.pdf",
      perpetual_rights: true,
      reversion_clause: "No reversion - perpetual ownership",
      tail_period_months: 0,
      original_publisher_participation: "10% override on future royalties for 5 years"
    },
    interestedParties: [
      {
        id: "1",
        name: "Sunset Records Publishing",
        party_type: "publisher",
        controlled_status: "NC",
        performance_percentage: 0,
        mechanical_percentage: 0,
        synch_percentage: 0,
        print_percentage: 0,
        cae_number: "654321098",
        original_publisher: "Sunset Records Publishing"
      },
      {
        id: "2",
        name: "Encore Music Publishing", 
        party_type: "publisher",
        controlled_status: "C",
        performance_percentage: 100,
        mechanical_percentage: 100,
        synch_percentage: 100,
        print_percentage: 100,
        cae_number: "543210987",
        administrator_role: "Acquiring Publisher"
      }
    ],
    scheduleWorks: [
      {
        id: "1",
        song_title: "Electric Nights",
        work_id: "W20241201-45678901",
        iswc: "T-345.678.901-1",
        isrc: "USRC17607839",
        artist_name: "The Neon Collective",
        album_title: "Digital Dreams"
      },
      {
        id: "2",
        song_title: "Midnight Drive",
        work_id: "W20241201-45678902",
        iswc: "T-345.678.902-2", 
        isrc: "USRC17607840",
        artist_name: "Sarah Chen",
        album_title: "City Lights"
      },
      {
        id: "3",
        song_title: "Ocean View",
        work_id: "W20241201-45678903",
        iswc: "T-345.678.903-3",
        isrc: "USRC17607841", 
        artist_name: "Pacific Coast",
        album_title: "Horizon"
      },
      {
        id: "4",
        song_title: "Golden Hour",
        work_id: "W20241201-45678904",
        iswc: "T-345.678.904-4",
        isrc: "USRC17607842",
        artist_name: "Morning Glory",
        album_title: "Sunrise Sessions"
      }
    ]
  }
];

export const getDemoContract = (contractId: string): DemoPublishingContract | undefined => {
  return demoPublishingContracts.find(contract => contract.id === contractId);
};

export const getDemoContractsByType = (agreementType: AgreementType): DemoPublishingContract[] => {
  return demoPublishingContracts.filter(contract => contract.agreementType === agreementType);
};