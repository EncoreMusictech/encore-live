

## Fix: Redirect Sub-Account Users to Their Detail Page

**What changes**: One small modification to `src/pages/CRMOperationsPage.tsx`.

**Who is affected**:
- ENCORE admins: No change. They continue seeing the full Operations Dashboard as before.
- Sub-account admins (e.g., PAQ Publishing): Instead of seeing the stripped-down ClientsManager, they are automatically redirected to their full tabbed detail page at `/dashboard/operations/sub-accounts/{their-company-id}`.
- Non-privileged users: No change. They continue seeing the "Access Required" screen.

### Technical Details

**File: `src/pages/CRMOperationsPage.tsx`**

1. Add `Navigate` to the existing `react-router-dom` import.
2. Replace the `canManageClients && userCompany` block (which currently renders `ClientsManager`) with a single redirect:

```tsx
if (canManageClients && userCompany) {
  return <Navigate to={`/dashboard/operations/sub-accounts/${userCompany.id}`} replace />;
}
```

The existing guard order ensures ENCORE admins are handled first and never reach this code path. No other files require changes.

