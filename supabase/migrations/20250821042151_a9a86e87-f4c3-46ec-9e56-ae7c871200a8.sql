-- Fix security issue: Restrict industry_benchmarks access to authenticated users only
-- This prevents competitors from stealing proprietary market intelligence

-- Drop the overly permissive policy that allows anyone to view benchmarks
DROP POLICY IF EXISTS "Anyone can view industry benchmarks" ON public.industry_benchmarks;

-- Create a new policy that restricts access to authenticated users only
CREATE POLICY "Authenticated users can view industry benchmarks" 
ON public.industry_benchmarks
FOR SELECT 
TO authenticated
USING (true);

-- Keep the system management policy as-is for internal operations
-- The "System can manage industry benchmarks" policy remains unchanged