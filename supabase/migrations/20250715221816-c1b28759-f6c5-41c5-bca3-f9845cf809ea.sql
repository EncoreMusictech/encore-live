-- Add linked_statement_id column to reconciliation_batches table
ALTER TABLE public.reconciliation_batches 
ADD COLUMN linked_statement_id UUID REFERENCES public.royalties_import_staging(id);