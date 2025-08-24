-- Fix the permission issue by updating policies to use only the security definer function
-- Remove direct auth.users queries from policies

-- Drop all existing policies that query auth.users directly
DROP POLICY IF EXISTS "ENCORE admin can manage support tickets" ON public.support_ticket_analytics;
DROP POLICY IF EXISTS "ENCORE admin can manage customer health" ON public.customer_health_metrics;
DROP POLICY IF EXISTS "ENCORE admin can manage revenue events" ON public.revenue_events;
DROP POLICY IF EXISTS "ENCORE admin only access" ON public.operations_team_members;

-- Create policies that only use the security definer function
CREATE POLICY "Operations access for support tickets" ON public.support_ticket_analytics
  FOR ALL
  USING (public.is_operations_team_member(auth.uid()));

CREATE POLICY "Operations access for customer health" ON public.customer_health_metrics
  FOR ALL
  USING (public.is_operations_team_member(auth.uid()));

CREATE POLICY "Operations access for revenue events" ON public.revenue_events
  FOR ALL
  USING (public.is_operations_team_member(auth.uid()));

CREATE POLICY "Operations access for team members" ON public.operations_team_members
  FOR ALL
  USING (public.is_operations_team_member(auth.uid()))
  WITH CHECK (public.is_operations_team_member(auth.uid()));

-- Update the security definer function to handle permissions properly
CREATE OR REPLACE FUNCTION public.is_operations_team_member(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    user_email text;
BEGIN
    -- Get user email using security definer privileges
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = p_user_id;
    
    -- Check if user is ENCORE admin
    IF user_email = 'info@encoremusic.tech' THEN
        RETURN true;
    END IF;
    
    -- For now, only allow ENCORE admin access
    -- Future: Add operations team member checks here
    RETURN false;
END;
$$;