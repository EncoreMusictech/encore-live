-- Add company_name column to profiles table for trial signups
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;