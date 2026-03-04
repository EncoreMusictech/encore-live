

## Updated Plan: Contract-Compliant Split Resolution and Payout Engine Update

All 7 fixes applied. Changes from the previous revision are marked with **[FIX]**.

---

### Phase 1: Schema Migration

**1a.** Create `contract_work_interested_parties` table (unchanged from prior revision).

**1b.** Add 4 nullable columns to `royalty_allocations`: `contract_schedule_work_id` (FK), `line_type`, `revenue_type_confidence`, `rights_basis`.

**1c. Guardrail validation trigger** — `BEFORE INSERT OR UPDATE` on `royalty_allocations`. **[FIX 1]** The trigger validates, when not null:

- `revenue_type` in `{performance, mechanical, synch, other}`
- `line_type` in `{royalty, fee, adjustment, withholding, recoupment}`
- `revenue_type_confidence` in `{high, medium, low}`
- `rights_basis` in `{ownership_split_by_right_type, exclude_from_splits}`

---

### Phase 2: New Utilities

**`src/utils/isControlled.ts`** — Returns `true` when `controlled_status` is in `['C', 'Controlled', 'Y']` (case-insensitive).

**`src/utils/resolveOwnershipSplits.ts`** — `resolveOwnershipSplits(contractId, contractScheduleWorkId?)`:
- workId null → `contract_interested_parties` → `split_source: 'contract'`
- workId exists → check `inherits_royalty_splits`: true → contract-level; false/null → check `contract_work_interested_parties` → rows found = `'work'`, else fallback to contract-level
- Normalize null percentages to 0, validate perf/mech/synch sums = 100% (±0.01) across ALL parties
- Return `{ parties: ResolvedParty[], split_source, valid, errors }`

---

### Phase 3: Update `src/hooks/useAgreementCalculation.ts`

**Interface additions:** `PartyBreakdown` gets `split_source`, `calculated_amount`, `is_controlled`. `AgreementCalculationResult` gets `excluded_total`, `unpayable_total`, `needs_review_total`, plus detail arrays.

In `calculateAgreementBasedRoyalties` (lines ~270-460):

1. **[FIX 2]** Schedule works query selects `id, copyright_id, inherits_royalty_splits, created_at` and is filtered by `contract_id`.

2. Pre-build maps:
   - `copyrightToWorkMap: Map<string, string>` — deterministic: prefer `inherits_royalty_splits = false`, then latest `created_at`; log warning on duplicates
   - **[FIX 3]** `splitCache: Map<string, ResolvedSplits>` keyed by `${contractId}:${workId}` or `${contractId}:contract`

3. For each allocation:
   - Look up `contract_schedule_work_id` from `copyrightToWorkMap`
   - Apply stop conditions: `revenue_type` null → `unpayable_allocations[]`; `revenue_type === 'other'` → `needs_review_allocations[]`; `revenue_type_confidence === 'low'` → `needs_review_allocations[]`; `rights_basis === 'exclude_from_splits'` → `excluded_allocations[]`; `line_type` set and `!== 'royalty'` → `excluded_allocations[]`
   - **[FIX 4]** When a stop condition is met, add the allocation to the appropriate list and continue to the next allocation without allocating.
   - Call `resolveOwnershipSplits(contractId, workId)` (cached); if `valid === false` → `unpayable_allocations[]`, continue without allocating
   - Allocate per-party: `calculated_amount` for all, `payable_amount` via `isControlled()`
   - **[FIX 7]** Track `uncontrolled_total` per allocation after computing `calculated_amount` and `payable_amount`
   - Include `split_source` in `PartyBreakdown`

4. Result object includes `excluded_total`, `unpayable_total`, `needs_review_total`, and detail arrays (each entry: `allocation_id`, `reason`, `gross_amount`, `revenue_type`, `country`).

5. Remove direct `getAgreementParties` call at line 292 for ownership_split — keep a quick contract-level query for the early controlled-party check.

---

### Phase 4: Update `src/hooks/usePayouts.ts` (lines ~519-567)

1. **[FIX 5]** Schedule works query selects `id, copyright_id, inherits_royalty_splits, created_at` and is filtered by `contract_id`.

2. Build `copyrightToWorkMap` with deterministic duplicate handling.

3. Resolve splits per allocation using utility + cache (keys: `${contractId}:${workId}` or `${contractId}:contract`).

4. Apply same stop conditions and tracking arrays. **[FIX 4]** When a stop condition is met, add the allocation to the appropriate list and continue to the next allocation without allocating.

5. Allocate per-party, aggregate per `revenue_type`. **[FIX 7]** Track `uncontrolled_total` per allocation after computing `calculated_amount` and `payable_amount`.

6. Recoupment post-allocation unchanged.

---

### Phase 5: Audit Snapshot Enhancement

No schema change. In `ownership_snapshot` JSONB, include:

- **[FIX 6]** `allocation_id`, `gross_amount`, `revenue_type`, `country`
- `split_source` ("work" or "contract")
- Resolved party rows with percentages
- `line_type`, `revenue_type_confidence`, `rights_basis`
- `calculated_amount` and `payable_amount` per party
- `is_controlled` per party
- `uncontrolled_total`
- Exclusion/unpayable/needs_review reason if applicable

---

### Phase 6: Commission-Only Pass-Through

No changes.

---

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | New table, 4 columns on `royalty_allocations`, RLS, validation trigger (all 4 fields explicit) |
| `src/utils/isControlled.ts` | New — centralized controlled status check |
| `src/utils/resolveOwnershipSplits.ts` | New — split resolution with inherits flag, per-right-type validation |
| `src/hooks/useAgreementCalculation.ts` | Contract-scoped work map + split cache, stop conditions (continue without allocating), per-allocation split resolution, uncontrolled_total tracking, reconciliation arrays |
| `src/hooks/usePayouts.ts` | Same pattern for `calculatePayoutTotals` |

### Implementation Order

1. Run schema migration
2. Create `isControlled.ts` and `resolveOwnershipSplits.ts`
3. Update `useAgreementCalculation.ts`
4. Update `usePayouts.ts`

