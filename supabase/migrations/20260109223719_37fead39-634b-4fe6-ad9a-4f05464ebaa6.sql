-- Add payment tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS payment_method_collected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_setup_at timestamp with time zone;