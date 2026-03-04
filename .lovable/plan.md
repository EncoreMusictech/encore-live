

## QA Validation Results: Split Resolution and Payout Engine

### Check 1: Split Resolution Fallback — PASS in useAgreementCalculation, PASS in usePayouts

**useAgreementCalculation.ts (lines 457-462):**
```
const workId = allocation.copyright_id
  ? copyrightToWorkMap.get(allocation.copyright_id) ?? null
  : null;
const splits = await getCachedSplits(agreementId, workId);
```
If copyright_id is missing or not in the map, `workId` becomes `null`, and `getCachedSplits` resolves to contract-level splits via the resolver's first branch. Correct.

**usePayouts.ts (lines 598-602):** Same pattern. Correct.

---

### Check 2: Stop Conditions — FAIL in usePayouts.ts

**useAgreementCalculation.ts (lines 423-468):** All 5 stop conditions use `continue` and push to the correct reconciliation array with reason strings. Each adds `gross` to `excludedTotal`, `unpayableTotal`, or `needsReviewTotal`. **PASS.**

**usePayouts.ts (lines 591-596):** Stop conditions are bare `continue` statements with NO reconciliation tracking:
```js
if (!revenueType) continue;           // no unpayable tracking
if (revenueType === 'other') continue; // no needs_review tracking
if (allocation.revenue_type_confidence === 'low') continue;
if (allocation.rights_basis === 'exclude_from_splits') continue;
if (allocation.line_type && allocation.line_type !== 'royalty') continue;
```
Also line 603: `if (!splits.valid) continue;` — no `invalid_split_totals` tracking.

**The return object (lines 617-629) has no reconciliation fields** — no `excluded_total`, `unpayable_total`, `needs_review_total`, no detail arrays.

**FAIL. Fix required:** Add reconciliation arrays and totals to usePayouts.ts matching the useAgreementCalculation.ts pattern.

---

### Check 3: Validation Tolerance and Null Normalization — PASS

**resolveOwnershipSplits.ts:**
- `normalizePercentage()` (line ~30): converts `null`/`undefined` to `0` before summing. Correct.
- `validateSums()` (lines ~34-50): validates perf, mech, synch independently with `Math.abs(sum - 100) > 0.01` (TOLERANCE constant). Correct.
- On invalid splits, returns `{ valid: false, errors: [...] }`.
- In useAgreementCalculation.ts line 465: `reason: 'invalid_split_totals'` is stored. **PASS.**
- In usePayouts.ts line 603: `continue` with no reason stored. **FAIL** (same issue as Check 2).

---

### Check 4: Controlled Logic Consistency — PARTIAL PASS

Both engines import `isControlled` from `@/utils/isControlled.ts`. The resolver stores `is_controlled` on each `ResolvedParty`.

**useAgreementCalculation.ts (line 478):** Uses `party.is_controlled` from resolved splits. Correct.

**usePayouts.ts (line 609):** Uses `party.is_controlled`. Correct.

However, **usePayouts.ts line 609** skips uncontrolled parties entirely (`if (!party.is_controlled) continue`) — it never computes `calculated_amount` for them and never tracks `uncontrolled_total`. In useAgreementCalculation.ts, both controlled and uncontrolled parties get `calculated_amount` computed, and `uncontrolled_total` is tracked (line 482). **PARTIAL FAIL** — usePayouts does not produce audit-consistent snapshots for uncontrolled parties.

---

### Check 5: Duplicate Schedule Work Handling — PASS

**useAgreementCalculation.ts `buildCopyrightToWorkMap` (lines 107-132):**
- Prefers `inherits_royalty_splits === false` over other values (line 121)
- Falls back to latest `created_at` when equal (line 123)
- Logs warning with `console.warn` (line 119)
Correct.

**usePayouts.ts (lines 530-548):** Identical logic inlined. Correct.

---

### Summary of Issues Found

| Check | useAgreementCalculation | usePayouts |
|-------|------------------------|------------|
| 1. Fallback | PASS | PASS |
| 2. Stop conditions track totals | PASS | **FAIL** — bare `continue`, no arrays/totals |
| 3. Null normalization + tolerance | PASS | PASS (resolver), **FAIL** (no reason stored) |
| 4. Controlled consistency | PASS | **PARTIAL FAIL** — skips uncontrolled, no `uncontrolled_total` |
| 5. Duplicate handling | PASS | PASS |

---

### Required Fixes (usePayouts.ts only)

**Fix A: Add reconciliation tracking to `calculatePayoutTotals`** (lines ~580-613)
- Declare `excludedAllocations`, `unpayableAllocations`, `needsReviewAllocations` arrays and totals before the loop
- Each stop condition pushes an entry with `allocation_id`, `reason`, `gross_amount`, `revenue_type`, `country` and adds to the appropriate total, then `continue`
- Invalid splits push with reason `invalid_split_totals`

**Fix B: Track all parties including uncontrolled** (lines ~608-612)
- Compute `calculated_amount` for ALL parties, not just controlled
- Track `uncontrolled_total` per allocation
- Only add to `controlledTotal` for controlled parties (current behavior for the payable amount is correct, just needs the uncontrolled tracking added)

**Fix C: Include reconciliation fields in return object** (lines ~617-629)
- Add `excluded_total`, `unpayable_total`, `needs_review_total`
- Add the three detail arrays
- The return type from `calculatePayoutTotals` will need these fields added to its interface (or use a more permissive return)

All three fixes are scoped to `src/hooks/usePayouts.ts`, lines ~580-629. No other files need changes.

