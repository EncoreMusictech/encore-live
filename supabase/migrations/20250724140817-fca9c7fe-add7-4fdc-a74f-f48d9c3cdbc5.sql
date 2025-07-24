-- Fix critical RLS policy issues by restricting anonymous access where not intended
-- Drop existing policies first to avoid conflicts

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
DROP POLICY IF EXISTS "Clients can view assigned contracts" ON public.contracts;

CREATE POLICY "Authenticated users can create their own contracts" ON public.contracts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own contracts" ON public.contracts
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own contracts" ON public.contracts
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own contracts" ON public.contracts
FOR SELECT TO authenticated USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Clients can view assigned copyrights" ON public.copyrights;

CREATE POLICY "Authenticated users can create their own copyrights" ON public.copyrights
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own copyrights" ON public.copyrights
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own copyrights" ON public.copyrights
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own copyrights" ON public.copyrights
FOR SELECT TO authenticated USING (auth.uid() = user_id);

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