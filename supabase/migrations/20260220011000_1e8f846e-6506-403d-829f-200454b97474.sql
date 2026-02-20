
-- ============================================================
-- Phase 1: Multi-Entity Architecture for PAQ Publishing
-- ============================================================

-- 1. New table: publishing_entities
CREATE TABLE public.publishing_entities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text,
  administrator text,
  administrator_type text,
  ipi_number text,
  cae_number text,
  pro_affiliation text,
  territory text[],
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_publishing_entities_company_id ON public.publishing_entities(company_id);
CREATE INDEX idx_publishing_entities_status ON public.publishing_entities(status);

ALTER TABLE public.publishing_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view publishing entities"
  ON public.publishing_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = publishing_entities.company_id
        AND cu.user_id = auth.uid()
        AND cu.status = 'active'
    )
    OR public.is_operations_team_member(auth.uid())
  );

CREATE POLICY "Company admins can manage publishing entities"
  ON public.publishing_entities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = publishing_entities.company_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'admin'
        AND cu.status = 'active'
    )
    OR public.is_operations_team_member(auth.uid())
  );

-- 2. New table: entity_advance_ledger
CREATE TABLE public.entity_advance_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publishing_entity_id uuid NOT NULL REFERENCES public.publishing_entities(id) ON DELETE RESTRICT,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  advance_type text NOT NULL DEFAULT 'initial',
  advance_amount numeric NOT NULL,
  recouped_amount numeric NOT NULL DEFAULT 0,
  balance_remaining numeric GENERATED ALWAYS AS (advance_amount - recouped_amount) STORED,
  effective_date date,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_entity_advance_ledger_entity ON public.entity_advance_ledger(publishing_entity_id);
CREATE INDEX idx_entity_advance_ledger_company ON public.entity_advance_ledger(company_id);
CREATE INDEX idx_entity_advance_ledger_contract ON public.entity_advance_ledger(contract_id);
CREATE INDEX idx_entity_advance_ledger_status ON public.entity_advance_ledger(status);

ALTER TABLE public.entity_advance_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view advance ledger"
  ON public.entity_advance_ledger FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = entity_advance_ledger.company_id
        AND cu.user_id = auth.uid()
        AND cu.status = 'active'
    )
    OR public.is_operations_team_member(auth.uid())
  );

CREATE POLICY "Company admins can manage advance ledger"
  ON public.entity_advance_ledger FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = entity_advance_ledger.company_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'admin'
        AND cu.status = 'active'
    )
    OR public.is_operations_team_member(auth.uid())
  );

-- 3. New table: entity_user_access
CREATE TABLE public.entity_user_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publishing_entity_id uuid NOT NULL REFERENCES public.publishing_entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_level text NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(publishing_entity_id, user_id)
);

CREATE INDEX idx_entity_user_access_user ON public.entity_user_access(user_id);
CREATE INDEX idx_entity_user_access_entity ON public.entity_user_access(publishing_entity_id);

ALTER TABLE public.entity_user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage entity user access"
  ON public.entity_user_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.publishing_entities pe
      JOIN public.company_users cu ON cu.company_id = pe.company_id
      WHERE pe.id = entity_user_access.publishing_entity_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'admin'
        AND cu.status = 'active'
    )
    OR public.is_operations_team_member(auth.uid())
  );

CREATE POLICY "Users can view their own entity access"
  ON public.entity_user_access FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_operations_team_member(auth.uid())
  );

-- 4. Add publishing_entity_id FK to existing tables
ALTER TABLE public.contracts
  ADD COLUMN publishing_entity_id uuid REFERENCES public.publishing_entities(id) ON DELETE SET NULL;
CREATE INDEX idx_contracts_publishing_entity ON public.contracts(publishing_entity_id);

ALTER TABLE public.copyrights
  ADD COLUMN publishing_entity_id uuid REFERENCES public.publishing_entities(id) ON DELETE SET NULL;
CREATE INDEX idx_copyrights_publishing_entity ON public.copyrights(publishing_entity_id);

ALTER TABLE public.royalty_allocations
  ADD COLUMN publishing_entity_id uuid REFERENCES public.publishing_entities(id) ON DELETE SET NULL;
CREATE INDEX idx_royalty_allocations_publishing_entity ON public.royalty_allocations(publishing_entity_id);

ALTER TABLE public.payees
  ADD COLUMN publishing_entity_id uuid REFERENCES public.publishing_entities(id) ON DELETE SET NULL;
CREATE INDEX idx_payees_publishing_entity ON public.payees(publishing_entity_id);

ALTER TABLE public.payout_expenses
  ADD COLUMN publishing_entity_id uuid REFERENCES public.publishing_entities(id) ON DELETE SET NULL;
CREATE INDEX idx_payout_expenses_publishing_entity ON public.payout_expenses(publishing_entity_id);

ALTER TABLE public.reconciliation_batches
  ADD COLUMN publishing_entity_id uuid REFERENCES public.publishing_entities(id) ON DELETE SET NULL;
CREATE INDEX idx_reconciliation_batches_publishing_entity ON public.reconciliation_batches(publishing_entity_id);

-- 5. Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_publishing_entities_updated_at()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_publishing_entities_updated_at
  BEFORE UPDATE ON public.publishing_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_publishing_entities_updated_at();

CREATE OR REPLACE FUNCTION public.update_entity_advance_ledger_updated_at()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_entity_advance_ledger_updated_at
  BEFORE UPDATE ON public.entity_advance_ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_entity_advance_ledger_updated_at();

-- 6. Consolidated reporting function
CREATE OR REPLACE FUNCTION public.get_company_consolidated_report(p_company_id uuid)
  RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'entities', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'entity_id', pe.id,
        'name', pe.name,
        'administrator', pe.administrator,
        'administrator_type', pe.administrator_type,
        'status', pe.status,
        'total_advances', COALESCE((SELECT SUM(eal.advance_amount) FROM public.entity_advance_ledger eal WHERE eal.publishing_entity_id = pe.id), 0),
        'total_recouped', COALESCE((SELECT SUM(eal.recouped_amount) FROM public.entity_advance_ledger eal WHERE eal.publishing_entity_id = pe.id), 0),
        'balance_remaining', COALESCE((SELECT SUM(eal.balance_remaining) FROM public.entity_advance_ledger eal WHERE eal.publishing_entity_id = pe.id AND eal.status = 'active'), 0),
        'contract_count', (SELECT COUNT(*) FROM public.contracts c WHERE c.publishing_entity_id = pe.id),
        'copyright_count', (SELECT COUNT(*) FROM public.copyrights cr WHERE cr.publishing_entity_id = pe.id)
      ))
      FROM public.publishing_entities pe
      WHERE pe.company_id = p_company_id AND pe.status = 'active'
    ), '[]'::jsonb),
    'generated_at', now()
  ) INTO result;
  RETURN result;
END;
$$;
