-- Drop all triggers on reconciliation_batches
DROP TRIGGER IF EXISTS reconciliation_batches_set_batch_id_trigger ON public.reconciliation_batches;
DROP TRIGGER IF EXISTS set_batch_id_trigger ON public.reconciliation_batches;

-- Let's create a much simpler trigger function that avoids any potential conflicts
CREATE OR REPLACE FUNCTION public.handle_batch_id_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.batch_id IS NULL THEN
    NEW.batch_id := 'BATCH-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER handle_batch_id_insert_trigger
  BEFORE INSERT ON public.reconciliation_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_batch_id_insert();