-- Drop the remaining problematic policy
DROP POLICY IF EXISTS "System can manage revenue events" ON public.revenue_events;

-- Now create the corrected policy
CREATE POLICY "System can manage revenue events" ON public.revenue_events
FOR ALL USING (true);