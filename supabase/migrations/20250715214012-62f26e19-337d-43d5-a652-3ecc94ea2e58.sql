-- First, let's see what functions exist with batch_id
\df *batch*

-- Drop all triggers on reconciliation_batches
DROP TRIGGER IF EXISTS reconciliation_batches_set_batch_id_trigger ON public.reconciliation_batches;

-- Check the generate_batch_id function
SELECT prosrc FROM pg_proc WHERE proname = 'generate_batch_id';

-- Let's create a much simpler trigger function
CREATE OR REPLACE FUNCTION public.handle_batch_id_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.batch_id IS NULL THEN
    NEW.batch_id := 'BATCH-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;