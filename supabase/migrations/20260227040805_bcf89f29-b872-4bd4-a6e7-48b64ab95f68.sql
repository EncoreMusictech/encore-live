-- Allow system admins to manage copyright_recordings (needed for bulk uploads on behalf of sub-accounts)
CREATE POLICY "System admins can manage all copyright_recordings"
ON public.copyright_recordings
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));
