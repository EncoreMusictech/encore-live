-- Add rights_clearance_type field for storing clearance type string
ALTER TABLE public.sync_licenses 
ADD COLUMN IF NOT EXISTS rights_clearance_type TEXT CHECK (rights_clearance_type IN ('one-stop', 'pre-cleared', 'full-clearance', 'all-in-deal'));