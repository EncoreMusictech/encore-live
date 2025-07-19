-- Add audio_file_url column to sync_licenses table
ALTER TABLE public.sync_licenses 
ADD COLUMN IF NOT EXISTS audio_file_url TEXT;