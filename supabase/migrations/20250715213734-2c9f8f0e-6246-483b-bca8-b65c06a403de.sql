-- Drop all existing triggers first
DROP TRIGGER IF EXISTS set_batch_id_trigger ON public.reconciliation_batches;
DROP TRIGGER IF EXISTS reconciliation_batches_set_batch_id ON public.reconciliation_batches;

-- Create a new, more explicit trigger function
CREATE OR REPLACE FUNCTION public.set_reconciliation_batch_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_batch_id text;
BEGIN
    -- Only set batch_id if it's null or empty
    IF NEW.batch_id IS NULL OR NEW.batch_id = '' THEN
        -- Generate new batch ID
        new_batch_id := public.generate_batch_id();
        NEW.batch_id := new_batch_id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Create the trigger with the new function
CREATE TRIGGER reconciliation_batches_set_batch_id_trigger
    BEFORE INSERT ON public.reconciliation_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.set_reconciliation_batch_id();