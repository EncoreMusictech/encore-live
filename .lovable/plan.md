
# Fix: Onboarding Checklist Permission Enforcement

## Problem
Currently, sub-account users can check off ENCORE-assigned tasks, and the restriction logic only partially works in "View as Sub-Account" mode. The rules should be:

- **Sub-account users** (non-admin, logged in directly or via view mode) can ONLY check items assigned to `Client` or `ENCORE + Client`
- **ENCORE admins** can ONLY check items assigned to `ENCORE` or `ENCORE + Client`
- Neither party can check the other's exclusive tasks

## Solution

Update the `isCheckboxDisabled` function in `SubAccountOnboarding.tsx` to enforce bidirectional restrictions:

### Changes to `src/components/admin/subaccount/SubAccountOnboarding.tsx`

Replace the `isCheckboxDisabled` function (lines 103-110) with logic that:

1. **If the user is an ENCORE admin** (determined by hardcoded admin email list):
   - Enable: `ENCORE` and `ENCORE + Client` items
   - Disable: `Client`-only items (they cannot do the client's work)

2. **If the user is a sub-account user** (non-admin, either via view mode or direct login):
   - Enable: `Client` and `ENCORE + Client` items
   - Disable: `ENCORE`-only items (they cannot do ENCORE's work)

```text
Updated logic:

isCheckboxDisabled(assignee):
  if isAdmin:
    return assignee === 'Client'    // Admin cannot check client-only tasks
  else:
    return assignee === 'ENCORE'    // Client cannot check ENCORE-only tasks
```

### Also update: `src/components/operations/phase6/OnboardingPipelineManager.tsx`

The `PipelineChecklist` component (line 20-50) has the same issue -- it renders checkboxes without any assignee-based restrictions. Apply the same permission logic there, using the admin email check pattern.

## Technical Details

- The admin check uses the existing hardcoded email array (`info@`, `support@`, `operations@encoremusic.tech`)
- The `ENCORE + Client` assignee is always enabled for both parties since it requires collaboration
- No database or RLS changes needed -- this is a UI-level enforcement
- The existing `disabled` prop on `Checkbox` handles the visual/interaction restriction
