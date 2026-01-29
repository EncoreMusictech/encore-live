-- Create a security definer function to check if user is a member of a publishing firm
CREATE OR REPLACE FUNCTION public.user_is_member_of_publishing_firm(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    JOIN public.companies c ON c.id = cu.company_id
    WHERE cu.user_id = _user_id
      AND cu.company_id = _company_id
      AND cu.status = 'active'
      AND c.company_type = 'publishing_firm'
  )
$$;

-- Add INSERT policy for companies table to allow publishing firms to create client labels
CREATE POLICY "Publishing firms can create client labels"
ON public.companies
FOR INSERT
WITH CHECK (
  -- Allow insert if:
  -- 1. The company being created is a client_label
  -- 2. The parent_company_id is set
  -- 3. The user is an active member of that parent publishing firm
  company_type = 'client_label'
  AND parent_company_id IS NOT NULL
  AND public.user_is_member_of_publishing_firm(auth.uid(), parent_company_id)
);