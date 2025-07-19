-- Add new fields to sync_licenses table for enhanced sync license details
ALTER TABLE public.sync_licenses 
ADD COLUMN IF NOT EXISTS platforms TEXT,
ADD COLUMN IF NOT EXISTS territory TEXT, 
ADD COLUMN IF NOT EXISTS term_duration TEXT,
ADD COLUMN IF NOT EXISTS episode_season TEXT;