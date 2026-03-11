
-- Create migration_tracking_items table
CREATE TABLE public.migration_tracking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_name TEXT,
  administrator TEXT,
  original_publisher TEXT,
  writer_name TEXT NOT NULL,
  contract_entered BOOLEAN NOT NULL DEFAULT false,
  copyrights_entered BOOLEAN NOT NULL DEFAULT false,
  schedules_attached BOOLEAN NOT NULL DEFAULT false,
  payees_created BOOLEAN NOT NULL DEFAULT false,
  contract_terms_confirmed BOOLEAN NOT NULL DEFAULT false,
  payee_splits_confirmed BOOLEAN NOT NULL DEFAULT false,
  beginning_balance_entered BOOLEAN NOT NULL DEFAULT false,
  client_portal_created BOOLEAN NOT NULL DEFAULT false,
  client_assets_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.migration_tracking_items ENABLE ROW LEVEL SECURITY;

-- RLS: ENCORE team can read/write all rows
CREATE POLICY "ENCORE team full access"
  ON public.migration_tracking_items
  FOR ALL
  TO authenticated
  USING (public.is_encore_team())
  WITH CHECK (public.is_encore_team());

-- RLS: Company members can read their own company's tracking items
CREATE POLICY "Company members can read own tracking items"
  ON public.migration_tracking_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users
      WHERE company_users.company_id = migration_tracking_items.company_id
        AND company_users.user_id = auth.uid()
        AND company_users.status = 'active'
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_migration_tracking_items_updated_at
  BEFORE UPDATE ON public.migration_tracking_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
