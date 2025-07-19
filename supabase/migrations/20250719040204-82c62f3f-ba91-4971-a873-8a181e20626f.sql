-- Add fee_allocations column to sync_licenses table
ALTER TABLE public.sync_licenses 
ADD COLUMN IF NOT EXISTS fee_allocations JSONB DEFAULT '[]'::jsonb;