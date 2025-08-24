-- Drop policies that depend on the function first
DROP POLICY IF EXISTS "Operations team can view support tickets" ON public.support_ticket_analytics;
DROP POLICY IF EXISTS "Operations team can view customer health" ON public.customer_health_metrics;
DROP POLICY IF EXISTS "Operations team can view revenue events" ON public.revenue_events;

-- Now drop and recreate the function without operations_team_members reference
DROP FUNCTION IF EXISTS public.is_operations_team_member(uuid);
CREATE OR REPLACE FUNCTION public.is_operations_team_member(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    -- Only allow ENCORE admin for now to break recursion
    (SELECT email FROM auth.users WHERE id = p_user_id) = 'info@encoremusic.tech';
$$;

-- Create new simple admin-only policies
CREATE POLICY "ENCORE admin can manage support tickets" ON public.support_ticket_analytics
  FOR ALL
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@encoremusic.tech');

CREATE POLICY "ENCORE admin can manage customer health" ON public.customer_health_metrics
  FOR ALL
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@encoremusic.tech');

CREATE POLICY "ENCORE admin can manage revenue events" ON public.revenue_events
  FOR ALL
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@encoremusic.tech');

-- Simplify operations_team_members policies
DROP POLICY IF EXISTS "ENCORE admin full access" ON public.operations_team_members;
DROP POLICY IF EXISTS "Team members view own records" ON public.operations_team_members;
DROP POLICY IF EXISTS "System can manage operations team" ON public.operations_team_members;

CREATE POLICY "ENCORE admin only access" ON public.operations_team_members
  FOR ALL
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@encoremusic.tech')
  WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@encoremusic.tech');