
CREATE TABLE public.bulk_contract_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  total_contracts INTEGER DEFAULT 0,
  successful_contracts INTEGER DEFAULT 0,
  updated_contracts INTEGER DEFAULT 0,
  skipped_contracts INTEGER DEFAULT 0,
  failed_contracts INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  error_log JSONB DEFAULT '[]'::jsonb,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bulk_contract_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bulk contract import jobs"
  ON public.bulk_contract_import_jobs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert bulk contract import jobs"
  ON public.bulk_contract_import_jobs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update bulk contract import jobs"
  ON public.bulk_contract_import_jobs
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can delete bulk contract import jobs"
  ON public.bulk_contract_import_jobs
  FOR DELETE TO authenticated
  USING (true);
