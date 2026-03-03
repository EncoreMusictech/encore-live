

## Merge/Unmerge Interested Parties with Hierarchy Link

### Problem
Duplicate interested parties exist on contracts (e.g., "Ayoola Ogundeyi" at 0% and "Ayoola Olatokunbo Ogundeyi" at 12.5%). Users need to consolidate these under a primary party for royalty calculation purposes, but must be able to reverse the action.

### Key Requirements (revised from previous plan)
1. **Primary party's percentages are adopted** -- no summing of splits
2. **Secondary parties are NOT deleted** -- instead, a parent-child link is created
3. **Unmerge** is supported to restore the original independent state
4. **Downstream impact on "Build Payees from Agreement"** must be understood

### Database Change

Add two columns to `contract_interested_parties`:

```sql
ALTER TABLE public.contract_interested_parties
  ADD COLUMN merged_into_id UUID REFERENCES public.contract_interested_parties(id) ON DELETE SET NULL,
  ADD COLUMN merged_at TIMESTAMPTZ;
```

- `merged_into_id`: points to the primary party this record is subordinate to (NULL = independent/primary)
- `merged_at`: timestamp of when the merge occurred (NULL = not merged)

No records are deleted. A merged (secondary) party is simply marked with `merged_into_id` pointing to the chosen primary.

### UI Changes

**`InterestedPartiesTable.tsx`**
- Add checkboxes for multi-select on each row
- "Merge Selected" button appears when 2+ parties are checked
- Opens `MergePartiesDialog` showing selected parties with radio buttons to pick the primary
- Merged (secondary) rows are visually indented/dimmed with a "Linked to: [Primary Name]" badge and an "Unmerge" button
- Merged rows are hidden from the main table by default (toggle to show them)

**New: `MergePartiesDialog.tsx`**
- Shows selected parties side-by-side
- Radio group to choose primary party
- Preview: "The primary party's splits will be used for all royalty calculations. Secondary parties will be linked but retained."
- On confirm: sets `merged_into_id` on all non-primary selected parties

**Unmerge action**
- Available on each merged (secondary) row
- Clears `merged_into_id` and `merged_at`, restoring the party as independent

### Hook Changes (`useContracts.ts`)

Add two functions:
- `mergeInterestedParties(primaryId, secondaryIds[])` -- updates secondary records with `merged_into_id = primaryId, merged_at = now()`
- `unmergeInterestedParty(partyId)` -- sets `merged_into_id = null, merged_at = null`

### Impact on "Build Payees from Agreement"

**Current behavior**: `AutoBuildPayeesDialog` queries `contract_interested_parties` where `party_type = 'writer'` and creates a writer + payee for every row. This is what causes duplicate payees.

**New behavior**: The query will add a filter: `.is('merged_into_id', null)` -- only independent/primary parties are used to build payees. Secondary (merged) parties are skipped entirely since their royalty rights are represented by the primary party.

This means:
- The primary party's name, splits (performance/mechanical/synch), and contact info are used for the payee
- No duplicate payees are created for secondary parties
- If a user later unmerges, the restored party becomes eligible for payee creation on the next "Build Payees" run

The same filter is applied in `RoyaltyAllocationForm.tsx` and `PayeeFormDialog.tsx` wherever `contract_interested_parties` are queried for royalty calculations.

### Files to Create/Modify
- **Migration**: Add `merged_into_id` and `merged_at` columns
- **Create**: `src/components/contracts/MergePartiesDialog.tsx`
- **Modify**: `src/components/contracts/InterestedPartiesTable.tsx` (checkboxes, merge button, merged row display, unmerge button)
- **Modify**: `src/hooks/useContracts.ts` (add merge/unmerge functions)
- **Modify**: `src/components/royalties/AutoBuildPayeesDialog.tsx` (filter out merged parties)
- **Modify**: `src/components/royalties/PayeeFormDialog.tsx` (filter out merged parties)
- **Modify**: `src/components/royalties/RoyaltyAllocationForm.tsx` (filter out merged parties)

