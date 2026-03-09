

## Problem

When an ENCORE admin enters "View as User" mode, `isEncoreAdmin` becomes `false` (line 54: `&& !isViewingAsSubAccount`). Since the admin is not actually a member of the sub-account company, `isSubAccountAdmin` is also `false`. This hides all tabs except "Onboarding".

The user wants all tabs/features restored in view mode — only the "Back to Sub-Accounts" link should be hidden.

## Solution

Split the admin check into two concerns:

1. **`isEncoreAdmin`** — stays as-is (suppressed in view mode) — used ONLY for the "Back to Sub-Accounts" button and the Service Account Provisioner.
2. **`hasFullAccess`** — a new boolean that is `true` when the user is an ENCORE admin (regardless of view mode) OR a sub-account admin. Used for all tab visibility.

### Changes

**File: `src/pages/SubAccountDetailPage.tsx`**

- Add a new variable:
  ```ts
  const isEncoreEmail = adminEmails.includes(user?.email?.toLowerCase() || '');
  const isEncoreAdmin = isEncoreEmail && !isViewingAsSubAccount;
  const hasFullAccess = isEncoreEmail || isSubAccountAdmin;
  ```

- Replace all `(isEncoreAdmin || isSubAccountAdmin)` checks for tabs/content with `hasFullAccess`
- Keep `isEncoreAdmin` only for the "Back to Sub-Accounts" button (line 155) and ServiceAccountProvisioner (line 191)
- Update default tab: `defaultValue={hasFullAccess ? "overview" : "onboarding"}`

This ensures that in "View as User" mode, the admin still sees all tabs (simulating full sub-account admin access) but cannot navigate back to the sub-accounts list.

