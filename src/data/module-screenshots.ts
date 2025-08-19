export interface Screenshot {
  image: string;
  caption: string;
}

export const moduleScreenshots: Record<string, Screenshot[]> = {
  "royalties-processing": [
    {
      image: "/lovable-uploads/df93d50a-c213-4852-ba45-07700634740f.png",
      caption: "Complete royalties management dashboard with reconciliation, allocation, and payout modules"
    },
    {
      image: "/lovable-uploads/dc0df084-a407-4ecb-ba14-98ff89d28851.png", 
      caption: "Advanced statement import system with automatic source detection and processing status tracking"
    }
  ],
  "catalog-valuation": [
    {
      image: "/lovable-uploads/25790dd9-ce17-4e16-8c7a-cdc320f3985c.png",
      caption: "Advanced catalog valuation dashboard with DCF modeling, risk adjustment, and comprehensive analytics"
    },
    {
      image: "/lovable-uploads/3fdbaaf3-a629-4a56-b1c8-0edc554d9f7b.png",
      caption: "Detailed discounted cash flow analysis with 5-year projections and present value calculations"
    },
    {
      image: "/lovable-uploads/40512a6b-8881-4f09-bc65-cf98759d37e2.png",
      caption: "Professional valuation forecasts with scenario modeling (Pessimistic, Base Case, Optimistic)"
    }
  ],
  "contract-management": [
    {
      image: "/lovable-uploads/f4301905-51b8-4306-a9aa-59df345eeb10.png",
      caption: "Flexible contract creation options: build from scratch, use templates, or upload existing contracts"
    },
    {
      image: "/lovable-uploads/c6f80b04-ccf2-47b3-ac01-558e77b82c72.png",
      caption: "Comprehensive template library with industry-standard agreements for all deal types"
    },
    {
      image: "/lovable-uploads/a2796f57-7c02-41c6-9c14-4d5fe11bf140.png",
      caption: "Advanced import capabilities with DocuSign integration and intelligent PDF extraction"
    }
  ],
  "copyright-management": [
    {
      image: "/lovable-uploads/a5f76abb-e694-45da-ba43-2c6aed105518.png",
      caption: "Comprehensive copyright catalog with work ID tracking, writer splits, and registration status management"
    },
    {
      image: "/lovable-uploads/5721d322-d79d-43bc-a219-8d605cfe826f.png",
      caption: "Streamlined bulk upload system with CSV/Excel import and downloadable templates for efficient data entry"
    },
    {
      image: "/lovable-uploads/18afcfb2-776d-4595-9d91-c2da988e2bb3.png",
      caption: "Advanced metadata management with ISRC/ISWC tracking, writer agreements, and multi-PRO registration"
    }
  ],
  "sync-licensing": [
    {
      image: "/lovable-uploads/cceb73e7-dbf5-4458-a105-44e022585506.png",
      caption: "Comprehensive sync request creation with project details, media type, source tracking, and sync agent management"
    },
    {
      image: "/lovable-uploads/6cc3f248-6a49-4430-843e-d85eaae4d355.png",
      caption: "Advanced terms management with territory licensing, music usage rights, time codes, and licensing period tracking"
    },
    {
      image: "/lovable-uploads/46335fc7-00f3-45fd-97cb-21f2b426bffd.png",
      caption: "Complete status workflow tracking from inquiry to licensed with payment and invoice status management"
    }
  ],
  "client-portal": [
    {
      image: "/lovable-uploads/8ee2548c-9a96-4c5f-bf7a-fc15e5b87525.png",
      caption: "Client portal interface with royalties, contracts, and works management"
    },
    {
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
      caption: "Manager oversight portal with comprehensive deal and royalty visibility"
    }
  ]
};