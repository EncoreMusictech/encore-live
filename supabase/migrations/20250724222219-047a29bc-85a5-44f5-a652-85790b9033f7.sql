-- Add MLC (The Mechanical Licensing Collective) fields to copyrights table
ALTER TABLE public.copyrights 
ADD COLUMN mlc_work_id text,
ADD COLUMN mlc_status text;