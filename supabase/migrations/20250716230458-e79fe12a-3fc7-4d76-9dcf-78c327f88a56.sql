-- Add mapped_data column to store all fields from the original mapped data
ALTER TABLE public.royalty_allocations 
ADD COLUMN mapped_data jsonb DEFAULT '{}'::jsonb;