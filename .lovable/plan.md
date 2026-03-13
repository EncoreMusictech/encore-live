

## Remove "Free Trial" Buttons Site-Wide

Replace all "Start Free Trial" buttons/CTAs with "Schedule a Demo" pointing to `https://calendly.com/encoremts`.

### Files to Update

1. **`src/components/Hero.tsx`** (line 62-67) — Replace "Start Free Trial" button with "Schedule a Demo" linking to Calendly (remove duplicate since Schedule Demo already exists at line 73-76; consolidate into one)

2. **`src/components/Header.tsx`** (lines 111-115) — Change "Start Free Trial" button to "Schedule a Demo" linking to Calendly

3. **`src/pages/LandingPage.tsx`** — 4 changes:
   - Lines 233-240: Replace "Start Free Trial" with "Schedule a Demo" → Calendly
   - Line 469: Change pricing tier button text from "Start Free Trial" to "Schedule a Demo"
   - Lines 516-524: Replace "Start Free Trial - No Credit Card Required" with "Schedule a Demo"
   - Line 535: Remove "14-day free trial" trust indicator text or replace with non-trial messaging

4. **`src/components/catalog-audit/slides/CTASlide.tsx`** (lines 108-116) — Remove the "Start Free Trial" button entirely (Schedule a Demo already exists above it)

5. **`src/components/DemoUpgradeModal.tsx`** (lines 64-68, 81-84) — Change "Sign Up Now - Free Trial" to "Schedule a Demo" and remove "30-day free trial included" badge

6. **`src/pages/UserCasePage.tsx`** (line 225) — Change "Start 14-Day Free Trial" to "Schedule a Demo"

7. **`src/components/tour/QuickStartGuide.tsx`** (lines 217-220) — Change "Sign up for a free trial" to "Schedule a demo"

8. **`src/components/marketing/NAMMOnePager.tsx`** (line 233) — Change "Start Your Free Trial Today" to "Schedule a Demo Today"

All "Schedule a Demo" buttons will open `https://calendly.com/encoremts` in a new tab.

