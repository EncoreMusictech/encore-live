

## Plan: Apply Sub-account Branding Globally Across Entire App

### Problem
Currently, the `CompanyBrandingProvider` only overrides 5 CSS variables (`--primary`, `--accent`, `--ring`, `--electric-lavender`, `--music-purple`). The sidebar and header already swap the logo/name via `useCompanyBranding`, but several areas still hardcode "ENCORE" text or miss applying the `headerBg` color. When a sub-account user logs in, branding should feel complete — no ENCORE references, full color theming.

### Changes

#### 1. Expand `CompanyBrandingProvider` CSS variable coverage
**File: `src/components/CompanyBrandingProvider.tsx`**

Add more CSS variables to the `BRANDING_VARS` list and `applyBranding` function:
- `--sidebar-primary` → set to `colors.primary`
- `--sidebar-accent-foreground` → set to `colors.accent`
- `--dusty-gold` → set to `colors.accent`
- `--music-gold` → set to `colors.accent`
- `--gradient-primary` → rebuild gradient using `colors.primary` and `colors.accent`
- `--gradient-accent` → rebuild gradient using `colors.accent` and `colors.primary`
- `--shadow-elegant` → rebuild using `colors.primary`
- `--shadow-glow` → rebuild using `colors.primary`

This ensures buttons, badges, gradients, glows, sidebar highlights, and accent text all use the sub-account's color palette.

#### 2. Replace hardcoded "ENCORE" text when branding is active
**Files to edit:**

- **`src/components/WelcomeModal.tsx`**: Use `useCompanyBranding` — replace "Welcome to Encore Music!" with "Welcome to {brandName}!" when branding is active. Same for the toast messages.

- **`src/pages/AcceptInvitation.tsx`**: Use `useCompanyBranding` — replace the "ENCORE" logo text and "Welcome to ENCORE" card title with the brand name. Also swap the `<Music>` icon for the brand logo when available.

- **`src/components/catalog-audit/AuditPresentationSelector.tsx`**: Replace the hardcoded `ENCORE` span in the heading with the brand name when branding is active.

#### 3. Already handled (no changes needed)
These areas already correctly swap logo/name based on `useCompanyBranding`:
- `CRMSidebar` — uses `sidebarLogo` / `sidebarName`
- `CRMHeader` — uses `headerLogo` / `headerName`
- `ClientPortal` — uses `useClientBranding` for logo/name/colors
- `LiveChatInterface` — hides "Powered by ENCORE" when branding active
- `IntroSlide` — hides "Powered by ENCORE's..." when branding active

#### Technical Detail
No new hooks or data changes needed. `useCompanyBranding` already resolves the correct branding for logged-in sub-account users via their company membership. The `CompanyBrandingProvider` wraps the entire app in `App.tsx`, so expanding its CSS variable coverage automatically themes everything.

