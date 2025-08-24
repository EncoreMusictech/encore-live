-- Drop the problematic policies first
DROP POLICY IF EXISTS "Operations team members can view all" ON public.operations_team_members;
DROP POLICY IF EXISTS "Operations team members can manage team" ON public.operations_team_members;
DROP POLICY IF EXISTS "Operations team can view customer health" ON public.customer_health_metrics;
DROP POLICY IF EXISTS "Operations team can view support tickets" ON public.support_ticket_analytics;
DROP POLICY IF EXISTS "Operations team can view revenue events" ON public.revenue_events;

-- Create a security definer function to check if user is operations team member
CREATE OR REPLACE FUNCTION public.is_operations_team_member(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.operations_team_members 
    WHERE user_id = p_user_id AND is_active = true
  );
$$;

-- Create a security definer function to check if user can manage team
CREATE OR REPLACE FUNCTION public.can_manage_operations_team(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.operations_team_members 
    WHERE user_id = p_user_id 
    AND is_active = true 
    AND (permissions->>'manage_team')::boolean = true
  );
$$;

-- Create new simplified policies for operations_team_members
CREATE POLICY "Anyone can view operations team members" ON public.operations_team_members
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert operations team members" ON public.operations_team_members
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team managers can update operations team" ON public.operations_team_members
FOR UPDATE USING (public.can_manage_operations_team() OR auth.uid() = user_id);

CREATE POLICY "Team managers can delete operations team" ON public.operations_team_members
FOR DELETE USING (public.can_manage_operations_team());

-- Create new policies using the security definer functions
CREATE POLICY "Operations team can view customer health" ON public.customer_health_metrics
FOR SELECT USING (public.is_operations_team_member());

CREATE POLICY "Operations team can manage customer health" ON public.customer_health_metrics
FOR ALL USING (public.is_operations_team_member());

CREATE POLICY "Operations team can view support tickets" ON public.support_ticket_analytics
FOR SELECT USING (public.is_operations_team_member());

CREATE POLICY "Operations team can manage support tickets" ON public.support_ticket_analytics
FOR ALL USING (public.is_operations_team_member());

CREATE POLICY "Operations team can view revenue events" ON public.revenue_events
FOR SELECT USING (public.is_operations_team_member());

-- Keep system policy for revenue events
CREATE POLICY "System can manage revenue events" ON public.revenue_events
FOR ALL USING (true);