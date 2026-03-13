

## Plan: Fix work_id collision + runId ownership + cleanup safety

Three targeted edits across two files. No new files.

---

### File 1: `src/dev/sanityChecks/payoutReconciliationData.ts`

**Change 1** — Signature: `createFixtures(runId: string, userId: string)` instead of generating `runId` internally. Remove line 33 (`const runId = ...`).

**Change 2** — Copyright inserts (lines 83-87): add explicit `work_id` with random suffix:
```ts
const copyrightInserts = [
  { user_id: userId, work_title: `Sanity-CR1-${runId}`, work_id: `SANITY-${runId}-CR1-${crypto.randomUUID().slice(0, 6)}`, notes: runId },
  { user_id: userId, work_title: `Sanity-CR2-${runId}`, work_id: `SANITY-${runId}-CR2-${crypto.randomUUID().slice(0, 6)}`, notes: runId },
  { user_id: userId, work_title: `Sanity-CR3-${runId}`, work_id: `SANITY-${runId}-CR3-${crypto.randomUUID().slice(0, 6)}`, notes: runId },
];
```
The `generate_work_id` trigger only fires when `work_id` is NULL, so explicit values bypass it entirely. The random suffix makes collisions impossible even if `runId` is reused.

---

### File 2: `src/dev/sanityChecks/PayoutReconciliationSanityCheck.tsx`

**Change 3** — Generate `runId` in component before calling factory (lines 34-38):
```ts
const currentRunId = 'sanity-' + crypto.randomUUID().slice(0, 8);
setRunId(currentRunId);
const fixtures = await createFixtures(currentRunId, user.id);
```

**Change 4** — Cleanup no longer depends on `fixtures` being non-null (lines 220-231):
```ts
} finally {
  if (!skipCleanup && currentRunId) {
    try {
      const cleanupErrors = await cleanupFixtures(currentRunId, user.id);
      if (cleanupErrors.length > 0) {
        console.warn('Cleanup errors:', cleanupErrors);
      }
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  }
  setRunning(false);
}
```
Uses `currentRunId` (always set before `createFixtures`) instead of `fixtures.runId`, so partial inserts get cleaned up even if the factory throws mid-way.

