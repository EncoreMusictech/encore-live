

## Plan: Delete Bulk-Imported Works by Selecting Bulk Jobs

### Problem
Currently there's no way to identify which works belong to which bulk upload job. Works are uploaded individually with `metadata.bulk_upload: true` but no job/batch identifier. Users need to select an entire bulk job and delete all associated works at once.

### Approach

**1. Create a `bulk_upload_jobs` table** (database migration)
- Columns: `id`, `company_id`, `file_name`, `uploaded_by`, `total_works`, `successful_works`, `failed_works`, `status`, `created_at`
- This tracks each bulk upload session

**2. Add `bulk_upload_job_id` to `catalog_items` and `copyrights`** (database migration)
- Nullable UUID foreign key referencing `bulk_upload_jobs.id`
- Allows tracing every work back to its upload job

**3. Update `BulkWorksUpload.tsx`**
- Before processing works, create a `bulk_upload_jobs` record with file name, company, and counts
- Pass the `job_id` into each `catalog_items` and `copyrights` insert
- Update the job record with final success/fail counts on completion

**4. Add a "Delete by Job" UI in `AssignedWorksList.tsx`**
- Add a dropdown/dialog that lists bulk upload jobs for this company (fetched from `bulk_upload_jobs`)
- Each job shows: file name, date, work count
- User selects a job → confirmation dialog → system deletes all `catalog_items` and `copyrights` with that `bulk_upload_job_id`, plus cascading cleanup of `copyright_writers`, `copyright_publishers`, `copyright_recordings`, and `contract_schedule_works`
- After deletion, remove the job record itself

**5. Alternatively, expose in `SubAccountWorks.tsx`**
- Add a third tab "Upload History" showing past bulk jobs with a delete button per job

### Database Migration

```sql
-- Create bulk upload jobs tracking table
CREATE TABLE public.bulk_upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_works INTEGER DEFAULT 0,
  successful_works INTEGER DEFAULT 0,
  failed_works INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bulk_upload_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their upload jobs"
  ON public.bulk_upload_jobs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Add job reference to catalog_items
ALTER TABLE public.catalog_items
  ADD COLUMN bulk_upload_job_id UUID REFERENCES public.bulk_upload_jobs(id) ON DELETE SET NULL;

-- Add job reference to copyrights
ALTER TABLE public.copyrights
  ADD COLUMN bulk_upload_job_id UUID REFERENCES public.bulk_upload_jobs(id) ON DELETE SET NULL;
```

### Files to Modify

- **`src/components/admin/subaccount/BulkWorksUpload.tsx`** — Create job record before processing; tag each insert with `bulk_upload_job_id`; update job on completion
- **`src/components/admin/subaccount/SubAccountWorks.tsx`** — Add "Upload History" tab
- **New file: `src/components/admin/subaccount/BulkUploadHistory.tsx`** — List of past bulk jobs with delete-by-job functionality. Each row shows file name, date, success/fail counts, and a delete button that cascades through catalog_items → copyrights → writers/publishers/recordings → contract_schedule_works

### Deletion Flow
When user clicks "Delete Job":
1. Fetch all `copyrights` with matching `bulk_upload_job_id` → get their IDs
2. Delete from `contract_schedule_works` where `copyright_id` in those IDs
3. Delete from `copyright_writers`, `copyright_publishers`, `copyright_recordings` where `copyright_id` in those IDs
4. Delete from `copyrights` where `bulk_upload_job_id` matches
5. Delete from `catalog_items` where `bulk_upload_job_id` matches
6. Delete the `bulk_upload_jobs` record itself

