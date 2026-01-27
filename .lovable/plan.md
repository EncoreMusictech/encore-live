
# Implementation Plan: Add operations@encoremusic.tech as Admin User

## Overview
Grant `operations@encoremusic.tech` admin access to the ENCORE CRM with the same privileges as `info@encoremusic.tech`.

## Current State
- **User exists**: `operations@encoremusic.tech` (ID: `1e1cebcc-8e99-4d8f-9cdd-e87c24ed7eee`)
- **Current admins in database**: 2 users have `admin` role in `user_roles` table
- **Hardcoded admin emails**: Found in 15+ files across the codebase

---

## Implementation Strategy: Hybrid Approach

### Phase 1: Database Role Assignment
Add the `admin` role to the `user_roles` table for immediate access via components using `useUserRoles()`.

**SQL to execute:**
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('1e1cebcc-8e99-4d8f-9cdd-e87c24ed7eee', 'admin');
```

### Phase 2: Update Hardcoded Admin Email Arrays
Update all files that define local `adminEmails` arrays to include `operations@encoremusic.tech`.

**Files to update (13 total):**

| File | Line | Current Code |
|------|------|--------------|
| `src/hooks/useAdmin.ts` | 13 | `['info@encoremusic.tech','support@encoremusic.tech']` |
| `src/hooks/useSuperAdmin.ts` | 13 | `['support@encoremusic.tech','info@encoremusic.tech']` |
| `src/components/AdminOrProtectedRoute.tsx` | 10 | `ADMIN_EMAILS = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/components/Header.tsx` | 27 | `adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/components/crm/CRMLayout.tsx` | 34 | `adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/components/crm/CRMDashboard.tsx` | 197 | `adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/pages/CRMOperationsPage.tsx` | 14 | `adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/hooks/useDemoAccess.tsx` | 47 | `ADMIN_EMAILS = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/pages/Auth.tsx` | 66 | `ADMIN_EMAILS = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/components/operations/DataSeedButton.tsx` | 17 | `adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/pages/CRMCatalogValuationPage.tsx` | 59 | `adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `src/pages/LuminateCatalogTestPage.tsx` | 52 | `adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech']` |
| `supabase/functions/operations-data-seeder/index.ts` | 33 | `user.email !== 'info@encoremusic.tech'` |

**Updated code pattern:**
```typescript
const adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'];
```

### Phase 3: Database RLS Policy Updates (Optional)
The following SQL migrations have hardcoded admin emails in RLS policies. These require new migrations to add `operations@encoremusic.tech`:

| Migration File | Policy |
|----------------|--------|
| `20250914050720_*.sql` | Storage policies for import-files bucket |
| `20250824155811_*.sql` | `is_operations_team_member()` function |
| `20250824155357_*.sql` | operations_team_members table |
| `20250825203122_*.sql` | blockchain_admin_settings |

**New migration to add:**
```sql
-- Update storage policies to include operations@encoremusic.tech
-- Update is_operations_team_member function
-- Update RLS policies
```

---

## Access Granted After Implementation

| Module | Access Level |
|--------|-------------|
| CRM Dashboard | Full access to all modules |
| Operations Hub | Full access (Client Onboarding, Analytics, etc.) |
| Catalog Valuation | Song Estimator tool access |
| Data Seeding | Can seed operations data |
| Admin Panel | Visible in header navigation |
| Client Portal | View as client mode |
| Storage | Import files bucket access |

---

## Technical Notes
- All email comparisons are case-insensitive (`.toLowerCase()`)
- The `useUserRoles` hook provides a fallback admin check via the `user_roles` table
- Database role insertion is the most critical step for immediate access
- Code updates ensure consistent behavior across all access control points
