
-- Drop and recreate policies to include service account user IDs

DROP POLICY IF EXISTS "Users can manage original publishers in their company" ON original_publishers;
CREATE POLICY "Users can manage original publishers in their company"
ON original_publishers FOR ALL
USING (
  user_id = auth.uid()
  OR user_id IN (SELECT user_id FROM get_company_user_ids(auth.uid()))
  OR user_id IN (
    SELECT csa.service_user_id FROM company_service_accounts csa
    INNER JOIN company_users cu ON cu.company_id = csa.company_id
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT user_id FROM get_company_user_ids(auth.uid()))
  OR user_id IN (
    SELECT csa.service_user_id FROM company_service_accounts csa
    INNER JOIN company_users cu ON cu.company_id = csa.company_id
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
);

DROP POLICY IF EXISTS "Users can manage writers in their company" ON writers;
CREATE POLICY "Users can manage writers in their company"
ON writers FOR ALL
USING (
  user_id = auth.uid()
  OR user_id IN (SELECT user_id FROM get_company_user_ids(auth.uid()))
  OR user_id IN (
    SELECT csa.service_user_id FROM company_service_accounts csa
    INNER JOIN company_users cu ON cu.company_id = csa.company_id
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT user_id FROM get_company_user_ids(auth.uid()))
  OR user_id IN (
    SELECT csa.service_user_id FROM company_service_accounts csa
    INNER JOIN company_users cu ON cu.company_id = csa.company_id
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
);

DROP POLICY IF EXISTS "Users can manage payees in their company" ON payees;
CREATE POLICY "Users can manage payees in their company"
ON payees FOR ALL
USING (
  user_id = auth.uid()
  OR user_id IN (SELECT user_id FROM get_company_user_ids(auth.uid()))
  OR user_id IN (
    SELECT csa.service_user_id FROM company_service_accounts csa
    INNER JOIN company_users cu ON cu.company_id = csa.company_id
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR user_id IN (SELECT user_id FROM get_company_user_ids(auth.uid()))
  OR user_id IN (
    SELECT csa.service_user_id FROM company_service_accounts csa
    INNER JOIN company_users cu ON cu.company_id = csa.company_id
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
);
