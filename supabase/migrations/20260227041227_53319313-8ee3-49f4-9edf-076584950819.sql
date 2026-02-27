-- Allow system admins to manage copyright_writers (needed for bulk uploads on behalf of sub-accounts)
CREATE POLICY "System admins can manage all copyright_writers"
ON public.copyright_writers
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Allow system admins to manage copyright_publishers (needed for bulk uploads on behalf of sub-accounts)
CREATE POLICY "System admins can manage all copyright_publishers"
ON public.copyright_publishers
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));
