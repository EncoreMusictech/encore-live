-- Fix infinite recursion in company_users policies by completely recreating them
-- First, drop ALL existing policies on company_users
DROP POLICY IF EXISTS "Company users are viewable by company members" ON public.company_users;
DROP POLICY IF EXISTS "Company owners and admins can manage users" ON public.company_users;
DROP POLICY IF EXISTS "Users can view their own company memberships" ON public.company_users;
DROP POLICY IF EXISTS "Company owners can manage users" ON public.company_users;
DROP POLICY IF EXISTS "Users can insert themselves into companies" ON public.company_users;

-- Create simple, non-recursive policies
CREATE POLICY "Allow read own memberships" 
ON public.company_users FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Allow insert own membership" 
ON public.company_users FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can manage all company users" 
ON public.company_users FOR ALL 
USING (true) 
WITH CHECK (true);

-- Fix companies table policies too
DROP POLICY IF EXISTS "All authenticated users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Company creators can update companies" ON public.companies;

CREATE POLICY "System can manage all companies" 
ON public.companies FOR ALL 
USING (true) 
WITH CHECK (true);

-- Fix company_module_access policies
DROP POLICY IF EXISTS "All authenticated users can view module access" ON public.company_module_access;

CREATE POLICY "System can manage all company module access" 
ON public.company_module_access FOR ALL 
USING (true) 
WITH CHECK (true);