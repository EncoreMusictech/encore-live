
# Catalog Audit Marketing Presentation Tool

## Overview

This plan creates an animated, cinematic presentation tool that the ENCORE team can use during client meetings and marketing outreach. The tool will showcase the power of ENCORE's integrated catalog valuation, MLC enrichment, and pipeline analysis tools by delivering a visually impressive "audit reveal" experience.

**Purpose**: Demonstrate immediate value to prospective enterprise clients by showing:
1. How ENCORE discovers their catalog data
2. Where their royalties are leaking (registration gaps)
3. The dollar value of uncollected income
4. How ENCORE's tools solve these problems

---

## User Experience Flow

```text
+------------------+     +------------------+     +------------------+
|  SLIDE 1: INTRO  | --> | SLIDE 2: SEARCH  | --> | SLIDE 3: CATALOG |
|  Animated logo   |     | Artist lookup    |     | Works discovered |
|  "Audit for..."  |     | Real-time pulse  |     | Count-up reveal  |
+------------------+     +------------------+     +------------------+
         |                       |                       |
         v                       v                       v
+------------------+     +------------------+     +------------------+
| SLIDE 4: GAPS    | --> | SLIDE 5: IMPACT  | --> | SLIDE 6: TOOLS   |
| Registration     |     | $ CountUp reveal |     | 3D visualization |
| issues found     |     | Missing royalties|     | ENCORE integrates|
+------------------+     +------------------+     +------------------+
                                 |
                                 v
                  +---------------------------+
                  | SLIDE 7: CTA / PDF EXPORT |
                  | Schedule demo + download  |
                  +---------------------------+
```

---

## Technical Implementation

### Phase 1: Core Presentation Component

**1.1 New File: `src/components/catalog-audit/CatalogAuditPresentation.tsx`**

Main container component with:
- Full-screen presentation mode (like PowerPoint/Keynote)
- Keyboard navigation (arrow keys, spacebar)
- Progress indicator dots
- Auto-advance with pause capability
- Dark gradient background matching ENCORE branding

**1.2 New File: `src/components/catalog-audit/PresentationSlide.tsx`**

Reusable slide wrapper with:
- Entry/exit animations using Tailwind's `animate-fade-in` and `animate-slide-up`
- Staggered child element reveals via `animationDelay`
- Slide number and title overlay

**1.3 New File: `src/components/catalog-audit/AnimatedCounter.tsx`**

Count-up number animation for dramatic reveals:
- Uses `useEffect` + `requestAnimationFrame` for smooth interpolation
- Configurable duration, start value, end value, and format (currency, number, percentage)
- Easing function for natural feel

### Phase 2: Slide Content Components

**2.1 Slide: Introduction**
- ENCORE logo with animated glow (reuse Hero.tsx pattern)
- Client/artist name typed out with typewriter effect
- "Catalog Audit Analysis" title reveal
- Animated musical notes floating in background

**2.2 Slide: Discovery Phase**
- Live Spotify search animation
- MLC database lookup visualization
- PRO cross-reference pulse indicators
- Loading spinner with real-time status messages

**2.3 Slide: Catalog Overview**
- Total songs discovered (AnimatedCounter)
- Albums vs. singles breakdown (animated progress bars)
- Visual genre distribution (animated pie segments)
- Integrate with `SongEstimatorTool` data patterns

**2.4 Slide: Registration Gaps**
- Works with missing ISWC (AnimatedCounter → warning color)
- Works with no PRO registration (AnimatedCounter → danger color)
- Incomplete metadata count
- Visual "gap map" showing where registrations are missing
- Color-coded severity indicators

**2.5 Slide: Financial Impact (The "Big Reveal")**
- Dark background with spotlight effect
- Small text: "Based on our analysis..."
- Large animated currency counter revealing: **"$XX,XXX in estimated uncollected royalties"**
- Breakdown by stream type (Performance, Mechanical, Sync)
- Confidence badge
- Dramatic pause with pulsing glow effect

**2.6 Slide: ENCORE Integration Showcase**
- 3D visualization (reuse `CatalogValuation3D.tsx`)
- Floating tool icons: Copyright, Royalties, MLC, Contracts
- Animated workflow arrows showing data flow
- "All your rights. One platform." tagline

**2.7 Slide: Call to Action**
- "Ready to recover your royalties?" headline
- Animated buttons: Schedule Demo, Download Report, Start Free Trial
- QR code for quick signup
- Contact information

### Phase 3: Data Integration

**3.1 New Hook: `src/hooks/useCatalogAuditPresentation.ts`**

Orchestrates the presentation data flow:
- Accepts artist name or existing search ID
- Pulls data from `song_catalog_searches` table
- Fetches song metadata for pipeline calculations
- Uses `computeCatalogPipeline` from `pipelineValuation.ts`
- Calculates registration gap counts
- Returns structured data for each slide

**3.2 Data Structure**
```typescript
interface AuditPresentationData {
  artistName: string;
  catalogSize: number;
  albumCount: number;
  singleCount: number;
  registrationGaps: {
    missingISWC: number;
    missingPRO: number;
    incompleteMetadata: number;
    total: number;
  };
  pipelineEstimate: {
    total: number;
    performance: number;
    mechanical: number;
    sync: number;
    missingImpact: number;
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  searchId: string;
  generatedAt: string;
}
```

### Phase 4: Export & Persistence

**4.1 PDF Export**

Integrate with existing `usePDFGeneration.ts` patterns:
- Export presentation as professional PDF report
- Include all key metrics and the "big reveal" figure
- ENCORE branding throughout
- Reference: `NAMMOnePager.tsx` layout patterns

**4.2 Database Tracking**

New table: `catalog_audit_presentations`
```sql
CREATE TABLE catalog_audit_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  artist_name TEXT NOT NULL,
  search_id UUID REFERENCES song_catalog_searches(id),
  presentation_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  last_presented_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 5: Page & Navigation

**5.1 New Page: `src/pages/CatalogAuditPresentationPage.tsx`**

- Route: `/catalog-audit-presentation`
- Accepts query params: `?searchId=xxx` or `?artist=xxx`
- Fullscreen mode toggle
- Controls: Previous, Next, Auto-play, Export

**5.2 Entry Points**

Add "Generate Audit Presentation" button to:
- `SongEstimatorTool.tsx` (after search completes)
- Operations dashboard (for admin/sales team)
- Quick action menu in the CRM

---

## Animation Specifications

### Timing & Easing

| Animation | Duration | Delay | Easing |
|-----------|----------|-------|--------|
| Slide transition | 600ms | - | ease-out |
| Text fade-in | 400ms | staggered 100ms | ease-out |
| Counter animation | 2000ms | 500ms after slide | ease-out-expo |
| 3D float | continuous | - | sine wave |
| Glow pulse | 2000ms | - | ease-in-out |
| Progress bar fill | 1500ms | 200ms | ease-out |

### Color Palette

- Background: `from-slate-900 via-slate-800 to-slate-900`
- Primary accent: `electric-lavender` (#8B5CF6)
- Secondary accent: `dusty-gold` (#D4AF37)
- Success/upside: `success` (#10B981)
- Warning/gaps: `warning` (#F59E0B)
- Danger/impact: `destructive` (#EF4444)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/catalog-audit/CatalogAuditPresentation.tsx` | Main presentation container |
| `src/components/catalog-audit/PresentationSlide.tsx` | Reusable slide wrapper |
| `src/components/catalog-audit/AnimatedCounter.tsx` | Count-up number component |
| `src/components/catalog-audit/slides/IntroSlide.tsx` | Introduction slide |
| `src/components/catalog-audit/slides/DiscoverySlide.tsx` | Discovery animation |
| `src/components/catalog-audit/slides/CatalogOverviewSlide.tsx` | Catalog stats |
| `src/components/catalog-audit/slides/RegistrationGapsSlide.tsx` | Gap analysis |
| `src/components/catalog-audit/slides/FinancialImpactSlide.tsx` | The big reveal |
| `src/components/catalog-audit/slides/IntegrationSlide.tsx` | ENCORE tools showcase |
| `src/components/catalog-audit/slides/CTASlide.tsx` | Call to action |
| `src/hooks/useCatalogAuditPresentation.ts` | Data orchestration hook |
| `src/pages/CatalogAuditPresentationPage.tsx` | Presentation page |
| `supabase/migrations/xxx_catalog_audit_presentations.sql` | Database table |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route for `/catalog-audit-presentation` |
| `src/components/catalog-valuation/SongEstimatorTool.tsx` | Add "Generate Presentation" button |
| `tailwind.config.ts` | Add any new keyframes if needed |

---

## Technical Considerations

### Performance
- Use `React.memo` for slide components to prevent unnecessary re-renders
- Lazy-load 3D visualization (`CatalogValuation3D`) only on the integration slide
- Pre-calculate all data before entering presentation mode

### Accessibility
- Keyboard navigation support (arrows, space, escape)
- Reduced motion support via `prefers-reduced-motion` media query
- Screen reader announcements for slide changes

### Mobile/Tablet
- Responsive design for smaller screens
- Touch gestures for slide navigation
- Orientation lock recommendation for best experience

---

## Success Metrics

- **Marketing Impact**: Track how many presentations convert to demo requests
- **Usage**: Track presentation generation count per user/team
- **Engagement**: Track average time spent in presentation mode
- **Exports**: Track PDF download counts

---

## Implementation Priority

1. **High**: Core presentation framework + AnimatedCounter + Financial Impact slide
2. **High**: Integration with existing `SongEstimatorTool` data
3. **Medium**: All content slides
4. **Medium**: PDF export functionality
5. **Lower**: Database persistence and analytics
6. **Lower**: Mobile optimization
