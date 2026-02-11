

# Catalog Import Center -- Implementation Plan

## Overview

Add a new "Catalog Import" tab to the Management Console inside the Operations Dashboard. This tab hosts a multi-sheet XLSX workbook importer that normalizes research data from MusicBrainz, ASCAP, BMI Songview, MLC, and Sync sources into a validated staging layer, then promotes verified works into new centralized catalog tables that serve as the single source of truth for all ENCORE modules.

---

## Feature Location

```text
Operations Dashboard
  --> Management Console (admin-only)
        --> Sub-Accounts
        --> Access Control
        --> Partnerships
        --> Task Management
        --> User Analytics
        --> Catalog Import   <-- NEW
```

No new authentication logic needed. The Management Console tab is already restricted to admin role via `OperationsDashboard.tsx` line 59.

---

## Phase 1: Database Migration

### New Tables

**1. `catalog_import_batches`** -- one row per uploaded workbook

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid NOT NULL | FK to auth.users |
| company_id | uuid | nullable, optional client scope |
| file_name | text | original XLSX filename |
| total_rows | int default 0 | across all sheets |
| valid_rows | int default 0 | |
| duplicate_rows | int default 0 | |
| error_rows | int default 0 | |
| status | text default 'processing' | processing, validated, committed, failed |
| created_at | timestamptz | default now() |

RLS: `auth.uid() = user_id` for SELECT, INSERT, UPDATE.

**2. `catalog_import_staging`** -- one row per normalized work from the workbook

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| import_batch_id | uuid FK | references catalog_import_batches |
| user_id | uuid | |
| company_id | uuid | nullable |
| source_sheet | text | e.g. "musicbrainz_works", "ascap", "bmi_songview", "mlc", "sync" |
| work_title | text | |
| artist_name | text | |
| isrc | text | nullable |
| iswc | text | nullable |
| normalized_title | text | lowercase, stripped punctuation for dedup matching |
| writers | jsonb | array of {name, ipi, role, pro, share} |
| publishers | jsonb | array of {name, ipi, role, pro, share} |
| canonical_row | jsonb | merged/normalized fields across all sources |
| identifier_conflicts | jsonb default '[]' | e.g. mismatched ISWCs from different sheets for same title |
| validation_status | text | valid, duplicate, error |
| validation_errors | jsonb | array of error strings |
| promoted | boolean default false | |
| raw_row_data | jsonb | original row from the sheet |
| created_at | timestamptz | |

RLS: `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE.

**3. `catalog_works`** -- permanent centralized catalog (the "golden master")

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| company_id | uuid | nullable |
| work_title | text NOT NULL | |
| normalized_title | text | for dedup |
| iswc | text | nullable, only from verified sources |
| isrc | text | nullable |
| artist_name | text | |
| album_title | text | nullable |
| source | text | import, discovery, manual |
| import_batch_id | uuid | nullable FK, provenance tracking |
| musicbrainz_id | text | nullable MBID |
| ascap_work_id | text | nullable |
| bmi_work_id | text | nullable |
| mlc_work_id | text | nullable |
| pro_registrations | jsonb default '[]' | [{pro, work_id, status}] |
| sync_history | jsonb default '[]' | [{type, title, year}] |
| metadata | jsonb default '{}' | extensible |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Authenticated users can SELECT. Only `auth.uid() = user_id` can INSERT/UPDATE/DELETE.

**4. `catalog_contributors`** -- writers and publishers as standalone entities

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| name | text NOT NULL | |
| ipi_number | text | nullable |
| pro_affiliation | text | nullable (ASCAP, BMI, SESAC, etc.) |
| role | text | writer, publisher |
| created_at | timestamptz | |

RLS: Authenticated reads; `auth.uid() = user_id` for writes.

**5. `catalog_work_contributors`** -- join table linking works to contributors

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| catalog_work_id | uuid FK | references catalog_works(id) ON DELETE CASCADE |
| contributor_id | uuid FK | references catalog_contributors(id) |
| role | text | composer, lyricist, arranger, publisher, admin_publisher |
| ownership_percentage | numeric | nullable |
| mechanical_share | numeric | nullable |
| performance_share | numeric | nullable |
| sync_share | numeric | nullable |
| controlled | boolean default false | |

RLS: Inherits from parent table access.

### Database Function: `promote_staging_batch`

A `SECURITY DEFINER` function callable via `supabase.rpc('promote_staging_batch', { batch_id })`:

1. Reads all staging rows where `validation_status = 'valid'` and `promoted = false` for the given batch.
2. For each row, INSERT INTO `catalog_works` (dedup on `normalized_title + artist_name`).
3. For each writer/publisher in the row's JSON, upsert into `catalog_contributors`, then link via `catalog_work_contributors`.
4. Mark staging rows as `promoted = true`.
5. Update batch status to `committed` and set `valid_rows` count.
6. Return the count of promoted works.

---

## Phase 2: Sheet Parsing Logic

### New file: `src/lib/catalog-validation.ts`

Validation and normalization utilities:

- **`normalizeTitle(title)`** -- lowercase, strip punctuation/parens, trim whitespace
- **`validateISRC(isrc)`** -- regex: `^[A-Z]{2}-?[A-Z0-9]{3}-?\d{2}-?\d{5}$`
- **`validateISWC(iswc)`** -- regex: `^T-?\d{9}-?\d$`
- **`parseSheetByType(sheetName, rows)`** -- returns normalized objects based on known header patterns for each of the 5 sheet types

### Sheet Header Mappings

Each sheet type maps its specific columns to the canonical staging schema:

| Sheet | Key Columns Mapped |
|-------|--------------------|
| MusicBrainz Works | title, ISWC, writers (as composers), MBID |
| MusicBrainz Recordings | recording title, ISRC, artist, duration |
| ASCAP / BMI Songview | work title, work ID, writers, publishers, PRO shares |
| MLC Catalog | song title, song code, ISWC, ISRC, writers, publishers |
| TV/Movie/Game Sync | work title, sync type (TV/Film/Game), title of media, year |

### Conflict Detection

When multiple sheets reference the same `normalized_title + artist_name` but provide different ISWCs or conflicting writer splits, the system:
1. Groups rows by `normalized_title + artist_name`
2. Compares ISWC values across groups
3. Flags mismatches in `identifier_conflicts` JSON array
4. Sets `validation_status = 'error'` if conflicts exist (admin must resolve before promotion)

---

## Phase 3: React Components

### New file: `src/hooks/useCatalogImport.ts`

State machine hook managing the 4-step import wizard:

- **State**: `step` (upload | map | review | commit), `batch`, `stagingRows`, `sheetData`, `progress`
- **Actions**: `parseFile()`, `validateAll()`, `insertStaging()`, `promoteBatch()`
- Uses `xlsx` library (already installed) for multi-sheet parsing
- Uses `react-dropzone` (already installed) for file upload
- Batch insert size: 3 rows with exponential backoff (existing proven pattern from SmartCSVImporter)
- Pre-flight auth token refresh before long-running operations

### New file: `src/components/catalog/CatalogImportCenter.tsx`

The main wizard component with 4 steps:

**Step 1 -- Upload**
- Drag-and-drop zone for XLSX files (accepts `.xlsx` only)
- On drop: parse all sheets, detect which of the 5 known sheet types are present
- Display summary: "Found 5 sheets: MusicBrainz Works (142 rows), ASCAP (89 rows)..."

**Step 2 -- Map and Normalize**
- For each detected sheet, show header mapping preview (first 3 rows)
- Auto-mapped columns shown with green checkmarks
- Unmapped columns flagged with yellow warnings
- Admin can override mappings via dropdowns
- "Normalize All" button runs the parsing pipeline

**Step 3 -- Review and Resolve**
- Table of all normalized staging rows with status badges (Valid, Duplicate, Error, Conflict)
- Filter tabs: All | Valid | Duplicates | Errors | Conflicts
- Conflict resolution panel: shows side-by-side data from different sheets for the same work
- Inline editing for fixable errors (e.g., malformed ISRC)
- Dedup check runs against existing `catalog_works.normalized_title` and `copyright_recordings.isrc`
- Summary bar: "142 valid, 12 duplicates, 3 errors, 2 conflicts"

**Step 4 -- Commit**
- Shows final summary of what will be promoted
- "Commit to Catalog" button calls `promote_staging_batch` RPC
- Progress bar during promotion
- Results: "128 works added to catalog, 14 contributors created, 2 conflicts skipped"

### Modified file: `src/components/operations/consolidated/ManagementConsole.tsx`

Changes:
- Import `CatalogImportCenter` and `Database` icon from lucide-react
- Change `TabsList` grid from `grid-cols-5` to `grid-cols-6`
- Add new `TabsTrigger` with value "catalog-import" and label "Catalog Import"
- Add new `TabsContent` rendering `<CatalogImportCenter />`

---

## Phase 4: Files Summary

### New files (4)

| File | Purpose |
|------|---------|
| `src/components/catalog/CatalogImportCenter.tsx` | 4-step import wizard UI |
| `src/hooks/useCatalogImport.ts` | Import state machine, parsing, validation, batch insert |
| `src/lib/catalog-validation.ts` | ISRC/ISWC validators, title normalization, sheet parsers, conflict detection |
| `supabase/migrations/[timestamp]_catalog_import_center.sql` | 5 new tables + RLS + promote function |

### Modified files (1)

| File | Change |
|------|--------|
| `ManagementConsole.tsx` | Add 6th "Catalog Import" tab rendering `<CatalogImportCenter />` |

### No changes to existing modules

The `copyrights`, `copyright_recordings`, `catalog_items`, and `song_metadata_cache` tables remain untouched. Future work will bridge `catalog_works` into those modules, but this phase focuses solely on establishing the centralized ingestion point.

---

## Identifier Integrity Guarantees

- ISWCs only stored if they pass regex validation -- no AI-sourced ISWCs accepted
- ISRCs validated against standard format before staging
- Conflict detection prevents silent overwrites when different sources disagree
- Every `catalog_works` row tracks its `import_batch_id` and `source` for full provenance
- `normalized_title` enables deterministic dedup without relying on identifiers alone

