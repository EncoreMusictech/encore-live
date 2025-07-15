-- Make batch_id column optional for inserts and fix the trigger
ALTER TABLE public.reconciliation_batches 
ALTER COLUMN batch_id DROP NOT NULL;

-- Update the trigger function to be more explicit about column references
CREATE OR REPLACE FUNCTION public.set_batch_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.batch_id IS NULL OR NEW.batch_id = '' THEN
        NEW.batch_id := public.generate_batch_id();
    END IF;
    RETURN NEW;
END;
$function$;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS set_batch_id_trigger ON public.reconciliation_batches;
CREATE TRIGGER set_batch_id_trigger
    BEFORE INSERT ON public.reconciliation_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.set_batch_id();