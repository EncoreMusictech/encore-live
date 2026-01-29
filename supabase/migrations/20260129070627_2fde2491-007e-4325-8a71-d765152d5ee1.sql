-- Fix: ensure the client-label INSERT policy applies to authenticated sessions
-- (Some PostgREST setups can behave unexpectedly when policy target role is PUBLIC only.)

CREATE POLICY "Publishing firms can create client labels (authenticated)"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  (company_type = 'client_label'::text)
  AND (parent_company_id IS NOT NULL)
  AND public.user_is_member_of_publishing_firm(auth.uid(), parent_company_id)
);
