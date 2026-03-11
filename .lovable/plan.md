

## Internal Migration Tracker — Built into Sub-Account Detail Page

Instead of requiring a CSV upload, ENCORE admins would build and maintain the migration tracker directly within each sub-account's detail page. Here's the recommended approach:

### Where It Lives

A new **"Migration Tracker"** tab on the `SubAccountDetailPage` (visible only to ENCORE admins), sitting alongside the existing Onboarding, Contracts, Works, and Entities tabs. This is the natural place — it's already scoped to a specific sub-account (`companyId`).

### How It Works

**1. Same `migration_tracking_items` table**, but populated via UI instead of CSV:

```text
migration_tracking_items
├── company_id (FK → companies)
├── entity_name        ← dropdown populated from company's publishing_entities
├── administrator      ← text or dropdown
├── original_publisher ← text or dropdown  
├── writer_name        ← text input (the contract/writer row label)
├── 9 boolean checkpoints (contract_entered, copyrights_entered, etc.)
```

**2. ENCORE admin workflow:**
- Navigate to Sub-Account Detail → "Migration Tracker" tab
- Click "Add Writer" to create a new tracking row (entity, publisher, writer name — all checkpoints default FALSE)
- Bulk-add option: paste a list of writer names + select entity/publisher, creates multiple rows at once
- Toggle checkpoints as migration progresses (each toggle updates the DB immediately)
- Auto-populate from existing data: a "Sync from DB" button that scans the sub-account's `contracts`, `copyrights`, `contract_schedule_works`, and `payees` tables to auto-check applicable checkpoints

**3. The Analytics Dashboard** (in `OnboardingPipelineManager` analytics tab) then queries `migration_tracking_items` for the selected sub-account and displays the same completeness metrics — it doesn't care whether the data came from CSV or was entered manually.

### Key UI Components

- **`MigrationTracker`** — the main tab component with an editable table of writer rows, grouped by entity. Inline checkbox toggles for each checkpoint. Add/delete row controls. Filter by entity.
- **`MigrationTrackerRow`** — single writer row with 9 checkbox cells + entity/publisher/writer fields (editable inline or via popover)
- **`AddWriterDialog`** — form to add one or multiple writers (entity dropdown, publisher input, writer name textarea for bulk entry)
- **`SyncFromDatabaseButton`** — reads live DB tables and auto-checks checkpoints where data exists (e.g., if a contract exists for this writer, mark `contract_entered = true`)

### Auto-Sync Logic (the "Sync from DB" feature)

For each tracking row, cross-reference:
- `contract_entered` → check `contracts` where `counterparty_name ILIKE writer_name` and `client_company_id = companyId`
- `copyrights_entered` → check `contract_schedule_works` joined to `copyrights` for that contract
- `schedules_attached` → check `contract_schedule_works` count > 0 for that contract
- `payees_created` → check `payees` where `payee_name ILIKE writer_name` and matches company hierarchy

This gives admins a one-click way to reconcile the tracker against reality without manually checking each box.

### Files

- **Create**: `src/components/admin/subaccount/MigrationTracker.tsx` — main tracker component
- **Create**: `src/components/admin/subaccount/AddWriterDialog.tsx` — add writer(s) dialog
- **Modify**: `src/pages/SubAccountDetailPage.tsx` — add Migration Tracker tab (ENCORE admin only)
- **Migration**: Create `migration_tracking_items` table with RLS (ENCORE team read/write)
- **Modify**: `src/components/operations/phase6/OnboardingPipelineManager.tsx` — analytics tab queries this table for the selected company

### Comparison: CSV vs Internal Tracker

| | CSV Import | Internal Tracker |
|---|---|---|
| Initial setup | Upload spreadsheet | Add writers manually or bulk-paste |
| Updates | Re-upload or manual DB edits | Toggle checkboxes in UI |
| Auto-reconciliation | Manual comparison | "Sync from DB" button |
| Audit trail | None | `updated_at` timestamps per row |
| Multi-user | Spreadsheet conflicts | Real-time, scoped by sub-account |

The internal tracker is strictly better for ongoing use. CSV import could still be offered as a "bootstrap" option (upload a CSV to populate the tracker initially), but the day-to-day workflow would be the in-app tracker.

