-- Phase 1: Add admin role for operations@encoremusic.tech
INSERT INTO user_roles (user_id, role) 
VALUES ('1e1cebcc-8e99-4d8f-9cdd-e87c24ed7eee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Phase 3: Update is_operations_team_member function to include operations@encoremusic.tech
CREATE OR REPLACE FUNCTION public.is_operations_team_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN ('info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;