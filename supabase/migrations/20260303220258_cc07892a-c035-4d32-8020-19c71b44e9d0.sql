
-- Update original_publishers RLS to allow company members to manage records
DROP POLICY IF EXISTS "Users can manage their own original publishers" ON original_publishers;

CREATE POLICY "Users can manage original publishers in their company"
ON original_publishers
FOR ALL
USING (
  user_id IN (
    SELECT user_id FROM get_company_user_ids(auth.uid())
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id FROM get_company_user_ids(auth.uid())
  )
);

-- Update writers RLS to allow company members to manage records
DROP POLICY IF EXISTS "Users can manage their own writers" ON writers;

CREATE POLICY "Users can manage writers in their company"
ON writers
FOR ALL
USING (
  user_id IN (
    SELECT user_id FROM get_company_user_ids(auth.uid())
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id FROM get_company_user_ids(auth.uid())
  )
);

-- Also fix payees WITH CHECK to allow service account writes
DROP POLICY IF EXISTS "Users can manage payees in their company" ON payees;

CREATE POLICY "Users can manage payees in their company"
ON payees
FOR ALL
USING (
  user_id IN (
    SELECT user_id FROM get_company_user_ids(auth.uid())
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id FROM get_company_user_ids(auth.uid())
  )
);
