
-- Fix company_service_accounts RLS policy that directly queries auth.users
-- This causes "permission denied for table users" errors cascading to all tables
-- whose RLS policies subquery company_service_accounts

DROP POLICY IF EXISTS "Admins can manage company service accounts" ON company_service_accounts;

CREATE POLICY "Admins can manage company service accounts"
ON company_service_accounts FOR ALL
USING (
  is_system_admin(auth.uid())
  OR (EXISTS (
    SELECT 1
    FROM company_users cu
    WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_service_accounts.company_id
      AND cu.status = 'active'
  ))
)
WITH CHECK (
  is_system_admin(auth.uid())
  OR (EXISTS (
    SELECT 1
    FROM company_users cu
    WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_service_accounts.company_id
      AND cu.status = 'active'
  ))
);
