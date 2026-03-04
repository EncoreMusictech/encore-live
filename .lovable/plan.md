# Contract-Compliant Royalty Calculation Engine

## Status: ✅ All 8 Phases Implemented

### Phase 1: Database Schema Migration ✅
- `revenue_type` on `royalty_allocations` (performance/mechanical/synch/other)
- `contract_deal_model` on `contracts` (ownership_split/commission_only)
- Audit columns on `payout_royalties` (party_id, split_percentage, ownership_snapshot, etc.)
- `validate_royalty_splits` updated with ±0.01 tolerance for all 6 right types

### Phase 2: Revenue Type Classifier ✅
- `src/utils/revenueTypeClassifier.ts` — maps statement fields to revenue types

### Phase 3: Import Enhancement ✅
- `useImportToAllocations.ts` classifies `revenue_type` during import

### Phase 4: Agreement Calculation Engine Rewrite ✅
- `useAgreementCalculation.ts` fully rewritten with ownership-split model
- `getAgreementParties` fetches all party types with `controlled_status`
- Per-right-type splits, territory checks, new interfaces

### Phase 5: Payout Totals Update ✅
- `calculatePayoutTotals` scopes allocations to contract works
- Ownership-split and commission-only models supported

### Phase 6: Splitting Moved to Payout Stage ✅
- Auto-splitting removed from import/match time
- `useWriterPayouts.ts` creates audit snapshots with per-right splits

### Phase 7: Royalty Ready Validation ✅
- `BulkContractImport.tsx` uses `validate_royalty_splits` RPC

### Phase 8: Recoupment After Allocation ✅
- Per-party recoupment using `entity_advance_ledger`
