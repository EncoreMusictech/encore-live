-- Remove contract_terms column from royalty_allocations table
ALTER TABLE public.royalty_allocations 
DROP COLUMN contract_terms;