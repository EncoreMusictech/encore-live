
import { QuarterlyBalanceReport } from "@/hooks/useQuarterlyBalanceReports";

const currentYear = new Date().getFullYear();
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

export const demoQuarterlyBalanceReports: QuarterlyBalanceReport[] = [
  // Current Quarter - Taylor Swift
  {
    id: "demo-qbr-1",
    user_id: "demo-user",
    payee_id: "payee-taylor-swift",
    contact_id: "contact-taylor-swift",
    agreement_id: "demo-admin-agreement",
    year: currentYear,
    quarter: currentQuarter,
    period_label: `${currentYear} Q${currentQuarter}`,
    opening_balance: 125000.00,
    royalties_amount: 89500.00,
    expenses_amount: 12000.00,
    payments_amount: 75000.00,
    closing_balance: 127500.00,
    is_calculated: true,
    calculation_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contacts: {
      name: "Taylor Swift Publishing",
      email: "taylor@swiftmusic.com"
    },
    contracts: {
      title: "Artist Rights Administration - Taylor Swift Demo",
      agreement_id: "demo-admin-agreement"
    }
  },
  
  // Previous Quarter - Taylor Swift
  {
    id: "demo-qbr-2",
    user_id: "demo-user",
    payee_id: "payee-taylor-swift",
    contact_id: "contact-taylor-swift",
    agreement_id: "demo-admin-agreement",
    year: currentQuarter === 1 ? currentYear - 1 : currentYear,
    quarter: currentQuarter === 1 ? 4 : currentQuarter - 1,
    period_label: `${currentQuarter === 1 ? currentYear - 1 : currentYear} Q${currentQuarter === 1 ? 4 : currentQuarter - 1}`,
    opening_balance: 98000.00,
    royalties_amount: 78500.00,
    expenses_amount: 8500.00,
    payments_amount: 63000.00,
    closing_balance: 105000.00,
    is_calculated: true,
    calculation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    contacts: {
      name: "Taylor Swift Publishing",
      email: "taylor@swiftmusic.com"
    },
    contracts: {
      title: "Artist Rights Administration - Taylor Swift Demo",
      agreement_id: "demo-admin-agreement"
    }
  },

  // Q2 Previous Year - Taylor Swift
  {
    id: "demo-qbr-2b",
    user_id: "demo-user",
    payee_id: "payee-taylor-swift",
    contact_id: "contact-taylor-swift",
    agreement_id: "demo-admin-agreement",
    year: currentQuarter <= 2 ? currentYear - 1 : currentYear,
    quarter: currentQuarter <= 2 ? currentQuarter + 2 : currentQuarter - 2,
    period_label: `${currentQuarter <= 2 ? currentYear - 1 : currentYear} Q${currentQuarter <= 2 ? currentQuarter + 2 : currentQuarter - 2}`,
    opening_balance: 72000.00,
    royalties_amount: 95500.00,
    expenses_amount: 11200.00,
    payments_amount: 58000.00,
    closing_balance: 98300.00,
    is_calculated: true,
    calculation_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    contacts: {
      name: "Taylor Swift Publishing",
      email: "taylor@swiftmusic.com"
    },
    contracts: {
      title: "Artist Rights Administration - Taylor Swift Demo",
      agreement_id: "demo-admin-agreement"
    }
  },

  // Current Quarter - The Weeknd
  {
    id: "demo-qbr-3",
    user_id: "demo-user",
    payee_id: "payee-the-weeknd",
    contact_id: "contact-the-weeknd",
    agreement_id: "demo-co-pub-agreement",
    year: currentYear,
    quarter: currentQuarter,
    period_label: `${currentYear} Q${currentQuarter}`,
    opening_balance: 45000.00,
    royalties_amount: 32000.00,
    expenses_amount: 5500.00,
    payments_amount: 28000.00,
    closing_balance: 43500.00,
    is_calculated: true,
    calculation_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contacts: {
      name: "The Weeknd Music",
      email: "admin@theweekndmusic.com"
    },
    contracts: {
      title: "Co-Publishing Agreement - The Weeknd",
      agreement_id: "demo-co-pub-agreement"
    }
  },

  // Previous Quarter - The Weeknd
  {
    id: "demo-qbr-4",
    user_id: "demo-user",
    payee_id: "payee-the-weeknd",
    contact_id: "contact-the-weeknd",
    agreement_id: "demo-co-pub-agreement",
    year: currentQuarter === 1 ? currentYear - 1 : currentYear,
    quarter: currentQuarter === 1 ? 4 : currentQuarter - 1,
    period_label: `${currentQuarter === 1 ? currentYear - 1 : currentYear} Q${currentQuarter === 1 ? 4 : currentQuarter - 1}`,
    opening_balance: 38000.00,
    royalties_amount: 25000.00,
    expenses_amount: 4000.00,
    payments_amount: 14000.00,
    closing_balance: 45000.00,
    is_calculated: true,
    calculation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    contacts: {
      name: "The Weeknd Music",
      email: "admin@theweekndmusic.com"
    },
    contracts: {
      title: "Co-Publishing Agreement - The Weeknd",
      agreement_id: "demo-co-pub-agreement"
    }
  },

  // Current Quarter - Dua Lipa
  {
    id: "demo-qbr-5",
    user_id: "demo-user",
    payee_id: "payee-dua-lipa",
    contact_id: "contact-dua-lipa",
    agreement_id: "demo-writer-agreement",
    year: currentYear,
    quarter: currentQuarter,
    period_label: `${currentYear} Q${currentQuarter}`,
    opening_balance: 18000.00,
    royalties_amount: 22000.00,
    expenses_amount: 3200.00,
    payments_amount: 15000.00,
    closing_balance: 21800.00,
    is_calculated: true,
    calculation_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contacts: {
      name: "Dua Lipa Publishing",
      email: "publishing@dualipa.com"
    },
    contracts: {
      title: "Songwriter Agreement - Dua Lipa",
      agreement_id: "demo-writer-agreement"
    }
  },

  // Previous Quarter - Dua Lipa
  {
    id: "demo-qbr-6",
    user_id: "demo-user",
    payee_id: "payee-dua-lipa",
    contact_id: "contact-dua-lipa",
    agreement_id: "demo-writer-agreement",
    year: currentQuarter === 1 ? currentYear - 1 : currentYear,
    quarter: currentQuarter === 1 ? 4 : currentQuarter - 1,
    period_label: `${currentQuarter === 1 ? currentYear - 1 : currentYear} Q${currentQuarter === 1 ? 4 : currentQuarter - 1}`,
    opening_balance: 15000.00,
    royalties_amount: 18500.00,
    expenses_amount: 2500.00,
    payments_amount: 13000.00,
    closing_balance: 18000.00,
    is_calculated: true,
    calculation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    contacts: {
      name: "Dua Lipa Publishing",
      email: "publishing@dualipa.com"
    },
    contracts: {
      title: "Songwriter Agreement - Dua Lipa",
      agreement_id: "demo-writer-agreement"
    }
  },

  // Negative Balance Example - Independent Artist
  {
    id: "demo-qbr-7",
    user_id: "demo-user",
    payee_id: "payee-indie-artist",
    contact_id: "contact-indie-artist",
    agreement_id: "demo-development-agreement",
    year: currentYear,
    quarter: currentQuarter,
    period_label: `${currentYear} Q${currentQuarter}`,
    opening_balance: -2500.00,
    royalties_amount: 1800.00,
    expenses_amount: 800.00,
    payments_amount: 0.00,
    closing_balance: -1500.00,
    is_calculated: true,
    calculation_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contacts: {
      name: "Indie Artist Music",
      email: "contact@indieartist.com"
    },
    contracts: {
      title: "Development Deal - Indie Artist",
      agreement_id: "demo-development-agreement"
    }
  },

  // Low Balance Example - Emerging Writer
  {
    id: "demo-qbr-8",
    user_id: "demo-user",
    payee_id: "payee-emerging-writer",
    contact_id: "contact-emerging-writer",
    agreement_id: "demo-writer-single-song",
    year: currentYear,
    quarter: currentQuarter,
    period_label: `${currentYear} Q${currentQuarter}`,
    opening_balance: 250.00,
    royalties_amount: 480.00,
    expenses_amount: 50.00,
    payments_amount: 0.00,
    closing_balance: 680.00,
    is_calculated: true,
    calculation_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contacts: {
      name: "Emerging Writer",
      email: "writer@emerging.com"
    },
    contracts: {
      title: "Single Song Agreement - Emerging Writer",
      agreement_id: "demo-writer-single-song"
    }
  }
];

export function getDemoQuarterlyBalanceReports(): QuarterlyBalanceReport[] {
  return demoQuarterlyBalanceReports;
}
