
-- Trigger function to auto-resolve publishing_entity_id from the administrator field
-- when a contract is inserted or updated without an explicit publishing_entity_id
CREATE OR REPLACE FUNCTION public.resolve_contract_publishing_entity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_id uuid;
BEGIN
  -- Only resolve if publishing_entity_id is not already set and we have a client_company_id
  IF NEW.publishing_entity_id IS NULL AND NEW.client_company_id IS NOT NULL THEN
    -- Try to match by administrator name against publishing_entities name or display_name
    IF NEW.administrator IS NOT NULL AND NEW.administrator <> '' THEN
      SELECT id INTO resolved_id
      FROM public.publishing_entities
      WHERE company_id = NEW.client_company_id
        AND status = 'active'
        AND (
          lower(trim(name)) = lower(trim(NEW.administrator))
          OR lower(trim(display_name)) = lower(trim(NEW.administrator))
        )
      LIMIT 1;

      IF resolved_id IS NOT NULL THEN
        NEW.publishing_entity_id := resolved_id;
        RETURN NEW;
      END IF;
    END IF;

    -- Fallback: if the company has exactly one active entity, use it
    SELECT id INTO resolved_id
    FROM public.publishing_entities
    WHERE company_id = NEW.client_company_id
      AND status = 'active'
    HAVING count(*) = 1;

    IF resolved_id IS NOT NULL THEN
      NEW.publishing_entity_id := resolved_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach the trigger to contracts table (before insert or update)
DROP TRIGGER IF EXISTS trg_resolve_contract_publishing_entity ON public.contracts;
CREATE TRIGGER trg_resolve_contract_publishing_entity
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.resolve_contract_publishing_entity();
