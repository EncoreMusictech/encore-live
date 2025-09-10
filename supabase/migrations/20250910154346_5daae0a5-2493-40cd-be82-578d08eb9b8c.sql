-- Fix critical security vulnerability in revenue_events table
-- Remove overly permissive policy that allows public access to all revenue data
DROP POLICY IF EXISTS "System can manage revenue events" ON public.revenue_events;

-- Create secure policies that restrict access to user's own data
CREATE POLICY "Users can view their own revenue events" 
ON public.revenue_events 
FOR SELECT 
USING (auth.uid() = customer_user_id);

CREATE POLICY "Users can insert their own revenue events" 
ON public.revenue_events 
FOR INSERT 
WITH CHECK (auth.uid() = customer_user_id);

CREATE POLICY "Users can update their own revenue events" 
ON public.revenue_events 
FOR UPDATE 
USING (auth.uid() = customer_user_id)
WITH CHECK (auth.uid() = customer_user_id);

-- Operations team policy remains for administrative access
-- (keeping existing "Operations access for revenue events" policy)

-- Add system access for service roles only (not public access)
CREATE POLICY "Service role can manage revenue events" 
ON public.revenue_events 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);