-- Add client_company_id to contract_schedule_works for client isolation
ALTER TABLE public.contract_schedule_works
ADD COLUMN IF NOT EXISTS client_company_id uuid REFERENCES public.companies(id);

-- Add client_company_id to contract_interested_parties for client isolation
ALTER TABLE public.contract_interested_parties
ADD COLUMN IF NOT EXISTS client_company_id uuid REFERENCES public.companies(id);

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_contract_schedule_works_client_company_id 
ON public.contract_schedule_works(client_company_id);

CREATE INDEX IF NOT EXISTS idx_contract_interested_parties_client_company_id 
ON public.contract_interested_parties(client_company_id);

-- Create function to auto-populate client_company_id from parent contract
CREATE OR REPLACE FUNCTION public.set_contract_child_client_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get client_company_id from the parent contract
  SELECT client_company_id INTO NEW.client_company_id
  FROM public.contracts
  WHERE id = NEW.contract_id;
  
  RETURN NEW;
END;
$$;

-- Trigger for contract_schedule_works
DROP TRIGGER IF EXISTS set_schedule_work_client_company_id ON public.contract_schedule_works;
CREATE TRIGGER set_schedule_work_client_company_id
  BEFORE INSERT ON public.contract_schedule_works
  FOR EACH ROW
  WHEN (NEW.client_company_id IS NULL)
  EXECUTE FUNCTION public.set_contract_child_client_company_id();

-- Trigger for contract_interested_parties
DROP TRIGGER IF EXISTS set_interested_party_client_company_id ON public.contract_interested_parties;
CREATE TRIGGER set_interested_party_client_company_id
  BEFORE INSERT ON public.contract_interested_parties
  FOR EACH ROW
  WHEN (NEW.client_company_id IS NULL)
  EXECUTE FUNCTION public.set_contract_child_client_company_id();

-- Backfill existing records with client_company_id from their parent contracts
UPDATE public.contract_schedule_works csw
SET client_company_id = c.client_company_id
FROM public.contracts c
WHERE csw.contract_id = c.id
AND csw.client_company_id IS NULL
AND c.client_company_id IS NOT NULL;

UPDATE public.contract_interested_parties cip
SET client_company_id = c.client_company_id
FROM public.contracts c
WHERE cip.contract_id = c.id
AND cip.client_company_id IS NULL
AND c.client_company_id IS NOT NULL;

-- Create function to cascade client_company_id updates to child records
CREATE OR REPLACE FUNCTION public.cascade_contract_client_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update schedule works
  UPDATE public.contract_schedule_works
  SET client_company_id = NEW.client_company_id
  WHERE contract_id = NEW.id;
  
  -- Update interested parties
  UPDATE public.contract_interested_parties
  SET client_company_id = NEW.client_company_id
  WHERE contract_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger to cascade client_company_id changes
DROP TRIGGER IF EXISTS cascade_client_company_id_to_children ON public.contracts;
CREATE TRIGGER cascade_client_company_id_to_children
  AFTER UPDATE OF client_company_id ON public.contracts
  FOR EACH ROW
  WHEN (OLD.client_company_id IS DISTINCT FROM NEW.client_company_id)
  EXECUTE FUNCTION public.cascade_contract_client_company_id();