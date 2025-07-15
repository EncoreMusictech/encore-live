-- Add statement_total field to reconciliation_batches table
ALTER TABLE public.reconciliation_batches 
ADD COLUMN statement_total numeric DEFAULT 0;