-- Fix critical RLS policy issues by restricting anonymous access where not intended

-- 1. Fix anonymous access to most user-specific tables by adding authenticated role check
-- Tables should only allow authenticated users access to their own data

-- Update RLS policies to require authentication
-- This addresses the "Anonymous Access Policies" warnings

-- Recreate policies for tables that should require authentication

-- catalog_valuations: Should only allow authenticated users
DROP POLICY IF EXISTS "Users can create their own valuations" ON public.catalog_valuations;
DROP POLICY IF EXISTS "Users can delete their own valuations" ON public.catalog_valuations;
DROP POLICY IF EXISTS "Users can update their own valuations" ON public.catalog_valuations;
DROP POLICY IF EXISTS "Users can view their own valuations" ON public.catalog_valuations;

CREATE POLICY "Authenticated users can create their own valuations" ON public.catalog_valuations
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own valuations" ON public.catalog_valuations
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own valuations" ON public.catalog_valuations
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own valuations" ON public.catalog_valuations
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- contacts: Should only allow authenticated users
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;

CREATE POLICY "Authenticated users can manage their own contacts" ON public.contacts
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contracts: Should only allow authenticated users
DROP POLICY IF EXISTS "Users can create their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can view their own contracts" ON public.contracts;

CREATE POLICY "Authenticated users can create their own contracts" ON public.contracts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own contracts" ON public.contracts
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own contracts" ON public.contracts
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own contracts" ON public.contracts
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Keep existing client portal access policy
CREATE POLICY "Clients can view assigned contracts" ON public.contracts
FOR SELECT TO authenticated USING (
  has_client_portal_access(auth.uid(), 'contracts'::text) 
  AND EXISTS (
    SELECT 1 FROM client_data_associations cda
    WHERE cda.client_user_id = auth.uid() 
    AND cda.data_type = 'contract'::text 
    AND cda.data_id = contracts.id
  )
);

-- copyrights: Should only allow authenticated users
DROP POLICY IF EXISTS "Users can create their own copyrights" ON public.copyrights;
DROP POLICY IF EXISTS "Users can delete their own copyrights" ON public.copyrights;
DROP POLICY IF EXISTS "Users can update their own copyrights" ON public.copyrights;
DROP POLICY IF EXISTS "Users can view their own copyrights" ON public.copyrights;

CREATE POLICY "Authenticated users can create their own copyrights" ON public.copyrights
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own copyrights" ON public.copyrights
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own copyrights" ON public.copyrights
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own copyrights" ON public.copyrights
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Keep existing client portal access policy
CREATE POLICY "Clients can view assigned copyrights" ON public.copyrights
FOR SELECT TO authenticated USING (
  has_client_portal_access(auth.uid(), 'copyright'::text) 
  AND EXISTS (
    SELECT 1 FROM client_data_associations cda
    WHERE cda.client_user_id = auth.uid() 
    AND cda.data_type = 'copyright'::text 
    AND cda.data_id = copyrights.id
  )
);

-- deal_scenarios: Should only allow authenticated users
DROP POLICY IF EXISTS "Users can create their own deal scenarios" ON public.deal_scenarios;
DROP POLICY IF EXISTS "Users can delete their own deal scenarios" ON public.deal_scenarios;
DROP POLICY IF EXISTS "Users can update their own deal scenarios" ON public.deal_scenarios;
DROP POLICY IF EXISTS "Users can view their own deal scenarios" ON public.deal_scenarios;

CREATE POLICY "Authenticated users can create their own deal scenarios" ON public.deal_scenarios
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own deal scenarios" ON public.deal_scenarios
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own deal scenarios" ON public.deal_scenarios
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own deal scenarios" ON public.deal_scenarios
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- payouts: Should only allow authenticated users
DROP POLICY IF EXISTS "Users can manage their own payouts" ON public.payouts;

CREATE POLICY "Authenticated users can manage their own payouts" ON public.payouts
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sync_licenses: Should only allow authenticated users
DROP POLICY IF EXISTS "Users can delete their own sync licenses" ON public.sync_licenses;
DROP POLICY IF EXISTS "Users can update their own sync licenses" ON public.sync_licenses;
DROP POLICY IF EXISTS "Users can view their own sync licenses" ON public.sync_licenses;

CREATE POLICY "Authenticated users can delete their own sync licenses" ON public.sync_licenses
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own sync licenses" ON public.sync_licenses
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own sync licenses" ON public.sync_licenses
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Keep existing client portal access policy
CREATE POLICY "Clients can view assigned sync licenses" ON public.sync_licenses
FOR SELECT TO authenticated USING (
  has_client_portal_access(auth.uid(), 'sync_licensing'::text) 
  AND EXISTS (
    SELECT 1 FROM client_data_associations cda
    WHERE cda.client_user_id = auth.uid() 
    AND cda.data_type = 'sync_license'::text 
    AND cda.data_id = sync_licenses.id
  )
);

-- Fix search_path security for existing functions that are missing it
-- This addresses the "Function Search Path Mutable" warnings

-- Update functions to have secure search_path
CREATE OR REPLACE FUNCTION public.calculate_contract_controlled_percentage(contract_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    total_controlled NUMERIC;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN controlled_status = 'C' THEN 
                GREATEST(performance_percentage, mechanical_percentage, synch_percentage)
            ELSE 0 
        END
    ), 0)
    INTO total_controlled
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param;
    
    RETURN total_controlled;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_contract_controlled_percentage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    contract_controlled_pct NUMERIC;
BEGIN
    -- Calculate the new controlled percentage
    contract_controlled_pct := public.calculate_contract_controlled_percentage(
        COALESCE(NEW.contract_id, OLD.contract_id)
    );
    
    -- Update the contract record
    UPDATE public.contracts
    SET controlled_percentage = contract_controlled_pct,
        updated_at = now()
    WHERE id = COALESCE(NEW.contract_id, OLD.contract_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_work_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_id text;
    counter integer := 1;
    max_attempts integer := 1000;
BEGIN
    LOOP
        new_id := 'WK' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::text, 6, '0');
        
        IF NOT EXISTS (SELECT 1 FROM public.copyrights WHERE work_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        
        IF counter > max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique work ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$function$;