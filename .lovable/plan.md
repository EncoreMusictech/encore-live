

## Plan: Review Failed Works in Upload History

### Problem
When a bulk upload has failures (e.g., 9 of 622), users have no way to see *which* works failed or *why*. The failure details (`failedRows` array) are only logged to `platform_error_logs` and never persisted on the job record.

### Approach

**1. Add `error_log` JSONB column to `bulk_upload_jobs`** (migration)
- Stores the `failedRows` array: `[{ row, title, error, details }]`

**2. Update `BulkWorksUpload.tsx`**
- When updating the job record on completion, also save `failedRows` into the new `error_log` column

**3. Update `BulkUploadHistory.tsx`**
- Make each job row clickable (or add an expand/details button) when `failed_works > 0`
- Show a collapsible panel or dialog listing each failed work with: row number, work title, and error reason
- Include the error log in the fetched data from `bulk_upload_jobs`

### Database Migration
```sql
ALTER TABLE public.bulk_upload_jobs
  ADD COLUMN error_log JSONB DEFAULT '[]'::jsonb;
```

### File Changes

- **Migration file** — Add `error_log` JSONB column
- **`BulkWorksUpload.tsx`** (~line 450) — Include `error_log: failedRows` in the job update call
- **`BulkUploadHistory.tsx`** — Add `error_log` to the interface and fetch; render a expandable failure details table per job showing row numbers, titles, and error messages

