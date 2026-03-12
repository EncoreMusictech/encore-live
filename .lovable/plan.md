

# Investment Page for ENCORE

## Overview
Create a dedicated `/invest` route with a polished, scroll-driven investment page that mirrors the deck's narrative: Problem → Solution → Market → Financials → Team → CTA. Uses animated counters, gradient sections, and the existing design system.

## Page Structure (Single Component: `src/pages/InvestPage.tsx`)

### Section 1: Hero
- "ENCORE Rights Management Systems" headline with "Opportunity Deck" subtitle
- Tagline: "Track your rights like you track your hits."
- CTA: "Schedule a Call" (links to Calendly) + "View Product" (links to /features)

### Section 2: The Problem
- 5 pain points from the deck in a grid with icons:
  - Rights scattered across platforms
  - Royalties tracked manually
  - Creators don't know what they're owed
  - Middlemen take 10-20%
  - Old systems can't handle today's music economy
- Bold quote: "Every day, someone, somewhere is getting screwed in the music industry."

### Section 3: Our Solution
- Modular features list: Catalog Valuation, Contract & Copyright Mgmt, Sync Licensing, Royalties Processing, Client Portals
- Key differentiators: No commissions EVER, AI-powered, Unlimited scale, Customizable modules

### Section 4: Market Opportunity
- Three animated counter cards using existing `AnimatedCounter`:
  - $7.8B Global Music Rights Market (2033)
  - $45B Royalty & Rights Management Software (2033)
  - $9.73B Publishing Admin Software (2030)
- Source citation footnote

### Section 5: Competitive Landscape
- Visual comparison table: ENCORE vs Curve, Songtrust, Mogul
- Highlighting ENCORE's modular + no-commission model

### Section 6: Financial Projections
- Year 1 net sales target, growth rate, profit margin stats
- Simple bar/visual for revenue trajectory

### Section 7: The Ask
- "$350K Pre-Seed SAFE" prominent display
- Use of funds breakdown as styled progress bars or pie visual:
  - Consultants 46.2%, IT/Dev 26.2%, Tradeshows 8.7%, Community 7.7%, Content 5.2%, GTM 4.4%, Contingencies 0.8%

### Section 8: Exit Opportunities
- Cards showing acquisition paths: Publishing admin companies, Rights tech platforms, Distributors/SaaS roll-ups, Strategic deals

### Section 9: Team
- 4 team member cards (Janishia Jones CEO, Lawrence Berment CTO, Monet Little Head of CS, Kebu Commissiong VP Sales)
- Advisory board: Hazel Savage, Chris McMurty

### Section 10: Contact CTA
- "Innovation Starts Here" with phone, website, and Schedule Demo button

## Technical Details

### Files to create/modify:
1. **Create** `src/pages/InvestPage.tsx` - Full investment page component
2. **Modify** `src/App.tsx` - Add `/invest` route (public, no auth required)

### Dependencies: Uses existing `AnimatedCounter`, `Card`, `Button`, `Badge` components. Framer Motion for scroll-triggered animations. No new packages needed.

### Design: Dark gradient sections alternating with card-based light sections, consistent with existing brand (electric-lavender, dusty-gold, jet-black tokens). Responsive grid layouts.

