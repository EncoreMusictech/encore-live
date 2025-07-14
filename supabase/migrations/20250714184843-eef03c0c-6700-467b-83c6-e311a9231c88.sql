-- Update the generate_work_id function to use 'WK' prefix instead of 'W'
CREATE OR REPLACE FUNCTION public.generate_work_id()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_id text;
    counter integer := 1;
BEGIN
    LOOP
        new_id := 'WK' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.copyrights WHERE work_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$function$;