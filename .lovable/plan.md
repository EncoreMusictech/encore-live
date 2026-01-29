

# Hierarchical Multi-Tenant Architecture for Publishing Firms & Their Clients

## Executive Summary

This plan introduces a **3-tier hierarchical multi-tenant system** that enables publishing firms (like PAQ Publishing) to manage multiple client labels/publishers (Empire, COBALT, etc.) with full data isolation, aggregated views, and granular permissions.

---

## Current State Analysis

### Existing Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      ENCORE (System Admin)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│    │ Sub-Account │    │ Sub-Account │    │ Sub-Account │       │
│    │ (Company)   │    │ (Company)   │    │ (Company)   │       │
│    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│           │                  │                  │               │
│     ┌─────┴─────┐      ┌─────┴─────┐      ┌─────┴─────┐        │
│     │   Users   │      │   Users   │      │   Users   │        │
│     └───────────┘      └───────────┘      └───────────┘        │
│                                                                  │
│    Current: Flat 2-tier structure (Companies → Users)           │
│    Problem: No hierarchy for clients under publishing firms     │
└─────────────────────────────────────────────────────────────────┘
```

### What Exists Today

| Component | Status | Purpose |
|-----------|--------|---------|
| `companies` table | Exists | Sub-account companies |
| `company_users` table | Exists | Users linked to companies |
| `company_module_access` table | Exists | Module permissions per company |
| `client_portal_access` table | Exists | Client user access (subscriber → client) |
| `client_data_associations` table | Exists | Links clients to specific data (copyrights, contracts, payees) |
| `ViewModeContext` | Exists | Admin "view as" sub-account |
| `useDataFiltering` hook | Exists | Filters data by company users |

### The Gap

- **No parent-child company relationships** (PAQ → Empire, PAQ → COBALT)
- **No client-level data isolation** within sub-accounts
- **No aggregated views** across multiple clients
- **No client-specific dashboards** with their own portal

---

## Proposed Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ENCORE (System Admin)                               │
│                          Tier 0: Platform Admin                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  TIER 1: PUBLISHING FIRMS (Sub-Accounts)                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         PAQ Publishing                                   │ │
│  │  • Sees ALL clients aggregated OR individually                          │ │
│  │  • Manages client accounts, permissions, data                           │ │
│  │  • Toggle view: "All Clients" ↔ "Empire" ↔ "COBALT"                     │ │
│  │                                                                          │ │
│  │  TIER 2: CLIENT LABELS (Child Companies)                                │ │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │ │
│  │  │      Empire       │  │      COBALT       │  │    Client X       │   │ │
│  │  │                   │  │                   │  │                   │   │ │
│  │  │ • Own dashboard   │  │ • Own dashboard   │  │ • Own dashboard   │   │ │
│  │  │ • Own works       │  │ • Own works       │  │ • Own works       │   │ │
│  │  │ • Own balances    │  │ • Own balances    │  │ • Own balances    │   │ │
│  │  │ • Own permissions │  │ • Own permissions │  │ • Own permissions │   │ │
│  │  │                   │  │                   │  │                   │   │ │
│  │  │ ┌─────────────┐  │  │ ┌─────────────┐  │  │ ┌─────────────┐  │   │ │
│  │  │ │ Client Users│  │  │ │ Client Users│  │  │ │ Client Users│  │   │ │
│  │  │ └─────────────┘  │  │ └─────────────┘  │  │ └─────────────┘  │   │ │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Phase 1: Database Schema Changes

#### 1.1 Add Parent Company Relationship

```sql
-- Add parent_company_id to companies table
ALTER TABLE companies 
ADD COLUMN parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add company_type to distinguish publishing firms from client labels
ALTER TABLE companies 
ADD COLUMN company_type TEXT DEFAULT 'standard' 
CHECK (company_type IN ('publishing_firm', 'client_label', 'standard'));

-- Index for efficient hierarchy queries
CREATE INDEX idx_companies_parent ON companies(parent_company_id);
CREATE INDEX idx_companies_type ON companies(company_type);
```

#### 1.2 Create Client Scope Table

```sql
-- Track which companies a user can view (for aggregation toggle)
CREATE TABLE company_view_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- NULL means "all clients", specific ID means single client
  scoped_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, parent_company_id)
);
```

#### 1.3 Extend Company Module Access for Clients

```sql
-- Add inheritance flag for module access
ALTER TABLE company_module_access 
ADD COLUMN inherited_from UUID REFERENCES companies(id);
```

### Phase 2: Database Functions

#### 2.1 Get Child Companies

```sql
CREATE OR REPLACE FUNCTION get_child_companies(_parent_id UUID)
RETURNS TABLE(company_id UUID, company_name TEXT, display_name TEXT, company_type TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, display_name, company_type
  FROM companies
  WHERE parent_company_id = _parent_id
  ORDER BY name;
$$;
```

#### 2.2 Get Aggregated User IDs (For Filtering)

```sql
CREATE OR REPLACE FUNCTION get_company_hierarchy_user_ids(_company_id UUID)
RETURNS TABLE(user_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- Get users from parent company
  SELECT cu.user_id FROM company_users cu WHERE cu.company_id = _company_id AND cu.status = 'active'
  UNION
  -- Get users from all child companies
  SELECT cu.user_id 
  FROM company_users cu
  INNER JOIN companies c ON cu.company_id = c.id
  WHERE c.parent_company_id = _company_id AND cu.status = 'active';
$$;
```

#### 2.3 Check Hierarchy Access

```sql
CREATE OR REPLACE FUNCTION user_has_hierarchy_access(_user_id UUID, _target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    -- Direct membership
    SELECT 1 FROM company_users 
    WHERE user_id = _user_id AND company_id = _target_company_id AND status = 'active'
  ) OR EXISTS (
    -- Parent company membership (can see all children)
    SELECT 1 FROM company_users cu
    INNER JOIN companies c ON c.parent_company_id = cu.company_id
    WHERE cu.user_id = _user_id 
    AND c.id = _target_company_id 
    AND cu.status = 'active'
  );
$$;
```

### Phase 3: Extended ViewModeContext

#### 3.1 Enhanced View Context Interface

```typescript
interface ViewContext {
  mode: 'system' | 'subaccount' | 'client';
  companyId?: string;
  companyName?: string;
  parentCompanyId?: string;       // NEW: For child companies
  parentCompanyName?: string;     // NEW: For breadcrumb display
  viewScope: 'all' | 'single';    // NEW: Aggregated or single client
  returnPath?: string;
  sessionId?: string;
}
```

#### 3.2 New Hook: useHierarchicalFiltering

```typescript
// src/hooks/useHierarchicalFiltering.ts
export function useHierarchicalFiltering() {
  const { viewContext } = useViewMode();
  
  const getFilterConfig = async () => {
    if (viewContext?.viewScope === 'all' && viewContext?.parentCompanyId) {
      // Aggregate mode: get all child company user IDs
      const { data } = await supabase.rpc('get_company_hierarchy_user_ids', {
        _company_id: viewContext.parentCompanyId
      });
      return { userIds: data?.map(r => r.user_id) || [], mode: 'aggregate' };
    } else if (viewContext?.companyId) {
      // Single client mode: get only that company's users
      const { data } = await supabase
        .from('company_users')
        .select('user_id')
        .eq('company_id', viewContext.companyId)
        .eq('status', 'active');
      return { userIds: data?.map(r => r.user_id) || [], mode: 'single' };
    }
    return { userIds: [], mode: 'system' };
  };

  return { getFilterConfig, ... };
}
```

### Phase 4: UI Components

#### 4.1 Client Selector Dropdown

New component for switching between aggregated and individual client views:

```typescript
// src/components/hierarchy/ClientScopeSelector.tsx
// Dropdown: "All Clients" | "Empire" | "COBALT" | ...
// Updates viewContext.viewScope and viewContext.companyId
```

#### 4.2 Enhanced Sub-Account Detail Page

Add a "Clients" tab to the SubAccountDetailPage for publishing firms:

```typescript
// New tab in SubAccountDetailPage.tsx
<TabsTrigger value="clients">
  <Building2 className="h-4 w-4 mr-2" />
  Clients
</TabsTrigger>

<TabsContent value="clients">
  <ClientsManager parentCompanyId={company.id} />
</TabsContent>
```

#### 4.3 Client Dashboard

New route and component for client label users:

```typescript
// src/pages/ClientLabelDashboard.tsx
// Shows only that client's:
// - Works & copyrights
// - Account balances
// - Contracts
// - Registration status
// - Metadata gaps
```

#### 4.4 Aggregated Analytics Dashboard

For publishing firms viewing all clients together:

```typescript
// src/components/hierarchy/AggregatedDashboard.tsx
// Shows:
// - Combined account balances
// - Works by client (breakdown)
// - Unregistered works by client
// - Metadata gaps by client
// - Revenue by client
```

### Phase 5: Data Ownership Model

#### 5.1 Copyrights, Contracts, Payees

Current tables use `user_id` for ownership. This will be extended with optional `client_company_id`:

```sql
-- Add client segmentation to key tables
ALTER TABLE copyrights 
ADD COLUMN client_company_id UUID REFERENCES companies(id);

ALTER TABLE contracts 
ADD COLUMN client_company_id UUID REFERENCES companies(id);

ALTER TABLE payees 
ADD COLUMN client_company_id UUID REFERENCES companies(id);

ALTER TABLE royalty_allocations 
ADD COLUMN client_company_id UUID REFERENCES companies(id);

-- Indexes for efficient filtering
CREATE INDEX idx_copyrights_client ON copyrights(client_company_id);
CREATE INDEX idx_contracts_client ON contracts(client_company_id);
CREATE INDEX idx_payees_client ON payees(client_company_id);
```

#### 5.2 RLS Policies for Hierarchy

```sql
-- Example: Copyrights policy with hierarchy support
CREATE POLICY "Users can view copyrights in their company hierarchy"
ON copyrights FOR SELECT
TO authenticated
USING (
  -- System admin sees all
  public.is_operations_team_member()
  OR
  -- Direct ownership
  user_id = auth.uid()
  OR
  -- Company hierarchy access
  (client_company_id IS NOT NULL AND public.user_has_hierarchy_access(auth.uid(), client_company_id))
);
```

### Phase 6: Module Permission Inheritance

When a publishing firm has a module enabled, child clients can inherit or have custom permissions:

```typescript
// Module access logic
async function getEffectiveModuleAccess(companyId: string) {
  // 1. Get direct module access
  const direct = await getCompanyModules(companyId);
  
  // 2. Get parent company
  const company = await getCompany(companyId);
  if (company.parent_company_id) {
    const inherited = await getCompanyModules(company.parent_company_id);
    // Merge with inheritance rules
  }
  
  return mergedModules;
}
```

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useHierarchicalFiltering.ts` | Extended filtering for 3-tier hierarchy |
| `src/hooks/useClientHierarchy.ts` | CRUD operations for client companies |
| `src/components/hierarchy/ClientScopeSelector.tsx` | Toggle between all/single client views |
| `src/components/hierarchy/ClientsManager.tsx` | Manage child companies |
| `src/components/hierarchy/AggregatedDashboard.tsx` | Combined analytics view |
| `src/pages/ClientLabelDashboard.tsx` | Client-specific dashboard |
| `src/components/hierarchy/ClientBalancesCard.tsx` | Account balances per client |
| `src/components/hierarchy/ClientWorksGaps.tsx` | Registration/metadata gaps by client |

### Modified Files

| File | Changes |
|------|---------|
| `src/contexts/ViewModeContext.tsx` | Add `viewScope`, `parentCompanyId` to context |
| `src/hooks/useDataFiltering.ts` | Support hierarchical filtering |
| `src/components/ViewModeBanner.tsx` | Show client scope in banner |
| `src/pages/SubAccountDetailPage.tsx` | Add "Clients" tab for publishing firms |
| `src/components/admin/SubAccountManager.tsx` | Show parent-child relationships |
| `src/App.tsx` | Add routes for client label dashboard |

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| `add_company_hierarchy.sql` | Add `parent_company_id`, `company_type` columns |
| `create_view_scope_table.sql` | Track user view preferences |
| `add_client_segmentation.sql` | Add `client_company_id` to data tables |
| `create_hierarchy_functions.sql` | RPC functions for hierarchy queries |
| `update_rls_policies.sql` | Extend RLS for hierarchy access |

---

## User Experience Flow

### For Publishing Firm Users (PAQ Publishing)

1. **Login** → Lands on Publishing Firm Dashboard
2. **Default View**: Aggregated across all clients (Empire, COBALT, etc.)
3. **Toggle**: Click dropdown to switch to single client view
4. **See**: Combined balances, works by client, registration gaps
5. **Manage**: Create new client labels, assign data, set permissions

### For Client Label Users (Empire)

1. **Login** → Lands on Client Label Dashboard
2. **See**: Only Empire's works, balances, contracts
3. **Actions**: Based on permissions granted by PAQ Publishing
4. **Cannot See**: Other clients' data (COBALT, etc.)

### For ENCORE Admins

1. **View Mode**: Can view as Publishing Firm OR as specific Client
2. **Aggregation**: See all levels of the hierarchy
3. **Management**: Create publishing firms, assign clients

---

## Rollout Strategy

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1 | Week 1 | Database schema changes, RPC functions |
| 2 | Week 2 | Extended ViewModeContext, useHierarchicalFiltering hook |
| 3 | Week 3 | UI: ClientScopeSelector, ClientsManager |
| 4 | Week 4 | UI: AggregatedDashboard, ClientLabelDashboard |
| 5 | Week 5 | Data migration tools, testing, documentation |

---

## Security Considerations

1. **RLS Policies**: All hierarchy access enforced at database level
2. **Audit Logging**: Track which level user is viewing
3. **Permission Inheritance**: Child companies cannot exceed parent permissions
4. **Session Isolation**: View context stored in session, not localStorage

