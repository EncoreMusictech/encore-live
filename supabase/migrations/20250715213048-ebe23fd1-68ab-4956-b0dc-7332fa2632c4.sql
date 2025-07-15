-- Fix the ambiguous batch_id reference in the trigger function
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

-- Ensure the trigger exists on reconciliation_batches
DROP TRIGGER IF EXISTS set_batch_id_trigger ON public.reconciliation_batches;
CREATE TRIGGER set_batch_id_trigger
    BEFORE INSERT ON public.reconciliation_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.set_batch_id();