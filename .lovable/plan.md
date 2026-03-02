
# Bulk Contract Import: Duplicate Detection with Update Prompt

## Problem
Currently, when a bulk contract import template contains a contract that already exists (matched by title + counterparty + type), the system silently skips it and reports "X duplicate contracts were skipped." The user has no way to update existing contract terms via bulk import.

## Solution
Add a duplicate detection step during validation that identifies matching contracts in the database, then present the user with a clear choice for each duplicate: **update the existing contract** or **skip it**. New contracts proceed as normal.

## Implementation Steps

### 1. Enhanced Validation with Duplicate Detection
During `validateAndPreview()`, after parsing rows, query the `contracts` table for this company to find matches. For each parsed row, check if a contract with the same `title + counterparty_name + contract_type` already exists. Mark matched rows with a `duplicate` status and store the existing contract's `id`.

### 2. New State & UI for Duplicate Resolution
- Add a `duplicateAction` field to `ParsedRow`: `'update' | 'skip' | 'new'`
- Add an `existingContractId` field to store the matched contract ID
- In the validation preview table, show a new "Status" column indicating "New", "Duplicate - Update", or "Duplicate - Skip"
- Add toggle controls (e.g., a dropdown or button) on each duplicate row so the user can choose update vs. skip
- Add a "Select All Duplicates" toggle to bulk-set all duplicates to update or skip

### 3. Updated Import Logic
Modify `handleImport()` to handle three cases per row:
- **New** (`duplicateAction === 'new'`): Create contract as before (current behavior)
- **Update** (`duplicateAction === 'update'`): Use `supabase.from('contracts').update(...)` on the existing contract ID to update terms (title, dates, advance, commission, territories, financial_terms, etc.). Also upsert interested parties and schedule works.
- **Skip** (`duplicateAction === 'skip'`): Skip as before

### 4. Results Summary Update
- Add an "Updated" count to the results summary alongside Success/Failed/Skipped
- Show a card for updated contracts in the results grid

## Technical Details

**Files to modify:**
- `src/components/admin/subaccount/BulkContractImport.tsx` -- all changes are in this single file

**ParsedRow interface additions:**
```text
duplicateAction: 'new' | 'update' | 'skip'
existingContractId?: string
```

**Duplicate detection query (during validation):**
Fetch existing contracts for the company with `select('id, title, counterparty_name, contract_type')` and build a lookup map keyed by `title|counterparty|type` (lowercased). During row parsing, check each row against this map.

**Update logic for duplicates marked as "update":**
- Update the `contracts` row: `supabase.from('contracts').update({...fields}).eq('id', existingContractId)`
- Delete and re-insert interested parties and schedule works for that contract to reflect the new import data
- This ensures a clean replacement of terms from the spreadsheet

**Validation table UI changes:**
- Add a column showing "New" (green badge), "Duplicate" (amber badge with update/skip toggle)
- Duplicate rows get an inline button group: "Update" / "Skip"
- A top-level action to "Update All Duplicates" or "Skip All Duplicates"
