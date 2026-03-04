

## How Royalty Rates Are Applied

The royalty split percentages on the Interested Parties table (Performance %, Mechanical %, Synch %) determine how incoming royalty revenue is distributed to each party during payout generation:

1. **Revenue Classification**: Each royalty allocation is classified by type (performance, mechanical, synch, other) using the revenue type classifier.
2. **Split Application**: When payouts are calculated, the system looks up interested parties for the contract and applies the corresponding percentage for that revenue type. For example, if a $1,000 performance royalty comes in and Writer A has `performance_percentage = 50%`, they receive $500.
3. **Controlled vs Non-Controlled**: Only "Controlled" (C) parties generate payable outputs. Non-Controlled parties are recorded for audit but don't produce payouts.
4. **Validation**: The system validates that all party splits for each right type sum to 100% (within tolerance) before payouts can be processed.

## Plan: Make Royalty Rates Inline-Editable

Currently the percentage cells are read-only text. The plan is to make them editable directly in the table row.

### Changes to `src/components/contracts/InterestedPartiesTable.tsx`

1. **Add inline editing state**: Track which party row is being edited and its pending values.

2. **Replace static percentage cells** (lines 424-426) with editable `Input` fields:
   - Each cell becomes a number input (0-100) that updates on change.
   - Include a small save/cancel button set per row, or auto-save on blur.

3. **Add an `handleUpdateParty` function** that calls:
   ```ts
   await supabase
     .from('contract_interested_parties')
     .update({ performance_percentage, mechanical_percentage, synch_percentage, ... })
     .eq('id', partyId);
   ```

4. **Add an edit toggle per row** in the Actions column (pencil icon) that switches between view and edit mode for that row. On save, persist to Supabase and refresh.

5. **Also allow editing**: `controlled_status` and `party_type` inline via dropdowns when in edit mode.

6. **Add a brief explanation** in the `CardDescription` or as a tooltip explaining how these percentages drive royalty payouts.

### Files Modified
- `src/components/contracts/InterestedPartiesTable.tsx` — add inline editing for percentage fields, controlled status, and party type with save/cancel per row.

