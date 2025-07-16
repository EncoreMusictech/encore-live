-- Add ENCORE standard fields and statement_id to royalty_allocations table
ALTER TABLE public.royalty_allocations 
ADD COLUMN quarter text,
ADD COLUMN source text,
ADD COLUMN revenue_source text,
ADD COLUMN work_identifier text,
ADD COLUMN work_writers text,
ADD COLUMN share text,
ADD COLUMN media_type text,
ADD COLUMN media_sub_type text,
ADD COLUMN country text,
ADD COLUMN quantity text,
ADD COLUMN gross_amount numeric,
ADD COLUMN net_amount numeric,
ADD COLUMN iswc text,
ADD COLUMN statement_id text,
ADD COLUMN staging_record_id text;