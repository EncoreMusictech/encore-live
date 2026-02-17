
CREATE TABLE IF NOT EXISTS public.company_service_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_user_id uuid NOT NULL,
  service_email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_service_accounts ENABLE ROW LEVEL SECURITY;

-- Use inline check to avoid function overload ambiguity
CREATE POLICY "Admins can manage company service accounts"
  ON public.company_service_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN ('info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN ('info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.update_company_service_accounts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_service_accounts_updated_at ON public.company_service_accounts;
CREATE TRIGGER trg_company_service_accounts_updated_at
  BEFORE UPDATE ON public.company_service_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_company_service_accounts_updated_at();

CREATE OR REPLACE FUNCTION public.get_company_service_account_user_id(_company_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT service_user_id
  FROM public.company_service_accounts
  WHERE company_id = _company_id;
$$;
