-- Update the security definer functions to allow ENCORE admin direct access
CREATE OR REPLACE FUNCTION public.is_operations_team_member(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    -- Allow ENCORE admin direct access
    (SELECT email FROM auth.users WHERE id = p_user_id) = 'info@encoremusic.tech'
    OR
    -- Check operations team membership
    EXISTS (
      SELECT 1 FROM public.operations_team_members 
      WHERE user_id = p_user_id AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_operations_team(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    -- Allow ENCORE admin full management access
    (SELECT email FROM auth.users WHERE id = p_user_id) = 'info@encoremusic.tech'
    OR
    -- Check team management permissions
    EXISTS (
      SELECT 1 FROM public.operations_team_members 
      WHERE user_id = p_user_id 
      AND is_active = true 
      AND (permissions->>'manage_team')::boolean = true
    );
$$;