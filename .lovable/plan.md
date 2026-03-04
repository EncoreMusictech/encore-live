

## Plan: Payout Reconciliation Sanity Check — Final Implementation

Two minor additions to the approved plan, then build all three files.

### Edit 1: Period window safety

In `PayoutReconciliationSanityCheck.tsx`, set:
```ts
const periodStart = new Date(Date.now() - 2 * 86400000); // now - 2 days
const periodEnd = new Date(Date.now() + 2 * 86400000);   // now + 2 days
```
This prevents timing drift from causing silent misses.

### Edit 2: Fixture completeness assertion

After `createFixtures` returns, immediately check:
```ts
const fixture_allocation_count = result.allocationIds.length;
// Assert: fixture_allocation_count == 8 (before engine call)
```

Add `fixture_allocation_count` to output JSON alongside `fetched_count`. Assertion 7 becomes:

| 7 | `fixture_allocation_count == 8 AND fetched_count == 8` AND bucket counts 2/2/2 | Catches partial inserts AND miscategorization |

This separates "did we insert 8?" from "did the engine see 8?" — if fixture count is 7 but fetched is 7, the problem is inserts not the engine.

### Files (unchanged from approved plan, plus above edits)

1. **`src/dev/sanityChecks/payoutReconciliationData.ts`** — fixture factory
2. **`src/dev/sanityChecks/PayoutReconciliationSanityCheck.tsx`** — UI with 7 assertions (assertion 7 now includes fixture count check), ±2 day period window
3. **`src/App.tsx`** — add lazy route at `/dev/sanity/payout-reconciliation`

Everything else per the approved plan. Ready to implement.

