-- Ensure the membership check used by companies INSERT policy can read required tables
-- (security definer functions may still be affected by RLS depending on ownership/role)
CREATE OR REPLACE FUNCTION public.user_is_member_of_publishing_firm(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    JOIN public.companies c ON c.id = cu.company_id
    WHERE cu.user_id = _user_id
      AND cu.company_id = _company_id
      AND cu.status = 'active'
      AND c.company_type = 'publishing_firm'
  );
$$;