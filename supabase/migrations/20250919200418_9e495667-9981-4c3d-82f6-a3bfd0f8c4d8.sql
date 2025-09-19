-- Remove all problematic policies from companies table that cause recursion
DROP POLICY IF EXISTS "Companies are viewable by their members" ON public.companies;
DROP POLICY IF EXISTS "Company owners and admins can update company info" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- The "System can manage all companies" policy should already exist and be sufficient