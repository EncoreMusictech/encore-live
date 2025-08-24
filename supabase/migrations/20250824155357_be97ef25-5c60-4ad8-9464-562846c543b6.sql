-- Check and fix RLS policies for operations_team_members table
-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Operations team members can manage their own records" ON public.operations_team_members;
DROP POLICY IF EXISTS "Operations team can view support tickets" ON public.support_ticket_analytics;
DROP POLICY IF EXISTS "Operations team can view all records" ON public.operations_team_members;
DROP POLICY IF EXISTS "System can manage all records" ON public.operations_team_members;
DROP POLICY IF EXISTS "ENCORE admin can manage operations team" ON public.operations_team_members;

-- Create simple, non-recursive policies
-- Allow the ENCORE admin to manage everything directly
CREATE POLICY "ENCORE admin full access" ON public.operations_team_members
  FOR ALL 
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@encoremusic.tech')
  WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@encoremusic.tech');

-- Allow team members to view their own records only
CREATE POLICY "Team members view own records" ON public.operations_team_members
  FOR SELECT 
  USING (user_id = auth.uid());

-- System/service role access for backend operations
CREATE POLICY "System can manage operations team" ON public.operations_team_members
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Update support ticket analytics policy to use the security definer function
DROP POLICY IF EXISTS "Operations team can view support tickets" ON public.support_ticket_analytics;
CREATE POLICY "Operations team can view support tickets" ON public.support_ticket_analytics
  FOR ALL
  USING (public.is_operations_team_member(auth.uid()));

-- Ensure other operations tables use the security definer functions
DROP POLICY IF EXISTS "Operations team can view customer health" ON public.customer_health_metrics;
CREATE POLICY "Operations team can view customer health" ON public.customer_health_metrics
  FOR ALL
  USING (public.is_operations_team_member(auth.uid()));

DROP POLICY IF EXISTS "Operations team can view revenue events" ON public.revenue_events;
CREATE POLICY "Operations team can view revenue events" ON public.revenue_events
  FOR ALL
  USING (public.is_operations_team_member(auth.uid()));