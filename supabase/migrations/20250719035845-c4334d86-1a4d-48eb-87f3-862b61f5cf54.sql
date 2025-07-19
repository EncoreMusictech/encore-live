-- Add controlled_writers column to sync_licenses table
ALTER TABLE public.sync_licenses 
ADD COLUMN IF NOT EXISTS controlled_writers JSONB DEFAULT '[]'::jsonb;