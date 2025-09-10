-- Fix critical security vulnerability in user_module_access table
-- Remove overly permissive policy that allows public access to all user module access data
DROP POLICY IF EXISTS "System can manage module access" ON public.user_module_access;

-- Create secure policies that protect user module access information
CREATE POLICY "Users can insert their own module access" 
ON public.user_module_access 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module access" 
ON public.user_module_access 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own module access" 
ON public.user_module_access 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role access for system operations (subscriptions, grants, etc.)
CREATE POLICY "Service role can manage module access" 
ON public.user_module_access 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Operations team access for administrative functions
CREATE POLICY "Operations team can manage module access" 
ON public.user_module_access 
FOR ALL 
USING (is_operations_team_member(auth.uid()));

-- Note: "Users can view their own module access" policy already exists and is secure