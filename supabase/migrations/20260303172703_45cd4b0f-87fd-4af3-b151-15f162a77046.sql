
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
