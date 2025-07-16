-- Temporarily disable the work_id trigger to isolate the issue
DROP TRIGGER IF EXISTS set_royalty_work_id_trigger ON public.royalty_allocations;