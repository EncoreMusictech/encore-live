

## Seed Comprehensive Alicia Keys Demo Data Across All ENCORE Modules

### Overview
Populate the demo account with interconnected Alicia Keys data so every module shows realistic, cross-referenced information. The data flows: **Copyrights** (works + writers) → **Contracts** (publishing agreement + interested parties + schedule of works) → **Sync Licensing** (a licensed sync deal referencing those copyrights) → **Royalties** (allocations from the sync deal + a statement import) → **Payees** (hierarchy built from the agreement) → **Catalog Valuation** (valuation record) → **Deal Simulator** (saved scenario with historical statements).

### Data Design

All records use `user_id = demo_user_id` (`d2005882-9591-4564-b3e1-48617dc3bc1d`).

**1. Copyrights** (8 Alicia Keys works + writers)
Works: "If I Ain't Got You", "No One", "Fallin'", "Girl on Fire", "Empire State of Mind (Part II)", "Unbreakable", "Try Sleeping with a Broken Heart", "Superwoman". Each with `copyright_writers` (Alicia Keys as controlled writer + co-writers where applicable), ISWCs, PRO registrations.

**2. Copyright Recordings** 
Linked ISRCs and recording metadata for each copyright.

**3. Contract** — "Alicia Keys Co-Publishing Agreement"
- `agreement_id`: AGR-2026010101
- `counterparty_name`: Alicia Keys
- `administrator`: Demo Music Publishing
- `contract_type`: co_publishing
- `commission_percentage`: 25
- `advance_amount`: 500000
- Fully executed status

**4. Contract Interested Parties** (3 entries)
- Alicia Keys (Writer, Controlled, perf: 50%, mech: 50%, sync: 50%)
- Kerry Brothers Jr. (Writer, Controlled, perf: 25%, mech: 25%, sync: 25%)
- Demo Music Publishing (Publisher, Controlled, perf: 25%, mech: 25%, sync: 25%)

**5. Contract Schedule Works**
All 8 copyrights linked to the agreement via `copyright_id`.

**6. Sync License** — "Netflix Drama — 'Empire State of Mind (Part II)'"
- Status: Licensed, Invoice: Paid, linked to copyright IDs
- `pub_fee`: 15000, `master_fee`: 15000
- `production_company`: Netflix
- `media_type`: TV Series
- Fee allocations with controlled amounts

**7. Royalty Allocations** (4 entries)
- Sync royalty from the Netflix deal (linked to sync license)
- 3 publishing royalty allocations (performance, mechanical, streaming) for Q4 2025

**8. Royalties Import Staging** — "Q4 2025 Publishing Statement"
- `detected_source`: Demo Music Publishing
- `processing_status`: processed
- `mapped_data` with summary metrics

**9. Payee Hierarchy**
- Original Publisher: Demo Music Publishing (linked to agreement)
- Writers: Alicia Keys, Kerry Brothers Jr. (linked to original publisher)
- Payees: Alicia Keys, Kerry Brothers Jr. (linked to writers, with split percentages)

**10. Catalog Valuation** — Alicia Keys catalog
- `artist_name`: Alicia Keys
- `valuation_amount`: 12500000
- `total_streams`, `monthly_listeners`, etc.

**11. Deal Historical Statements** (8 quarters of data for Alicia Keys)
- Q1 2024 through Q4 2025, with realistic revenue breakdown

**12. Deal Scenario** — "Alicia Keys — Netflix Sync Deal Analysis"
- Pre-loaded with selected tracks, deal terms, and projections

### Implementation

**1. Expand `src/utils/seedDemoData.ts`**
Add new seeding functions called from `seedDemoData()`:
- `seedDemoCopyrights(userId)` — copyrights + copyright_writers + copyright_recordings
- `seedDemoContracts(userId)` — contract + interested parties + schedule works
- `seedDemoSyncLicenses(userId)` — sync license with fee allocations
- `seedDemoRoyalties(userId)` — royalty allocations + staging record
- `seedDemoPayeeHierarchy(userId)` — original_publishers + writers + payees
- `seedDemoCatalogValuation(userId)` — catalog_valuations + deal_historical_statements + deal_scenarios

Each function checks for existing data (idempotent) before inserting.

**2. No schema changes needed** — all tables already exist.

### Files
- **Modify**: `src/utils/seedDemoData.ts` — add all seeding functions

