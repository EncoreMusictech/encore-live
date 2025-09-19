-- Add terms and onboarding columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;