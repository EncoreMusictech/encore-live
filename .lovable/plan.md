
# View as User: True Sub-Account Experience

## Problem
When an admin clicks "View as User" on a sub-account, they still see all admin-only sidebar items (Operations, Client Portal, NFT Minting), admin badges, and admin-level access gates. The `isViewingAsSubAccount` flag from `ViewModeContext` is never checked by the hooks that control visibility: `useAdmin`, `useSuperAdmin`, `useUserRoles`, `useDemoAccess`, or `CRMSidebar`.

## Solution
Make all admin/super-admin detection hooks suppress their privileges when `isViewingAsSubAccount` is true. Additionally, make the sidebar load the **target company's enabled modules** instead of granting blanket access.

## Changes

### 1. Update `useAdmin.ts` -- suppress admin when viewing as sub-account
- Import `useViewMode` (with a safe fallback since it may be used outside the provider)
- When `isViewingAsSubAccount` is true, force `isAdmin = false`

### 2. Update `useSuperAdmin.ts` -- suppress super admin in view mode
- Same pattern: when `isViewingAsSubAccount` is true, force `isSuperAdmin = false`

### 3. Update `useUserRoles.ts` -- suppress admin role in view mode
- When `isViewingAsSubAccount` is true, filter out the `admin` role from the returned roles array
- `isAdmin` and `hasRole('admin')` will return false

### 4. Update `useDemoAccess.tsx` -- suppress admin flag in view mode
- When `isViewingAsSubAccount` is true, force `isAdmin = false` so demo limits and access checks behave as a regular user

### 5. Update `CRMSidebar.tsx` -- show only the target company's modules
- Import `useViewMode`
- When `isViewingAsSubAccount`, fetch the target company's enabled modules from `company_module_access` using `viewContext.companyId` instead of the admin's own access
- Hide admin-only modules (Operations, Client Portal, NFT Minting) entirely
- Hide "Manage Clients" quick action unless the target company is a publishing firm with enterprise tier
- Update the footer module count to reflect the sub-account's actual access

### 6. Update `CRMLayout.tsx` -- skip payment redirect in view mode
- When `isViewingAsSubAccount`, skip the payment/subscription check (the admin is already authenticated; the view mode should just show the sub-account experience without redirecting)

### 7. Update `CRMHeader.tsx` -- show sub-account context
- When `isViewingAsSubAccount`, display the company name and tier badge from `viewContext` instead of the admin's own subscription tier

## Technical Details

### Safe ViewMode Access
Since `useViewMode` throws if used outside `ViewModeProvider`, each hook will use a wrapper pattern:

```text
function useViewModeOptional() {
  try {
    return useViewMode();
  } catch {
    return { isViewingAsSubAccount: false, viewContext: null };
  }
}
```

This will be extracted to a shared utility (`src/hooks/useViewModeOptional.ts`) so all hooks can import it.

### Sidebar Module Resolution in View Mode
When in view mode, the sidebar will:
1. Query `company_module_access` for the target `companyId`
2. Map those module IDs to sidebar entries using the same alias normalization from `useModuleAccess`
3. Only show matched modules -- no admin modules, no fallback to "show everything"

### Files to Create
- `src/hooks/useViewModeOptional.ts` -- safe wrapper for useViewMode

### Files to Modify
- `src/hooks/useAdmin.ts` -- suppress when viewing as sub-account
- `src/hooks/useSuperAdmin.ts` -- suppress when viewing as sub-account
- `src/hooks/useUserRoles.ts` -- filter admin role when viewing as sub-account
- `src/hooks/useDemoAccess.tsx` -- suppress admin when viewing as sub-account
- `src/components/crm/CRMSidebar.tsx` -- load target company modules, hide admin items
- `src/components/crm/CRMLayout.tsx` -- skip payment gate in view mode
- `src/components/crm/CRMHeader.tsx` -- show sub-account context info
