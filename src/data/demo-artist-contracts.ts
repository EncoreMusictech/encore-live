import { AgreementType } from "@/components/contracts/PublishingAgreementForm";

export interface DemoArtistContract {
  id: string;
  title: string;
  description: string;
  agreementType: AgreementType;
  formData: any;
  interestedParties: any[];
  scheduleWorks: any[];
}

export const demoArtistContracts: DemoArtistContract[] = [
  {
    id: "indie-artist-demo",
    title: "Indie Artist Recording Agreement - Rising Star",
    description: "Independent artist recording deal with modest advance and favorable terms",
    agreementType: "artist",
    formData: {
      dealType: "recording",
      territory: "worldwide",
      numberOfAlbums: 2,
      contractTerm: 3,
      optionPeriods: 1,
      recordingAdvance: 25000,
      marketingAdvance: 15000,
      artistRoyaltyRate: 18,
      netReceiptsPercentage: 50,
      producerRoyalty: 3,
      merchandiseRevenue: true,
      syncRevenue: true,
      livePerformanceRevenue: false,
      publishingRevenue: false
    },
    interestedParties: [
      {
        id: "artist-1",
        name: "Alex Rivera",
        partyType: "artist",
        controlledStatus: "C",
        performancePercentage: 85,
        mechanicalPercentage: 85,
        syncPercentage: 85,
        email: "alex.rivera@email.com",
        phone: "(555) 123-4567",
        address: "123 Music Lane, Nashville, TN 37203"
      },
      {
        id: "label-1", 
        name: "Indie Sound Records",
        partyType: "label",
        controlledStatus: "NC",
        performancePercentage: 15,
        mechanicalPercentage: 15,
        syncPercentage: 15,
        email: "contracts@indiesound.com",
        phone: "(555) 987-6543",
        address: "456 Record Row, Los Angeles, CA 90028"
      }
    ],
    scheduleWorks: [
      {
        id: "work-1",
        songTitle: "Midnight Dreams",
        artistName: "Alex Rivera",
        albumTitle: "First Light",
        workId: "W202401001",
        inheritsRoyaltySplits: true,
        inheritsControlledStatus: true,
        inheritsRecoupmentStatus: true
      },
      {
        id: "work-2",
        songTitle: "City Lights",
        artistName: "Alex Rivera", 
        albumTitle: "First Light",
        workId: "W202401002",
        inheritsRoyaltySplits: true,
        inheritsControlledStatus: true,
        inheritsRecoupmentStatus: true
      }
    ]
  },
  {
    id: "360-deal-demo",
    title: "360 Deal Agreement - Major Label Artist",
    description: "Comprehensive 360 deal including recording, touring, merchandise, and publishing",
    agreementType: "artist",
    formData: {
      dealType: "360",
      territory: "worldwide",
      numberOfAlbums: 4,
      contractTerm: 5,
      optionPeriods: 2,
      recordingAdvance: 250000,
      marketingAdvance: 150000,
      artistRoyaltyRate: 15,
      netReceiptsPercentage: 65,
      producerRoyalty: 4,
      merchandiseRevenue: true,
      syncRevenue: true,
      livePerformanceRevenue: true,
      publishingRevenue: true
    },
    interestedParties: [
      {
        id: "artist-2",
        name: "Taylor Morgan",
        partyType: "artist",
        controlledStatus: "C",
        performancePercentage: 65,
        mechanicalPercentage: 65,
        syncPercentage: 65,
        email: "taylor.morgan@email.com",
        phone: "(555) 234-5678",
        address: "789 Star Avenue, Beverly Hills, CA 90210"
      },
      {
        id: "label-2",
        name: "Global Music Entertainment",
        partyType: "label",
        controlledStatus: "NC", 
        performancePercentage: 35,
        mechanicalPercentage: 35,
        syncPercentage: 35,
        email: "artist.relations@globalmusic.com",
        phone: "(555) 876-5432",
        address: "1000 Music Plaza, New York, NY 10019"
      }
    ],
    scheduleWorks: [
      {
        id: "work-3",
        songTitle: "Break the Chains",
        artistName: "Taylor Morgan",
        albumTitle: "Revolution",
        workId: "W202401003",
        inheritsRoyaltySplits: true,
        inheritsControlledStatus: true,
        inheritsRecoupmentStatus: true
      },
      {
        id: "work-4",
        songTitle: "Electric Soul",
        artistName: "Taylor Morgan",
        albumTitle: "Revolution", 
        workId: "W202401004",
        inheritsRoyaltySplits: true,
        inheritsControlledStatus: true,
        inheritsRecoupmentStatus: true
      },
      {
        id: "work-5",
        songTitle: "Neon Nights",
        artistName: "Taylor Morgan",
        albumTitle: "Revolution",
        workId: "W202401005",
        inheritsRoyaltySplits: true,
        inheritsControlledStatus: true,
        inheritsRecoupmentStatus: true
      }
    ]
  },
  {
    id: "distribution-demo",
    title: "Distribution Deal with Advances - Electronic Producer",
    description: "Distribution agreement with marketing support and recoupable advances",
    agreementType: "distribution",
    formData: {
      distributionType: "exclusive",
      territory: "north_america",
      contractTerm: 2,
      exclusivity: "exclusive",
      distributorShare: 20,
      artistShare: 80,
      minimumAdvance: 50000,
      marketingCommitment: 30000,
      digitalDeductible: true,
      physicalDeductible: true,
      syncDeductible: false
    },
    interestedParties: [
      {
        id: "artist-3",
        name: "DJ Phoenix",
        partyType: "artist",
        controlledStatus: "C",
        performancePercentage: 80,
        mechanicalPercentage: 80,
        syncPercentage: 90,
        email: "djphoenix@email.com",
        phone: "(555) 345-6789", 
        address: "321 Beat Street, Miami, FL 33139"
      },
      {
        id: "distributor-1",
        name: "Digital Wave Distribution",
        partyType: "distributor",
        controlledStatus: "NC",
        performancePercentage: 20,
        mechanicalPercentage: 20,
        syncPercentage: 10,
        email: "partnerships@digitalwave.com",
        phone: "(555) 765-4321",
        address: "555 Digital Drive, San Francisco, CA 94107"
      }
    ],
    scheduleWorks: [
      {
        id: "work-6",
        songTitle: "Pulse Wave",
        artistName: "DJ Phoenix",
        albumTitle: "Frequency",
        workId: "W202401006",
        inheritsRoyaltySplits: true,
        inheritsControlledStatus: true,
        inheritsRecoupmentStatus: true
      },
      {
        id: "work-7",
        songTitle: "Bass Drop",
        artistName: "DJ Phoenix",
        albumTitle: "Frequency",
        workId: "W202401007", 
        inheritsRoyaltySplits: true,
        inheritsControlledStatus: true,
        inheritsRecoupmentStatus: true
      }
    ]
  }
];

export const getDemoArtistContract = (contractId: string): DemoArtistContract | undefined => {
  return demoArtistContracts.find(contract => contract.id === contractId);
};

export const getDemoArtistContractsByType = (agreementType: AgreementType): DemoArtistContract[] => {
  return demoArtistContracts.filter(contract => contract.agreementType === agreementType);
};