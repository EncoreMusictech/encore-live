-- Add processing tracking fields to reconciliation_batches table
ALTER TABLE public.reconciliation_batches 
ADD COLUMN processed_at timestamp with time zone,
ADD COLUMN processed_by_user_id uuid,
ADD COLUMN unprocessed_at timestamp with time zone,
ADD COLUMN unprocessed_by_user_id uuid,
ADD COLUMN processing_count integer DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN public.reconciliation_batches.processed_at IS 'Timestamp when batch was processed to payouts';
COMMENT ON COLUMN public.reconciliation_batches.processed_by_user_id IS 'User who processed the batch';
COMMENT ON COLUMN public.reconciliation_batches.unprocessed_at IS 'Timestamp when batch was unprocessed from payouts';
COMMENT ON COLUMN public.reconciliation_batches.unprocessed_by_user_id IS 'User who unprocessed the batch';
COMMENT ON COLUMN public.reconciliation_batches.processing_count IS 'Number of times this batch has been processed';