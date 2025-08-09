-- Create contract_templates table for saving user templates
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- Users can view their own templates
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contract_templates' AND policyname = 'Users can view their own templates'
  ) THEN
    CREATE POLICY "Users can view their own templates"
      ON public.contract_templates
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can manage their own templates (insert/update/delete)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contract_templates' AND policyname = 'Users can manage their own templates'
  ) THEN
    CREATE POLICY "Users can manage their own templates"
      ON public.contract_templates
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Function to set user_id automatically
CREATE OR REPLACE FUNCTION public.set_user_id_for_contract_templates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Update updated_at
CREATE OR REPLACE FUNCTION public.update_contract_templates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS trg_set_user_id_for_contract_templates ON public.contract_templates;
CREATE TRIGGER trg_set_user_id_for_contract_templates
BEFORE INSERT ON public.contract_templates
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_for_contract_templates();

DROP TRIGGER IF EXISTS trg_update_contract_templates_updated_at ON public.contract_templates;
CREATE TRIGGER trg_update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW EXECUTE FUNCTION public.update_contract_templates_updated_at();