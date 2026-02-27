-- Allow admins to delete catalog items
CREATE POLICY "Admins can delete catalog items"
ON public.catalog_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow users to delete their own catalog items
CREATE POLICY "Users can delete catalog items for their company"
ON public.catalog_items
FOR DELETE
USING (
  company_id IN (
    SELECT company_users.company_id
    FROM company_users
    WHERE company_users.user_id = auth.uid()
  )
);