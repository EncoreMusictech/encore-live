

## Add CSV Upload to Migration Tracker

### What
Add a "Upload CSV" button next to the existing "Add Writer(s)" button in the Migration Tracker. When an admin uploads a CSV matching the PRO List format, it parses the rows and inserts them into `migration_tracking_items` for the current sub-account.

### CSV Format (auto-detected from the PRO List)
```text
Entity, Administrator, Original Publisher, Writer, Contract Entered, Copyrights Entered, Schedules Attached to Contract, Payees Created, Contract Terms Confirmed, Payee Splits Confirmed, Beginning Balance Entered, Client Portal Created, Client Assets Granted
```
Boolean columns use `TRUE`/`FALSE` strings.

### Implementation

**Create `src/components/admin/subaccount/ImportMigrationCsvDialog.tsx`**
- Dialog with a file input (`.csv` only) and a drag-drop zone
- On file select: parse CSV using PapaParse (already installed)
- Map headers to `migration_tracking_items` columns using an alias map (e.g., `"Schedules Attached to Contract"` → `schedules_attached`)
- Convert `TRUE`/`FALSE` strings to booleans
- Show a preview table: row count, entity breakdown, sample rows
- "Import" button inserts all rows with `company_id` set to the current sub-account
- Duplicate handling: skip rows where `writer_name` + `entity_name` already exist for this company (query existing items before insert, filter client-side)
- On success: call `onAdded()` to refresh the tracker

**Modify `MigrationTracker.tsx`**
- Import and render `<ImportMigrationCsvDialog>` in the controls bar next to the existing buttons
- Pass `companyId`, `entities`, and `onAdded={fetchItems}`

### Files
- **Create**: `src/components/admin/subaccount/ImportMigrationCsvDialog.tsx`
- **Modify**: `src/components/admin/subaccount/MigrationTracker.tsx` — add import button

