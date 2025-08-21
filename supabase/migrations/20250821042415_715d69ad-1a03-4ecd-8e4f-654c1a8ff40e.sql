-- Fix critical security issue: Protect customer email addresses and Stripe data
-- Ensure proper RLS policies are in place for the subscribers table

-- First, ensure RLS is enabled on the subscribers table
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with proper security
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;  
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure SELECT policy - users can only view their own subscription data
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.email() = email
);

-- Create secure INSERT policy - only authenticated users can create subscriptions
CREATE POLICY "Authenticated users can create subscriptions" 
ON public.subscribers
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  auth.email() = email
);

-- Create secure UPDATE policy - users can only update their own subscription data  
CREATE POLICY "Users can update their own subscription" 
ON public.subscribers
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.email() = email
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.email() = email
);

-- Allow system/service role to manage subscriptions for payment processing
CREATE POLICY "System can manage all subscriptions" 
ON public.subscribers
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);