

## Enhance Checkpoint Breakdown with Charts & Missing Data Report

### What Changes

**1. Checkpoint Breakdown Charts** — Replace the plain text percentages in both `SuccessAnalyticsDashboard` and `MigrationTracker` with Recharts visualizations:
- **Bar chart**: Horizontal bars for each of the 9 checkpoints showing completion % (color-coded green/yellow/red by threshold)
- **Radial/Pie chart**: Overall completion donut in the summary card
- **Stacked bar per entity**: Shows each entity's checkpoint completion side-by-side

**2. Missing Information Report** — A "Run Report" button that generates a filterable table of all incomplete items:
- Groups by checkpoint type (e.g., "Missing Payees", "Missing Schedules")
- Each group lists the writers who are missing that checkpoint, with entity and administrator info
- Export to CSV option so admins can share the gap analysis externally
- Rendered in a dialog or collapsible section

### Files

- **Modify**: `src/components/operations/phase6/SuccessAnalyticsDashboard.tsx` — Add Recharts bar chart for checkpoint stats, donut for overall, stacked bars for entity breakdown, and a "Run Report" button that opens a missing-data dialog
- **Modify**: `src/components/admin/subaccount/MigrationTracker.tsx` — Add the same bar chart to the "Checkpoint Breakdown" card and a "Run Report" button in the controls bar
- **Create**: `src/components/admin/subaccount/MissingDataReportDialog.tsx` — Dialog component that computes and displays all incomplete checkpoints grouped by type, with CSV export via PapaParse

### Technical Details

- Uses `recharts` `BarChart` (horizontal via `layout="vertical"`) and `PieChart` with inner radius for the donut — both already available in the project
- Missing data report computed client-side from the existing `items` array — no new queries needed
- CSV export uses `papaparse` `unparse()` to generate a downloadable `.csv` with columns: Writer, Entity, Administrator, Missing Checkpoints

