
-- Allow company members to view their own company's onboarding progress
CREATE POLICY "Company members can view their onboarding progress"
ON public.client_onboarding_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = client_onboarding_progress.company_id
      AND cu.user_id = auth.uid()
      AND cu.status = 'active'
  )
);

-- Allow company members to view their own company's onboarding checklist
CREATE POLICY "Company members can view their onboarding checklist"
ON public.client_onboarding_checklist
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = client_onboarding_checklist.company_id
      AND cu.user_id = auth.uid()
      AND cu.status = 'active'
  )
);

-- Allow company members to toggle checklist items (insert/delete)
CREATE POLICY "Company members can insert onboarding checklist"
ON public.client_onboarding_checklist
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = client_onboarding_checklist.company_id
      AND cu.user_id = auth.uid()
      AND cu.status = 'active'
  )
);

CREATE POLICY "Company members can delete onboarding checklist"
ON public.client_onboarding_checklist
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = client_onboarding_checklist.company_id
      AND cu.user_id = auth.uid()
      AND cu.status = 'active'
  )
);

CREATE POLICY "Company members can update onboarding checklist"
ON public.client_onboarding_checklist
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = client_onboarding_checklist.company_id
      AND cu.user_id = auth.uid()
      AND cu.status = 'active'
  )
);
