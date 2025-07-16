-- Drop and recreate the trigger and function to fix ambiguity
DROP TRIGGER IF EXISTS set_royalty_work_id_trigger ON public.royalty_allocations;
DROP FUNCTION IF EXISTS public.set_royalty_work_id();

-- Recreate the function with explicit column qualification
CREATE OR REPLACE FUNCTION public.set_royalty_work_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set work_id if it's NULL or empty
    IF NEW.work_id IS NULL OR NEW.work_id = '' THEN
        NEW.work_id := public.generate_royalty_work_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER set_royalty_work_id_trigger
    BEFORE INSERT ON public.royalty_allocations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_royalty_work_id();