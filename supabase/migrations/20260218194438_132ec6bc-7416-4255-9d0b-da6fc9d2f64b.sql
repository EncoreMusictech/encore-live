
-- Add post-term collection period columns to contracts table
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS post_term_collection_end_date date,
  ADD COLUMN IF NOT EXISTS post_term_collection_months integer;

COMMENT ON COLUMN public.contracts.post_term_collection_end_date IS 'Date when post-term royalty collection rights expire';
COMMENT ON COLUMN public.contracts.post_term_collection_months IS 'Duration of post-term collection period in months';
