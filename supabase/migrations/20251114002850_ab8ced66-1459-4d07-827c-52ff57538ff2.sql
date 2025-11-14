-- =====================================================
-- COMPREHENSIVE RLS POLICIES FOR SUB-ACCOUNT ISOLATION
-- =====================================================
-- This migration adds server-side data isolation to prevent
-- data leakage between sub-accounts and ensures only authorized
-- users can access data belonging to their company.

-- =====================================================
-- STEP 1: Create Security Definer Functions
-- =====================================================
-- These functions prevent infinite recursion in RLS policies

-- Function to check if user is a system super admin (Encore team)
CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  );
$$;

-- Function to get all company IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid)
RETURNS TABLE(company_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM company_users
  WHERE user_id = _user_id
    AND status = 'active';
$$;

-- Function to get all user IDs within the same companies as the given user
CREATE OR REPLACE FUNCTION public.get_company_user_ids(_user_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cu2.user_id
  FROM company_users cu1
  INNER JOIN company_users cu2 ON cu1.company_id = cu2.company_id
  WHERE cu1.user_id = _user_id
    AND cu1.status = 'active'
    AND cu2.status = 'active';
$$;

-- Function to check if user belongs to a specific company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM company_users
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND status = 'active'
  );
$$;

-- =====================================================
-- STEP 2: Fix Critical Public Tables
-- =====================================================

-- Fix company_users table (currently public - CRITICAL!)
DROP POLICY IF EXISTS "System can manage all company users" ON public.company_users;
DROP POLICY IF EXISTS "Allow read own memberships" ON public.company_users;
DROP POLICY IF EXISTS "Allow insert own membership" ON public.company_users;

CREATE POLICY "System admins can manage all company users"
ON public.company_users
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can view their own company memberships"
ON public.company_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_system_admin(auth.uid()));

CREATE POLICY "Users can insert their own company membership"
ON public.company_users
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix companies table (currently public - CRITICAL!)
DROP POLICY IF EXISTS "System can manage all companies" ON public.companies;

CREATE POLICY "System admins can manage all companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can view their own companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  public.is_system_admin(auth.uid()) OR
  id IN (SELECT company_id FROM public.get_user_company_ids(auth.uid()))
);

-- =====================================================
-- STEP 3: Update Core Data Tables with Company Filtering
-- =====================================================

-- Contacts table
DROP POLICY IF EXISTS "Authenticated users can manage their own contacts" ON public.contacts;

CREATE POLICY "System admins can manage all contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage contacts in their company"
ON public.contacts
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Copyrights table
DROP POLICY IF EXISTS "Authenticated users can create their own copyrights" ON public.copyrights;
DROP POLICY IF EXISTS "Authenticated users can delete their own copyrights" ON public.copyrights;
DROP POLICY IF EXISTS "Authenticated users can update their own copyrights" ON public.copyrights;
DROP POLICY IF EXISTS "Authenticated users can view their own copyrights" ON public.copyrights;

CREATE POLICY "System admins can manage all copyrights"
ON public.copyrights
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage copyrights in their company"
ON public.copyrights
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Contracts table
DROP POLICY IF EXISTS "Authenticated users can create their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can delete their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can update their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can view their own contracts" ON public.contracts;

CREATE POLICY "System admins can manage all contracts"
ON public.contracts
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage contracts in their company"
ON public.contracts
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Payouts table
DROP POLICY IF EXISTS "Users can manage their own payouts" ON public.payouts;

CREATE POLICY "System admins can manage all payouts"
ON public.payouts
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage payouts in their company"
ON public.payouts
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Payout Expenses table
DROP POLICY IF EXISTS "Users can manage their own payout expenses" ON public.payout_expenses;

CREATE POLICY "System admins can manage all payout expenses"
ON public.payout_expenses
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage payout expenses in their company"
ON public.payout_expenses
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Payees table
DROP POLICY IF EXISTS "Users can manage their own payees" ON public.payees;

CREATE POLICY "System admins can manage all payees"
ON public.payees
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage payees in their company"
ON public.payees
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Sync Licenses table
DROP POLICY IF EXISTS "Users can create their own sync licenses" ON public.sync_licenses;
DROP POLICY IF EXISTS "Users can update their own sync licenses" ON public.sync_licenses;
DROP POLICY IF EXISTS "Users can view their own sync licenses" ON public.sync_licenses;
DROP POLICY IF EXISTS "Users can delete their own sync licenses" ON public.sync_licenses;

CREATE POLICY "System admins can manage all sync licenses"
ON public.sync_licenses
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage sync licenses in their company"
ON public.sync_licenses
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Notifications table
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "System admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can view notifications in their company"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Copyright Activity Logs table
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.copyright_activity_logs;
DROP POLICY IF EXISTS "System can create activity logs" ON public.copyright_activity_logs;

CREATE POLICY "System admins can view all activity logs"
ON public.copyright_activity_logs
FOR SELECT
TO authenticated
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can view activity logs in their company"
ON public.copyright_activity_logs
FOR SELECT
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
);

CREATE POLICY "System can create activity logs"
ON public.copyright_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Royalty Allocations table
DROP POLICY IF EXISTS "Users can manage their own royalty allocations" ON public.royalty_allocations;

CREATE POLICY "System admins can manage all royalty allocations"
ON public.royalty_allocations
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage royalty allocations in their company"
ON public.royalty_allocations
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Historical Statements table
DROP POLICY IF EXISTS "Users can manage their own historical statements" ON public.deal_historical_statements;

CREATE POLICY "System admins can manage all historical statements"
ON public.deal_historical_statements
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage historical statements in their company"
ON public.deal_historical_statements
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- Catalog Valuations table
DROP POLICY IF EXISTS "Authenticated users can create their own valuations" ON public.catalog_valuations;
DROP POLICY IF EXISTS "Authenticated users can delete their own valuations" ON public.catalog_valuations;
DROP POLICY IF EXISTS "Authenticated users can update their own valuations" ON public.catalog_valuations;
DROP POLICY IF EXISTS "Authenticated users can view their own valuations" ON public.catalog_valuations;

CREATE POLICY "System admins can manage all valuations"
ON public.catalog_valuations
FOR ALL
TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "Users can manage valuations in their company"
ON public.catalog_valuations
FOR ALL
TO authenticated
USING (
  user_id IN (SELECT user_id FROM public.get_company_user_ids(auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
);

-- =====================================================
-- STEP 4: Add Comments for Documentation
-- =====================================================

COMMENT ON FUNCTION public.is_system_admin IS 'Security definer function to check if user is a system super admin (Encore team)';
COMMENT ON FUNCTION public.get_user_company_ids IS 'Security definer function to get all company IDs for a user';
COMMENT ON FUNCTION public.get_company_user_ids IS 'Security definer function to get all user IDs in the same companies as the given user';
COMMENT ON FUNCTION public.user_belongs_to_company IS 'Security definer function to check if user belongs to a specific company';