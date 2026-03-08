

# Generate Pre-Filled Bulk Contract Import XLSX

## Approach
Add a helper function that generates a pre-filled XLSX file containing the extracted data from both agreements, using the exact column structure expected by `BulkContractImport.tsx`.

## Data Extracted

### Contract 1: Nosakhere Jabili Andrews
- **Type**: Co-Publishing (`publishing`)
- **Publisher**: Gray State Music, L.L.C.
- **Counterparty**: Nosakhere Jabili Andrews
- **Term**: 2019-01-01 to 2022-01-01 (3 years)
- **Post-Term Collection**: 24 months → 2024-01-01
- **Advance**: $50,000
- **Territories**: Universe
- **Ownership**: 50% (performance, mechanical, synch)
- **8 Works**: Walked In, El Chapo Jr., Ghetto, Iced Out, Back, Habit, White Balenciaga, Crazy Shit
- **Administrator**: Gray State Music, L.L.C.
- **Original Publisher**: Gray State Music, L.L.C.

→ 8 rows (one per work, same party/split info repeated)

### Contract 2: Dream Addix (Valenzuela & Ferrucci)
- **Type**: Co-Publishing (`publishing`)
- **Publisher**: Gray State Music, L.L.C.
- **Counterparty**: Dream Addix (Christopher Roen Valenzuela & Michael Paul Ferrucci)
- **Term**: 2018-09-05 to 2021-09-05 (3 years)
- **Post-Term Collection**: 24 months → 2023-09-05
- **Advance**: $100,000
- **Territories**: Universe
- **Ownership**: 10% each writer (performance, mechanical, synch per Exhibit A)
- **5 Works**: Every Night Sis, God Church, Frick Da Police, Bitcoin, Naughty or Nice (Xmas Song)
- **2 Writers per work** → 10 rows

→ 10 rows total

### Grand Total: 18 rows

## Implementation

Create a downloadable XLSX file with these 18 pre-filled rows in `public/templates/` or generate it on-the-fly. The simplest approach: **add a static XLSX generation** triggered by a utility, or just write the rows directly into the existing template download mechanism.

I will create a standalone script-style component or utility that, when called, generates and downloads the file using the `xlsx` library — same pattern as `handleDownloadTemplate` in `BulkContractImport.tsx`.

### File to create
- `src/utils/generatePrefillContracts.ts` — exports a function `downloadPrefilled()` that builds and downloads the XLSX

### File to modify
- `src/components/admin/subaccount/BulkContractImport.tsx` — add a "Download Pre-filled Example" button that calls the utility

### Column mapping (matches ParsedRow interface)
```
title | counterparty_name | contract_type | start_date | end_date | post_term_collection_end_date | post_term_collection_months | advance_amount | commission_percentage | territories | party_name | party_type | performance_pct | mechanical_pct | synch_pct | work_title | work_isrc | publishing_entity | administrator | original_publisher
```

Each row combines contract-level fields with one work + one party. Multi-writer works produce multiple rows with the same work title but different party names/splits.

