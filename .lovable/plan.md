

## Contract-Compliant Royalty Calculation Engine

### Problem

The current royalty engine in `usePayouts.ts` and `useAgreementCalculation.ts` incorrectly deducts `commission_percentage` from gross royalties instead of allocating royalties by contractual ownership splits (`performance_percentage`, `mechanical_percentage`, `synch_percentage`) defined on `contract_interested_parties`. The system also lacks revenue type classification, splits at import time instead of payout time, does not enforce territory eligibility, and has no per-right-type royalty readiness validation.

### Current State Summary

- **`royalty_allocations`**: No `revenue_type` column. Revenue info is in freetext `revenue_source` / `media_type` fields. Territory stored in `country` column.
- **`contracts`**: No `contract_deal_model` column. Has `commission_percentage`, `advance_amount`, `territories[]` (text array, currently empty on all contracts), `controlled_percentage`.
- **`contract_interested_parties`**: Has `performance_percentage`, `mechanical_percentage`, `synch_percentage`, `controlled_status`, `party_type`. Not used during payout calculation.
- **`payout_royalties`**: Only has `allocated_amount`, `payout_id`, `royalty_id`. No audit snapshot columns.
- **`entity_advance_ledger`**: Already exists with `advance_amount`, `recouped_amount`, `balance_remaining`, `contract_id`. Can be leveraged for cumulative recoupment tracking.
- **`calculatePayoutTotals`** (usePayouts.ts L457-654): Uses `commission_percentage` as a deduction: `net = gross - (gross * commission%)`. Also fetches ALL allocations for the user in the period with no scoping to contract/payee.
- **`calculateAgreementBasedRoyalties`** (useAgreementCalculation.ts L236-329): Same commission deduction pattern. Also unscoped.
- **`getAgreementWriters`** (useAgreementCalculation.ts L191-233): Filters to `party_type = 'writer'` only. Determines controlled status via a workaround that queries `royalty_allocations` instead of reading `controlled_status` directly from the interested party record.
- **`useRoyaltySplitting`**: Splits allocations at import time by creating new DB rows and marking originals. Should be deferred to payout stage.
- **`validate_royalty_splits`** DB function: Validates 6 right types (`performance`, `mechanical`, `synch`, `print`, `grand_rights`, `karaoke`) but uses exact `= 100` with no tolerance.
- **`territoryNormalizer.ts`**: Already exists at `src/utils/territoryNormalizer.ts`. Normalizes country names to ISO 2-letter codes.

---

### Phase 1: Database Schema Migration

Single migration adding all schema changes.

**1a. `revenue_type` column on `royalty_allocations`**

```sql
ALTER TABLE public.royalty_allocations
  ADD COLUMN revenue_type text
  CHECK (revenue_type IN ('performance', 'mechanical', 'synch', 'other'));
```

- NULL = unclassified ("unallocatable" until classified)
- Uses `'synch'` (not `'sync'`) to align with `synch_percentage` on `contract_interested_parties`

**1b. `contract_deal_model` column on `contracts`**

```sql
ALTER TABLE public.contracts
  ADD COLUMN contract_deal_model text DEFAULT 'ownership_split'
  CHECK (contract_deal_model IN ('ownership_split', 'commission_only'));
```

- `ownership_split`: allocate using interested party splits (default)
- `commission_only`: deduct `commission_percentage` from gross
- No `hybrid` option -- without explicit contract language, hybrid logic risks double-charging

**1c. Audit columns on `payout_royalties`**

```sql
ALTER TABLE public.payout_royalties
  ADD COLUMN revenue_type text,
  ADD COLUMN party_id uuid REFERENCES contract_interested_parties(id),
  ADD COLUMN party_role text,
  ADD COLUMN split_percentage numeric(7,4),
  ADD COLUMN controlled_status text,
  ADD COLUMN contract_id uuid REFERENCES contracts(id),
  ADD COLUMN ownership_snapshot jsonb;
```

- `party_id` is the FK (not `party_name`) for audit integrity. Party name is denormalized into `ownership_snapshot` for readability.

**1d. Update `validate_royalty_splits` function**

- Apply +/-0.01 tolerance: `total_percentage BETWEEN 99.99 AND 100.01`
- Applies to all 6 right types already validated by the function (`performance`, `mechanical`, `synch`, `print`, `grand_rights`, `karaoke`)
- Validation checks the sum across ALL interested parties per right type, not only controlled parties. Controlled share may be less than 100%.

---

### Phase 2: Revenue Type Classifier Utility

**New file: `src/utils/revenueTypeClassifier.ts`**

Maps `revenue_source`, `media_type`, and `media_sub_type` fields from imported statements to one of: `performance`, `mechanical`, `synch`, `other`.

Classification rules:
- "Performance" / "Performing" / "Public Performance" -> `performance`
- "Mechanical" / "Mechanicals" / "Reproduction" -> `mechanical`
- "Sync" / "Synchronization" / "Synch" -> `synch` (all map to `synch`)
- Everything else -> `other`
- Unmappable -> `null` (flagged for manual classification)

---

### Phase 3: Import Enhancement

**File: `src/hooks/useImportToAllocations.ts`**

Update import mapping to:
1. Call revenue type classifier on `REVENUE SOURCE` and `MEDIA TYPE` fields
2. Set `revenue_type` on each allocation record
3. If unclassifiable, set `revenue_type = null` and add flag in `comments`
4. Preserve `country` field as territory identifier (already mapped)

Territory note: `contracts.territories[]` may store ISO codes, country names, or groups like "Worldwide". Use `territoryNormalizer.ts` to normalize allocation `country` values to ISO 2-letter codes before comparison. If `contracts.territories` is empty or `'{}'`, treat as "Worldwide" (all territories eligible).

---

### Phase 4: Rewrite Agreement Calculation Engine

**File: `src/hooks/useAgreementCalculation.ts`** -- Major rewrite

**4a. Rename `getAgreementWriters` to `getAgreementParties`**
- Remove `.eq('party_type', 'writer')` filter -- fetch ALL party types (writers, publishers, administrators)
- Read `controlled_status` directly from `contract_interested_parties` instead of the current workaround that queries `royalty_allocations`
- Return all parties with their `controlled_status` for audit; filter to controlled-only for payable amounts downstream

**4b. Update `ContractWriter` interface to `ContractParty`**

```typescript
export interface ContractParty {
  id: string;
  name: string;
  party_type: string;
  performance_percentage: number;
  mechanical_percentage: number;
  synch_percentage: number;
  controlled_status: string; // 'C', 'NC', etc.
}
```

**4c. Update `AgreementCalculationResult` interface**

```typescript
export interface PartyBreakdown {
  party_id: string;
  party_name: string;
  party_type: string;
  revenue_type: string;
  gross_share: number;
  recoupment_applied: number;
  net_payable: number;
  controlled_status: string;
  split_percentage: number;
}

export interface AgreementCalculationResult {
  gross_royalties: number;
  total_expenses: number;
  net_payable: number;
  advance_recoupment: number;
  territory_exclusions: number;
  unallocatable_amount: number;
  party_breakdowns: PartyBreakdown[];
  calculation_method: 'agreement_based' | 'manual';
  agreement_id?: string;
  contract_deal_model: string;
}
```

- Remove `commission_deduction` (only relevant for `commission_only` deals, tracked in party breakdowns)
- Remove `net_royalties` (replaced by per-party `net_payable`)
- Add `party_breakdowns` for per-party, per-right-type audit

**4d. Replace `calculateAgreementBasedRoyalties`**

```text
For each royalty allocation in the period:
  1. Skip if revenue_type is NULL (add to unallocatable_amount)
  2. Territory check:
     - Normalize allocation.country using territoryNormalizer.ts
     - If contract.territories is empty/null -> treat as Worldwide (eligible)
     - If contract.territories is non-empty and normalized country not in list -> skip (add to territory_exclusions)
  3. Based on contract_deal_model:
     - "ownership_split" (default):
         Fetch all interested parties
         For each party:
           party_payout = gross * (party_split_for_revenue_type / 100)
         Only parties with controlled_status = 'C' receive payable amounts
         Non-controlled parties included in ownership_snapshot for audit
     - "commission_only":
         net = gross - (gross * commission_percentage / 100)
         (Only when no ownership splits exist or contract explicitly flagged)
  4. Store ownership_snapshot on payout_royalties
```

---

### Phase 5: Update Payout Totals Calculation

**File: `src/hooks/usePayouts.ts`** -- `calculatePayoutTotals` (L457-654)

**Critical scoping fix**: Currently fetches ALL `royalty_allocations` for the user in the period with no filtering by contract, payee, or work. This inflates gross totals when multiple payees exist.

Changes:
1. When `agreementId` is provided, scope allocations to works linked to that contract (via `contract_schedule_works` or `copyright_id` linkage)
2. Fetch the contract and its `contract_deal_model`
3. If `ownership_split`: fetch interested parties, group allocations by `revenue_type`, apply per-right splits
4. If `commission_only`: keep existing commission deduction logic
5. Apply recoupment AFTER share allocation (not before) -- see Phase 8
6. Return per-party breakdown in results

---

### Phase 6: Move Splitting to Payout Stage

**File: `src/hooks/useRoyaltySplitting.ts`**
- Keep existing functions for backward compatibility
- Stop calling `autoSplitIfNeeded` during import
- Splitting now happens in the payout calculation (Phases 4-5)

**File: `src/hooks/useWriterPayouts.ts`**
- Update `processBatchToWriterPayouts` to:
  1. Keep allocations at work level (no splitting during import)
  2. During payout: look up contract -> interested parties -> apply per-right splits using `revenue_type`
  3. Fetch ALL writers (C and NC) for the ownership snapshot
  4. Filter to controlled-only (C) for payable amounts
  5. Create `payout_royalties` records with `ownership_snapshot`, `party_id`, `split_percentage`, `revenue_type`, `contract_id`, `controlled_status`

Writer-level payouts must use the same per-right-type allocation logic as agreement payouts, not aggregated gross.

---

### Phase 7: Royalty Ready Validation

**File: `src/components/admin/subaccount/BulkContractImport.tsx`**

Update `royaltyReady` check:
- Call `validate_royalty_splits` RPC for each contract
- Validate totals across ALL parties per right type (not per row, not only controlled parties)
- All 6 right types must sum to 100% (+/-0.01 tolerance)
- Contracts that fail are flagged as not royalty-ready and excluded from payout calculations

---

### Phase 8: Recoupment After Allocation

Update calculation order in `usePayouts.ts` and `useAgreementCalculation.ts`:

1. Allocate revenue by ownership split -> per-party amounts
2. Apply recoupment against the party's allocated share (not the contract's pooled gross)
3. `party_net_payable = max(0, party_gross_share - recoupable_expenses)`
4. Track cumulative recoupment per payee per contract using the existing `entity_advance_ledger` table (has `advance_amount`, `recouped_amount`, `balance_remaining`, `contract_id`)
5. Each payout run updates `recouped_amount` and `balance_remaining` on the ledger

This prevents multi-party deals from being mis-recouped (recoupment reduces the specific payee's share, not the contract-level pool).

---

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | Schema changes (revenue_type, contract_deal_model, payout_royalties audit cols, validate_royalty_splits tolerance) |
| `src/utils/revenueTypeClassifier.ts` | New -- maps statement fields to revenue_type |
| `src/hooks/useImportToAllocations.ts` | Add revenue_type classification during import |
| `src/hooks/useAgreementCalculation.ts` | Rewrite: ownership splits by revenue type, fetch all party types, new interfaces |
| `src/hooks/usePayouts.ts` | Update calculatePayoutTotals: scoping fix, ownership-split model, recoupment after allocation |
| `src/hooks/useWriterPayouts.ts` | Move splitting to payout stage, per-right-type logic, audit snapshots |
| `src/hooks/useRoyaltySplitting.ts` | Deprecate import-time auto-splitting |
| `src/hooks/useRoyaltyAllocations.ts` | Add revenue_type to interface |
| `src/components/admin/subaccount/BulkContractImport.tsx` | Update royaltyReady validation |
| `src/utils/territoryNormalizer.ts` | Leverage existing utility for territory comparison |

### Implementation Order

1. Database migration (schema additions + validate_royalty_splits tolerance)
2. Revenue type classifier utility
3. Import enhancements (revenue_type classification)
4. Agreement calculation engine rewrite (core logic, interfaces, party fetching)
5. Payout totals update (scoping fix + ownership-split model)
6. Writer payouts refactor (split at payout time with audit snapshots)
7. Royalty ready validation update
8. Recoupment ordering fix (per-party, using entity_advance_ledger)

