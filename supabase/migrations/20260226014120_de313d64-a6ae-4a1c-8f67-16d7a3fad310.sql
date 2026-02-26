CREATE OR REPLACE FUNCTION public.is_operations_team_member()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN ('info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech', 'lawrence.berment@encoremusic.tech')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;