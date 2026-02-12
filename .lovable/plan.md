# Per-Item Assignee Tags + Phase Advancement Rules

## Overview

Add an `assignee` field to every checklist item so the UI shows who owns each task. Update phase advancement logic so both ENCORE and Client must complete their respective items before moving forward. Clients can only check off items assigned to them.

## 1. Update `src/constants/onboardingPhases.ts`

Add `assignee: 'ENCORE' | 'Client' | 'ENCORE + Client'` to `ChecklistItem` interface.

Apply the following assignments and modifications:

**Phase 1 -- Account Setup** (owner: ENCORE)

- Create Sub-Account -- ENCORE
- Populate Company Name -- ENCORE
- Set Display Name -- ENCORE
- Set Primary Contact Email -- ENCORE
- Set Subscription Tier -- ENCORE
- Verify tier and status -- ENCORE
- REMOVE "Verify admins bypass payment setup" from Phase 3 (moved to Phase 7)

**Phase 2 -- Module Configuration** (owner: ENCORE)

- All 7 items -- ENCORE

**Phase 3 -- User Onboarding** (owner: ENCORE + Client)

- Send signup instructions to admins -- ENCORE
- Admins complete platform signup -- Client
- Add admin users to sub-account -- ENCORE
- Rename "Add internal users with appropriate roles" to "Add initial users with appropriate roles (Admin/User/Client)" -- ENCORE
- Verify role-based access levels -- ENCORE

**Phase 4 -- Contract and Data Ingestion** (owner: ENCORE + Client)

- Collect PDF copies of contracts -- Client
- Collect spreadsheet with metadata -- Client
- Upload via AI-Assisted Parsing -- ENCORE
- Complete manual entry -- ENCORE + Client
- Review parsed contract data -- ENCORE + Client
- Bulk upload associated works -- ENCORE
- Link works to correct contracts -- ENCORE + Client

**Phase 5 -- Data Validation and QA** (owner: ENCORE + Client)

- All items -- ENCORE + Client

**Phase 6 -- Client Portal Setup** (owner: ENCORE + Client)

- All items -- ENCORE + Client

**Phase 7 -- Go-Live Readiness** (owner: All Teams)

- Sub-account active and verified -- ENCORE
- Modules enabled per scope -- ENCORE
- Users added and validated -- ENCORE + Client
- Contracts ingested and approved -- ENCORE + Client
- Works linked and validated -- ENCORE + Client
- Client Portal invitations sent -- ENCORE + Client
- Module visibility validation -- ENCORE
- Data isolation testing -- ENCORE
- Audit log review -- ENCORE
- REMOVE "Login verification without payment redirects"
- ADD "Setup billing via Stripe for enterprise" -- Client (required, final step)

## 2. Update `src/components/admin/subaccount/SubAccountOnboarding.tsx`

- Render a small colored badge next to each checklist item:
  - ENCORE = blue badge
  - Client = orange badge
  - ENCORE + Client = purple badge
- When the current user is viewing as a sub-account (client), disable checkboxes on items assigned to ENCORE (client can only check off their own tasks)
- Phase advance button stays disabled until ALL required items from BOTH parties are completed (existing `getPhaseRequiredComplete` logic already handles this since it checks all required items)

## 3. Update `src/hooks/useOnboardingProgress.ts`

- No changes to `getPhaseRequiredComplete` -- it already requires all required items to be checked before advancing, which naturally enforces the "both parties must complete" rule
- The toggle mutation will be called with the same logic; the UI layer handles restricting who can check what

## 4. Update `src/components/operations/phase6/OnboardingPipelineManager.tsx`

- In the expanded checklist view, render the same colored assignee badge next to each item so admins can see which tasks are waiting on the client

## Technical Details

### Files to Modify

- `src/constants/onboardingPhases.ts` -- add assignee field, update items, move/remove items per instructions
- `src/components/admin/subaccount/SubAccountOnboarding.tsx` -- render badges, restrict checkbox interaction for clients
- `src/components/operations/phase6/OnboardingPipelineManager.tsx` -- render assignee badges in expanded checklist

### Assignee Badge Colors

```text
ENCORE        -> className="bg-blue-100 text-blue-700 border-blue-200"
Client        -> className="bg-orange-100 text-orange-700 border-orange-200"
ENCORE + Client -> className="bg-purple-100 text-purple-700 border-purple-200"
```

### Client Restriction Logic

Use the existing `useViewModeOptional` hook. When `isViewingAsSubAccount` is true, the user is acting as a client -- disable checkboxes where `item.assignee === 'ENCORE'`. ENCORE items remain visible but non-interactive for the client.