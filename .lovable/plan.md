

# Revised Plan: Multi-Row Work Grouping for Bulk Upload

## The Key Problem

The PAQ Publishing template groups works across multiple rows:

```text
Row 1: Best Friends | Sophia Grace | ... | Donald Augustus Sales | 70% | Y | QMFEX1300002
Row 2: (blank title) |             | ... | Sophia Grace Brownlee | 30% |   |
Row 3: (empty separator row)
Row 4: Next Work Title | ...
```

- Row 1 = work metadata + first writer
- Row 2+ = additional writers (work_title is blank)
- Empty rows = separators between works

The current code processes every row as a standalone work, so "Best Friends" would be created as two separate works, each with only one writer. This is fundamentally wrong.

## Solution: Pre-Processing Grouping Step

Add a grouping pass before the per-work processing loop. This sits between file parsing and the database insert loop.

### Step 1 -- Group rows into works

After `XLSX.utils.sheet_to_json(worksheet)` returns flat rows, add a `groupRowsIntoWorks()` function that:

1. Iterates through all rows
2. When a row has a non-empty `Work Title` (or `work_title`), it starts a new work group
3. When a row has an empty title but has writer data (`Name of Writer(s)`, `First Name`, `Last Name`, or `writer_N_name`), it is appended as an additional writer to the current work group
4. Fully empty rows are skipped (they are separators in the PAQ format)

Each grouped work becomes an object like:

```text
{
  title: "Best Friends",
  artist: "Sophia Grace",
  isrc: "QMFEX1300002",
  ... (all metadata from the first row),
  writers: [
    { name: "Donald Augustus Sales pka Hazel", first: "Donald", last: "Sales", pro: "ASCAP", ipi: "423630488", share: 70, controlled: true },
    { name: "Sophia Grace Brownlee", first: "Sophia", last: "Grace", pro: "ASCAP", ipi: "766580896", share: 30, controlled: false }
  ]
}
```

### Step 2 -- Adapt column name mapping

The PAQ template uses display-friendly column headers (e.g., "Work Title", "Name of Writer(s)", "Content (Clean / Explicit / Neither)"). Add aliases so both PAQ-style and current template-style column names work:

- `Work Title` or `work_title`
- `Alternate Title` or `alternate_title`
- `Main Artist` or `main_artist`
- `Featured Artist` or `featured_artist`
- `Name of Writer(s)` or `writer_1_name` (for the first row's writer)
- `First Name` / `Last Name` or `writer_1_first_name` / `writer_1_last_name`
- `Share` or `writer_1_ownership`
- `Controlled (Y/N)` or `writer_1_controlled`
- `Content (Clean / Explicit / Neither)` or `content_rating`

### Step 3 -- Update the processing loop

Change the main loop from iterating over raw rows to iterating over grouped works:

- Insert one `copyrights` record per grouped work (not per row)
- Insert one `copyright_recordings` record per work (if ISRC exists)
- Insert **multiple** `copyright_writers` records per work -- one for each writer in the group
- Insert one `catalog_items` record per work
- The artist field uses the grouped work's `Main Artist` or falls back to the first writer's name

### Step 4 -- Update the download template

- Add the PAQ-style columns as aliases in the header
- Include a multi-row example in the template showing how grouping works (e.g., 2 rows for one work with 2 writers, then 3 rows for another work with 3 writers)
- Expand from 2 writer columns to support the grouped row format

### Step 5 -- Backward compatibility

The grouping logic is additive:
- **Old flat format** (one row per work with `writer_1_name`, `writer_2_name` columns): If every row has a title, no grouping occurs -- each row is its own work, and inline writer columns are still read. Works exactly as before.
- **PAQ grouped format** (multi-row): Rows without titles are detected as continuation rows and merged into the preceding work.

Both formats will work without the user needing to choose.

## File Changed

- `src/components/admin/subaccount/BulkWorksUpload.tsx` -- all changes in this single file

## What This Fixes

- Works with multiple writers are created as a single copyright with all writers attached
- No duplicate works from continuation rows
- Empty separator rows are safely skipped
- Supports 2+ writers per work (PAQ template shows works with up to 9 writers)
- Existing single-row-per-work uploads continue to work unchanged

