
-- Phase 1a: Create contract_work_interested_parties table
CREATE TABLE public.contract_work_interested_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contract_schedule_work_id uuid NOT NULL REFERENCES public.contract_schedule_works(id) ON DELETE CASCADE,
  party_id uuid NOT NULL,
  party_name text NOT NULL,
  party_type text NOT NULL DEFAULT 'writer',
  controlled_status text NOT NULL DEFAULT 'NC',
  performance_percentage numeric(7,4) NOT NULL DEFAULT 0,
  mechanical_percentage numeric(7,4) NOT NULL DEFAULT 0,
  synch_percentage numeric(7,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_schedule_work_id, party_id)
);

ALTER TABLE public.contract_work_interested_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage work parties via contract ownership"
  ON public.contract_work_interested_parties
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_work_interested_parties.contract_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_work_interested_parties.contract_id
        AND c.user_id = auth.uid()
    )
  );

-- Phase 1b: Add 4 nullable columns to royalty_allocations
ALTER TABLE public.royalty_allocations
  ADD COLUMN IF NOT EXISTS contract_schedule_work_id uuid REFERENCES public.contract_schedule_works(id),
  ADD COLUMN IF NOT EXISTS line_type text,
  ADD COLUMN IF NOT EXISTS revenue_type_confidence text,
  ADD COLUMN IF NOT EXISTS rights_basis text;

-- Phase 1c: Guardrail validation trigger
CREATE OR REPLACE FUNCTION public.validate_royalty_allocation_enums()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Validate revenue_type
  IF NEW.revenue_type IS NOT NULL AND NEW.revenue_type NOT IN ('performance', 'mechanical', 'synch', 'other') THEN
    RAISE EXCEPTION 'Invalid revenue_type: %. Must be one of: performance, mechanical, synch, other', NEW.revenue_type;
  END IF;

  -- Validate line_type
  IF NEW.line_type IS NOT NULL AND NEW.line_type NOT IN ('royalty', 'fee', 'adjustment', 'withholding', 'recoupment') THEN
    RAISE EXCEPTION 'Invalid line_type: %. Must be one of: royalty, fee, adjustment, withholding, recoupment', NEW.line_type;
  END IF;

  -- Validate revenue_type_confidence
  IF NEW.revenue_type_confidence IS NOT NULL AND NEW.revenue_type_confidence NOT IN ('high', 'medium', 'low') THEN
    RAISE EXCEPTION 'Invalid revenue_type_confidence: %. Must be one of: high, medium, low', NEW.revenue_type_confidence;
  END IF;

  -- Validate rights_basis
  IF NEW.rights_basis IS NOT NULL AND NEW.rights_basis NOT IN ('ownership_split_by_right_type', 'exclude_from_splits') THEN
    RAISE EXCEPTION 'Invalid rights_basis: %. Must be one of: ownership_split_by_right_type, exclude_from_splits', NEW.rights_basis;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_royalty_allocation_enums
  BEFORE INSERT OR UPDATE ON public.royalty_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_royalty_allocation_enums();
