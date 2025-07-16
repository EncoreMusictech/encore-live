-- Fix the ambiguous column reference in the trigger function
CREATE OR REPLACE FUNCTION public.set_royalty_work_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Use NEW.work_id explicitly to avoid ambiguity
    IF NEW.work_id IS NULL OR NEW.work_id = '' THEN
        NEW.work_id := public.generate_royalty_work_id();
    END IF;
    RETURN NEW;
END;
$function$;