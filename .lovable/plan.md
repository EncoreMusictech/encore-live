

# PAQ Publishing: Multi-Entity Architecture Assessment and Proposal

## Current State Analysis

### What Exists Today

PAQ Publishing is configured as a single `companies` row (`19af11f1-...`) with `company_type = 'publishing_firm'` and `subscription_tier = 'enterprise'`. They have one child company record: "Tzurel Halfon pka Zuri / PAQ" (`4cd3ca5c-...`) configured as `client_label` with `parent_company_id` pointing back to PAQ. No contracts, copyrights, or royalty allocations have been created for either entity yet -- this is a greenfield configuration.

### What the Current Architecture Supports

The system already has several building blocks that partially cover PAQ's needs:

| Requirement | Current Support | Gap? |
|---|---|---|
| Multiple entities under one enterprise account | `parent_company_id` on `companies` table supports parent-child hierarchy | Hierarchy is only 2 levels (parent + client labels), not parent + publishing entities + client labels |
| Contracts scoped to an entity | `client_company_id` on `contracts` table | Exists, but only distinguishes company-level, not publishing entity within a company |
| Royalty scoping | `client_company_id` on `royalty_allocations` | Same limitation as contracts |
| Copyrights scoping | `client_company_id` on `copyrights` | Same limitation |
| Payee scoping | `client_company_id` on `payees` | Same limitation |
| Administrator tracking | `administrator` text field on `contracts` | Free-text, not relational -- cannot filter/aggregate by administrator reliably |
| Recoupment tracking | `recoupment_status` on contracts, `advance_amount`, `work_specific_advance` on schedule works | Flat -- no entity-level advance ledger or isolation |
| Role-based access | `company_users.role` (admin/user/client), `user_roles` table | No entity-scoped roles |
| Audit logging | `copyright_activity_logs`, `payout_workflow_history` | Adequate, no changes needed |
| Consolidated reporting | No dedicated aggregation layer | Gap -- no roll-up logic |

### Key Finding

The current `client_company_id` pattern was designed for ENCORE managing multiple sub-account *companies*. PAQ's situation is different: they are *one company* with multiple *publishing entities* internally. The existing hierarchy model would force PAQ to create each publishing entity as a separate child `companies` record, which:

- Fragments their user management (users would need membership in multiple companies)
- Breaks consolidated reporting (no built-in parent roll-up)
- Creates unnecessary subscription/billing complexity
- Does not model the real-world structure (these are not separate companies -- they are imprints/entities under one umbrella)

---

## Recommended Architecture

### Principle: Minimal Structural Change

Introduce a single new table (`publishing_entities`) and add one nullable foreign key column (`publishing_entity_id`) to the tables that need entity-level scoping. Everything else stays as-is.

### A. Data Model Enhancements

#### New Table: `publishing_entities`

```text
publishing_entities
--------------------------------------------
id                  uuid (PK, default gen_random_uuid())
company_id          uuid (FK -> companies.id, NOT NULL)
name                text (NOT NULL)  -- e.g., "PAQ Publishing"
display_name        text
administrator       text  -- "Kobalt", "EMPIRE Publishing", "Self-Administered"
administrator_type  text  -- "third_party", "self", "co_admin"
ipi_number          text
cae_number          text
pro_affiliation     text
territory           text[]
status              text (default 'active')
metadata            jsonb (default '{}')
created_at          timestamptz (default now())
updated_at          timestamptz (default now())
```

This table sits *below* the `companies` table. One company can have many publishing entities. Each entity has its own administrator.

#### New Columns on Existing Tables

| Table | New Column | Type | Purpose |
|---|---|---|---|
| `contracts` | `publishing_entity_id` | uuid, nullable, FK | Ties a contract to a specific entity |
| `copyrights` | `publishing_entity_id` | uuid, nullable, FK | Ties a work to a specific entity |
| `royalty_allocations` | `publishing_entity_id` | uuid, nullable, FK | Ties royalty income to an entity |
| `payees` | `publishing_entity_id` | uuid, nullable, FK | Ties a payee to an entity |
| `payout_expenses` | `publishing_entity_id` | uuid, nullable, FK | Ties expenses/advances to an entity |
| `reconciliation_batches` | `publishing_entity_id` | uuid, nullable, FK | Ties statement batches to an entity |
| `contract_interested_parties` | (no change) | -- | Already scoped by contract_id |
| `contract_schedule_works` | (no change) | -- | Already scoped by contract_id |

All new columns are nullable to maintain backward compatibility. Existing records without a `publishing_entity_id` continue to function as they do today.

#### Hierarchy Model

```text
companies (PAQ Publishing - enterprise)
  |
  +-- publishing_entities
  |     |-- "PAQ Publishing" (admin: Kobalt)
  |     |-- "PAQ Publishing" (admin: EMPIRE)
  |     |-- "PAQ Publishing" (admin: Self)
  |     +-- (future entities)
  |
  +-- companies (child: "Tzurel Halfon pka Zuri")
        (client_label, parent_company_id -> PAQ)
```

### B. Recoupment and Ledger Structure

#### New Table: `entity_advance_ledger`

```text
entity_advance_ledger
--------------------------------------------
id                      uuid (PK)
publishing_entity_id    uuid (FK -> publishing_entities.id, NOT NULL)
company_id              uuid (FK -> companies.id, NOT NULL)
contract_id             uuid (FK -> contracts.id, nullable)
advance_type            text  -- "initial", "additional", "minimum_guarantee"
advance_amount          numeric (NOT NULL)
recouped_amount         numeric (default 0)
balance_remaining       numeric (generated or trigger-maintained)
effective_date          date
notes                   text
status                  text  -- "active", "fully_recouped", "written_off"
created_at              timestamptz
updated_at              timestamptz
```

**Isolation rules:**
- Royalty income tagged with `publishing_entity_id = X` can only recoup advances where `publishing_entity_id = X`
- The `contract_id` column allows advance-to-contract linkage for auditing
- Cross-entity recoupment is prevented by enforcing entity ID match in the recoupment function
- The existing `recoupment_status` on `contracts` remains as a summary flag; the ledger becomes the source of truth

#### Recoupment Processing Logic

```text
When royalty income is allocated:
1. Check publishing_entity_id on the royalty allocation
2. Query entity_advance_ledger WHERE publishing_entity_id matches AND status = 'active'
3. Apply income against oldest unrecouped advance (FIFO)
4. Update recouped_amount and balance_remaining
5. If balance_remaining <= 0, set status = 'fully_recouped'
```

### C. Reporting Layer

#### Entity-Level Reporting
- Filter all existing queries by `publishing_entity_id`
- Revenue by entity, expenses by entity, net position by entity
- No new tables needed -- queries add a WHERE clause

#### Administrator-Level Reporting
- Filter by `publishing_entities.administrator`
- Shows all entities administered by Kobalt, EMPIRE, etc.
- Useful for reconciling administrator statements against ENCORE data

#### Parent-Level Consolidated Dashboard
- New database view or function:

```text
get_company_consolidated_report(company_id uuid)
  -> Aggregates across all publishing_entities for that company
  -> Returns: total revenue, total advances outstanding, total recouped,
     net position, entity-by-entity breakdown
```

This leverages the existing `company_id` on `publishing_entities` to roll everything up.

### D. Permission Architecture

#### Entity-Scoped Access Table

```text
entity_user_access
--------------------------------------------
id                      uuid (PK)
publishing_entity_id    uuid (FK -> publishing_entities.id)
user_id                 uuid (FK -> auth.users.id)
access_level            text  -- "admin", "contributor", "viewer"
created_at              timestamptz
```

**Access rules:**
- **Executive (company admin)**: Sees all entities. No row in `entity_user_access` needed -- access derived from `company_users.role = 'admin'`.
- **Entity Admin**: Full access to one or more specific entities. Has rows in `entity_user_access` with `access_level = 'admin'`.
- **Contributor**: Can view/edit contracts and works for specific entities. `access_level = 'contributor'`.
- **Viewer**: Read-only access to specific entity data. `access_level = 'viewer'`.

**RLS enforcement pattern:**

```text
-- User can see data if:
-- 1. They are a company admin (existing company_users check), OR
-- 2. They have entity_user_access for the row's publishing_entity_id
```

### E. Migration Strategy for PAQ

#### Phase 1: Schema (Week 1)
1. Create `publishing_entities` table with RLS
2. Add `publishing_entity_id` nullable FK to contracts, copyrights, royalty_allocations, payees, payout_expenses, reconciliation_batches
3. Create `entity_advance_ledger` table with RLS
4. Create `entity_user_access` table with RLS
5. Create indexes on all new FK columns

#### Phase 2: PAQ Entity Configuration (Week 1)
1. Insert publishing entity records for PAQ:
   - "PAQ / Kobalt" (administrator: Kobalt)
   - "PAQ / EMPIRE" (administrator: EMPIRE Publishing)
   - "PAQ / Self-Administered" (administrator: Self)
2. No backfill needed since PAQ has zero contracts/works currently

#### Phase 3: UI Integration (Weeks 2-3)
1. Add entity selector to contract creation flow
2. Add entity filter to contracts list, copyrights list, royalty views
3. Add entity-level dashboard widgets to sub-account detail page
4. Add consolidated parent-level report view
5. Add entity management UI (create/edit entities) in account settings

#### Phase 4: Recoupment Engine (Week 3)
1. Implement advance ledger entry UI
2. Implement entity-scoped recoupment processing function
3. Add recoupment balance display per entity

---

## Risk Considerations

| Risk | Mitigation |
|---|---|
| Existing sub-accounts without entities see no disruption | All new columns are nullable; existing queries continue to work without entity filtering |
| Entity deletion with linked data | Soft-delete via `status` field; FK constraints prevent hard deletion |
| Performance with additional JOINs | Indexed FK columns; publishing_entities is a small table (typically under 20 rows per company) |
| Accidental cross-entity recoupment | Database-level enforcement in recoupment function, not just UI |

## What NOT to Change

- **`companies` table structure** -- no modifications needed
- **`company_users` table** -- existing roles remain intact
- **`client_company_id` columns** -- keep for ENCORE-level sub-account scoping; `publishing_entity_id` operates at a different level
- **Existing RLS policies** -- augment, don't replace
- **Payee hierarchy** (Agreement -> OP -> Writer -> Payee) -- unchanged
- **CWR/PRO integration** -- unchanged
- **Client portal system** -- unchanged
- **Module access system** -- unchanged

## Scalability Assessment

This pattern scales to any enterprise client with multiple imprints, sub-publishers, or administered catalogs. The `publishing_entities` table is generic enough to model:
- A label group with multiple imprints
- A publisher with territory-specific sub-entities
- A management company with multiple administered catalogs
- Joint ventures where one company administers another's catalog

The nullable FK approach means adoption is opt-in per client. Non-enterprise accounts never interact with entity-level features.

