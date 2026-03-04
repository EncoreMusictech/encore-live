
-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage interested parties for their contracts" ON public.contract_interested_parties;

-- Create updated policy that allows:
-- 1. Contract owner (user_id matches)
-- 2. ENCORE team members (admins)
-- 3. Users in the same company as the contract owner
CREATE POLICY "Users can manage interested parties for their contracts"
ON public.contract_interested_parties
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM contracts
    WHERE contracts.id = contract_interested_parties.contract_id
    AND (
      contracts.user_id = auth.uid()
      OR public.is_encore_team()
      OR EXISTS (
        SELECT 1 FROM company_users cu1
        JOIN company_users cu2 ON cu1.company_id = cu2.company_id
        WHERE cu1.user_id = auth.uid()
        AND cu2.user_id = contracts.user_id
        AND cu1.status = 'active'
        AND cu2.status = 'active'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contracts
    WHERE contracts.id = contract_interested_parties.contract_id
    AND (
      contracts.user_id = auth.uid()
      OR public.is_encore_team()
      OR EXISTS (
        SELECT 1 FROM company_users cu1
        JOIN company_users cu2 ON cu1.company_id = cu2.company_id
        WHERE cu1.user_id = auth.uid()
        AND cu2.user_id = contracts.user_id
        AND cu1.status = 'active'
        AND cu2.status = 'active'
      )
    )
  )
);
