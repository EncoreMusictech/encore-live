

# Onboarding Dashboard for Sub-Accounts

## Overview
Create a persistent, database-backed onboarding dashboard that tracks each sub-account through the 7-phase enterprise implementation workflow in real-time. This replaces the current hardcoded/demo data in `OnboardingPipelineManager` with live data, and adds an "Onboarding" tab to the `SubAccountDetailPage` so each account's progress is visible both from Operations Hub and from the account detail view.

## What Gets Built

### 1. Database Tables

**`client_onboarding_progress`** -- one row per company
- `id` (uuid, PK)
- `company_id` (uuid, FK -> companies, unique)
- `current_phase` (text) -- e.g. `account_setup`, `module_config`, etc.
- `phase_progress` (integer, 0-100)
- `week_number` (integer)
- `start_date` (date)
- `target_go_live` (date)
- `risk_level` (text) -- low / medium / high
- `assigned_csm` (text)
- `status` (text) -- active / completed / paused
- `created_at`, `updated_at` (timestamptz)

**`client_onboarding_checklist`** -- one row per completed checklist item
- `id` (uuid, PK)
- `company_id` (uuid, FK -> companies)
- `phase_id` (text) -- e.g. `account_setup`
- `item_id` (text) -- e.g. `create_sub_account`
- `completed` (boolean, default true)
- `completed_by` (uuid, FK -> auth.users)
- `completed_at` (timestamptz)
- `notes` (text, nullable)
- Unique constraint on (company_id, phase_id, item_id)

Both tables get RLS enabled with admin-only policies using `has_role()`.

### 2. React Hook: `useOnboardingProgress`
A custom hook (`src/hooks/useOnboardingProgress.ts`) that:
- Fetches `client_onboarding_progress` and `client_onboarding_checklist` for a given company
- Provides mutations to toggle checklist items, advance phases, update risk level
- Auto-calculates phase progress from checklist completion percentages
- Integrates with React Query for caching and optimistic updates

### 3. Onboarding Dashboard Component
New component: `src/components/admin/subaccount/SubAccountOnboarding.tsx`
- Displays a visual stepper (using the existing `Stepper` component) showing all 7 phases with completed/current/pending status
- Current phase card with interactive checklist (checkboxes that persist to DB)
- Progress bar for overall implementation and per-phase completion
- Risk indicator and CSM assignment display
- "Advance Phase" button (enabled when all required items in current phase are complete)
- Timeline showing start date, current week, and target go-live

### 4. Integration Points

**SubAccountDetailPage** -- Add an "Onboarding" tab between Overview and Users:
- Shows the `SubAccountOnboarding` component
- Auto-initializes onboarding progress when tab is first opened for a new account

**OnboardingPipelineManager** -- Replace hardcoded `enterpriseClients` array:
- Query `client_onboarding_progress` joined with `companies` to get live data
- Checklist expand/collapse now reads from `client_onboarding_checklist`
- "Advance Phase" button triggers real mutations
- Pipeline view shows real-time phase distribution

### 5. Auto-Initialization
When a new sub-account is created (or when the Onboarding tab is first visited), the system automatically creates a `client_onboarding_progress` row with:
- `current_phase: 'account_setup'`
- `start_date: today`
- `target_go_live: today + 7 weeks`
- `risk_level: 'low'`
- `status: 'active'`

---

## Technical Details

### Phase Definitions (kept in code, same as existing)
The 7-phase structure with checklist items remains defined in a shared constant file (`src/constants/onboardingPhases.ts`) so both the Operations Hub and the Sub-Account detail page reference the same source of truth.

### Phase Advancement Logic
- Calculate completion: count completed checklist items vs. required items for the current phase
- "Advance Phase" enabled only when all required items are checked
- Advancing sets `current_phase` to next phase ID and resets `phase_progress`
- Final phase completion sets `status: 'completed'`

### Files to Create
1. `src/constants/onboardingPhases.ts` -- shared phase/checklist definitions
2. `src/hooks/useOnboardingProgress.ts` -- data fetching and mutations
3. `src/components/admin/subaccount/SubAccountOnboarding.tsx` -- detail page tab component

### Files to Modify
1. `src/pages/SubAccountDetailPage.tsx` -- add Onboarding tab
2. `src/components/operations/phase6/OnboardingPipelineManager.tsx` -- wire to live DB data
3. Database migration for the two new tables + RLS policies

