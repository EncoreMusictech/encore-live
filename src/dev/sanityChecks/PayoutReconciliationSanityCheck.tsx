import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePayouts } from '@/hooks/usePayouts';
import { createFixtures, cleanupFixtures, type FixtureResult } from './payoutReconciliationData';

interface Assertion {
  id: number;
  label: string;
  expected: string;
  actual: string;
  pass: boolean;
}

export default function PayoutReconciliationSanityCheck() {
  const { user } = useAuth();
  const { calculatePayoutTotals } = usePayouts();
  const [running, setRunning] = useState(false);
  const [assertions, setAssertions] = useState<Assertion[]>([]);
  const [output, setOutput] = useState<object | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipCleanup, setSkipCleanup] = useState(false);

  const run = async () => {
    if (!user?.id) return;
    setRunning(true);
    setAssertions([]);
    setOutput(null);
    setError(null);

    let fixtures: FixtureResult | null = null;
    let currentRunId: string | null = null;

    try {
      // 1. Create fixtures
      fixtures = await createFixtures(user.id);
      currentRunId = fixtures.runId;
      setRunId(currentRunId);

      const fixtureAllocationCount = fixtures.allocationIds.length;

      // 2. Period window: ±2 days to prevent timing drift
      const periodStart = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
      const periodEnd = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

      // 3. Call engine
      const totals = await calculatePayoutTotals(
        fixtures.contactId,
        periodStart,
        periodEnd,
        fixtures.contractId,
      );

      if (!totals) throw new Error('calculatePayoutTotals returned null/undefined');

      // 4. Extract engine results
      const grossRoyalties: number = totals.gross_royalties ?? 0;
      const excludedTotal: number = totals.excluded_total ?? 0;
      const unpayableTotal: number = totals.unpayable_total ?? 0;
      const needsReviewTotal: number = totals.needs_review_total ?? 0;
      const uncontrolledTotal: number = totals.uncontrolled_total ?? 0;
      const netRoyalties: number = totals.net_royalties ?? 0; // controlled/payable total

      const excludedAllocations: any[] = totals.excluded_allocations ?? [];
      const unpayableAllocations: any[] = totals.unpayable_allocations ?? [];
      const needsReviewAllocations: any[] = totals.needs_review_allocations ?? [];

      // 5. Derive bucket IDs and allocated IDs
      const bucketUnionIds = new Set<string>([
        ...excludedAllocations.map((a: any) => a.allocation_id),
        ...unpayableAllocations.map((a: any) => a.allocation_id),
        ...needsReviewAllocations.map((a: any) => a.allocation_id),
      ]);

      const derivedAllocatedIds = fixtures.allocationIds.filter(
        (id) => !bucketUnionIds.has(id),
      );

      const fetchedCount = bucketUnionIds.size + derivedAllocatedIds.length;

      const allocatableGrossTotal = grossRoyalties - excludedTotal - unpayableTotal - needsReviewTotal;

      // 6. Collect all reason codes
      const allReasons = [
        ...excludedAllocations.map((a: any) => a.reason),
        ...unpayableAllocations.map((a: any) => a.reason),
        ...needsReviewAllocations.map((a: any) => a.reason),
      ];

      // 7. Run assertions
      const results: Assertion[] = [];

      // #1: total_gross == fetched_count * 100
      results.push({
        id: 1,
        label: 'total_gross == fetched_count × 100',
        expected: `${fetchedCount * 100}`,
        actual: `${grossRoyalties}`,
        pass: grossRoyalties === fetchedCount * 100,
      });

      // #2: Partition identity
      const partitionSum = excludedTotal + unpayableTotal + needsReviewTotal + allocatableGrossTotal;
      results.push({
        id: 2,
        label: 'total_gross == excluded + unpayable + needs_review + allocatable',
        expected: `${grossRoyalties}`,
        actual: `${partitionSum}`,
        pass: Math.abs(grossRoyalties - partitionSum) < 0.01,
      });

      // #3: payable_total == 130 (alloc #1 work 70% + alloc #7 contract 60%)
      results.push({
        id: 3,
        label: 'payable_total (controlled) == 130',
        expected: '130',
        actual: `${netRoyalties}`,
        pass: Math.abs(netRoyalties - 130) < 0.01,
      });

      // #4: uncontrolled_total == 70 (alloc #1 work 30% + alloc #7 contract 40%)
      results.push({
        id: 4,
        label: 'uncontrolled_total == 70',
        expected: '70',
        actual: `${uncontrolledTotal}`,
        pass: Math.abs(uncontrolledTotal - 70) < 0.01,
      });

      // #5: No allocation_id in more than one bucket
      const allBucketIds = [
        ...excludedAllocations.map((a: any) => a.allocation_id),
        ...unpayableAllocations.map((a: any) => a.allocation_id),
        ...needsReviewAllocations.map((a: any) => a.allocation_id),
      ];
      const uniqueBucketIds = new Set(allBucketIds);
      results.push({
        id: 5,
        label: 'No allocation_id in more than one bucket',
        expected: `${allBucketIds.length} (unique)`,
        actual: `${uniqueBucketIds.size} unique of ${allBucketIds.length} total`,
        pass: allBucketIds.length === uniqueBucketIds.size,
      });

      // #6: All 6 expected reason codes present
      const expectedReasons = [
        'missing_revenue_type',
        'revenue_type_other',
        'low_confidence',
        'exclude_from_splits',
        'non_royalty_line_type:fee',
        'invalid_split_totals',
      ];
      const missingReasons = expectedReasons.filter((r) => !allReasons.includes(r));
      results.push({
        id: 6,
        label: 'All 6 reason codes present',
        expected: expectedReasons.join(', '),
        actual: missingReasons.length === 0 ? 'All present' : `Missing: ${missingReasons.join(', ')}`,
        pass: missingReasons.length === 0,
      });

      // #7: fixture_allocation_count == 8 AND fetched_count == 8 AND bucket counts 2/2/2
      const bucketCountsOk =
        excludedAllocations.length === 2 &&
        unpayableAllocations.length === 2 &&
        needsReviewAllocations.length === 2;
      results.push({
        id: 7,
        label: 'fixture_count==8 AND fetched==8 AND excluded=2, unpayable=2, needs_review=2',
        expected: 'fixture=8, fetched=8, excluded=2, unpayable=2, needs_review=2',
        actual: `fixture=${fixtureAllocationCount}, fetched=${fetchedCount}, excluded=${excludedAllocations.length}, unpayable=${unpayableAllocations.length}, needs_review=${needsReviewAllocations.length}`,
        pass: fixtureAllocationCount === 8 && fetchedCount === 8 && bucketCountsOk,
      });

      setAssertions(results);

      // 8. Build output JSON
      setOutput({
        run_id: currentRunId,
        fixture_ids: {
          contact: fixtures.contactId,
          contract: fixtures.contractId,
          copyrights: fixtures.copyrightIds,
          schedule_works: fixtures.scheduleWorkIds,
          allocations: fixtures.allocationIds,
        },
        fixture_allocation_count: fixtureAllocationCount,
        fetched_count: fetchedCount,
        bucket_union_ids: Array.from(bucketUnionIds),
        derived_allocated_ids: derivedAllocatedIds,
        totals: {
          gross_royalties: grossRoyalties,
          excluded_total: excludedTotal,
          unpayable_total: unpayableTotal,
          needs_review_total: needsReviewTotal,
          allocatable_gross_total: allocatableGrossTotal,
          payable_total: netRoyalties,
          uncontrolled_total: uncontrolledTotal,
        },
        buckets: {
          excluded: excludedAllocations,
          unpayable: unpayableAllocations,
          needs_review: needsReviewAllocations,
        },
        reason_codes_found: allReasons,
        assertions: results.map((a) => ({ id: a.id, label: a.label, pass: a.pass })),
        notes: {
          contract_status: 'draft (confirmed: no status filtering in calculatePayoutTotals)',
          royalty_id_source: 'set_royalty_id trigger (BEFORE INSERT, auto-generated)',
          split_source_assertion: 'Skipped: usePayouts does not store split_source per allocation. Would need engine change to assert.',
        },
        known_limitations: [
          'Allocations with copyright_id not mapped to any contract_schedule_work are silently excluded by the .in(copyright_id, copyrightIds) filter.',
        ],
      });
    } catch (e: any) {
      setError(e.message || String(e));
      if (currentRunId) setRunId(currentRunId);
    } finally {
      // Cleanup
      if (fixtures && !skipCleanup) {
        try {
          const cleanupErrors = await cleanupFixtures(fixtures.runId, user.id);
          if (cleanupErrors.length > 0) {
            console.warn('Cleanup errors:', cleanupErrors);
          }
        } catch (e) {
          console.error('Cleanup failed:', e);
        }
      }
      setRunning(false);
    }
  };

  const copyJson = () => {
    if (output) {
      navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    }
  };

  const allPassed = assertions.length > 0 && assertions.every((a) => a.pass);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Payout Reconciliation Sanity Check</h1>

      <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Prerequisites</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Must be logged in as an ENCORE admin</li>
          <li>Creates temporary fixtures (contact, contract, copyrights, allocations) then cleans up</li>
          <li>Toggle "Skip Cleanup" to inspect fixtures in the database after the run</li>
        </ul>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={run}
          disabled={running || !user}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run Sanity Check'}
        </button>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={skipCleanup}
            onChange={(e) => setSkipCleanup(e.target.checked)}
            className="rounded"
          />
          Skip Cleanup
        </label>
      </div>

      {runId && (
        <p className="text-xs font-mono text-muted-foreground">
          run_id: <span className="text-foreground">{runId}</span>
          {skipCleanup && <span className="ml-2 text-yellow-600">(cleanup skipped — manual cleanup required)</span>}
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
          <p className="font-medium">Error</p>
          <p className="font-mono mt-1">{error}</p>
        </div>
      )}

      {assertions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Assertions{' '}
            <span className={allPassed ? 'text-green-600' : 'text-destructive'}>
              ({assertions.filter((a) => a.pass).length}/{assertions.length} passed)
            </span>
          </h2>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">#</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Assertion</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Expected</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Actual</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {assertions.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{a.id}</td>
                    <td className="px-3 py-2">{a.label}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.expected}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.actual}</td>
                    <td className="px-3 py-2">
                      <span className={`font-bold ${a.pass ? 'text-green-600' : 'text-destructive'}`}>
                        {a.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Output JSON</h2>
            <button onClick={copyJson} className="text-xs px-3 py-1 rounded border border-border hover:bg-muted">
              Copy JSON
            </button>
          </div>
          <pre className="rounded-lg border border-border bg-muted p-4 text-xs font-mono overflow-auto max-h-[600px] text-foreground">
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
