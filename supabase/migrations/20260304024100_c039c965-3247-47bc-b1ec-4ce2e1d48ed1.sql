-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can manage schedule of works for their contracts" ON public.contract_schedule_works;

-- Create new policy that supports company membership (service accounts, sub-accounts)
CREATE POLICY "Users can manage schedule works for accessible contracts"
ON public.contract_schedule_works
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM contracts
    WHERE contracts.id = contract_schedule_works.contract_id
    AND (
      contracts.user_id = auth.uid()
      OR contracts.user_id IN (SELECT user_id FROM get_company_user_ids(auth.uid()))
      OR is_system_admin(auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contracts
    WHERE contracts.id = contract_schedule_works.contract_id
    AND (
      contracts.user_id = auth.uid()
      OR contracts.user_id IN (SELECT user_id FROM get_company_user_ids(auth.uid()))
      OR is_system_admin(auth.uid())
    )
  )
);