-- Fix all remaining database functions to have secure search_path
-- This addresses all "Function Search Path Mutable" warnings

-- Update all functions to set secure search_path
CREATE OR REPLACE FUNCTION public.update_sync_license_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_subscribers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_op_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'OP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM public.original_publishers WHERE op_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_writer_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'WR-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM public.writers WHERE writer_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_op_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.op_id IS NULL OR NEW.op_id = '' THEN
        NEW.op_id := public.generate_op_id();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_royalty_splits(contract_id_param uuid)
RETURNS TABLE(right_type text, total_percentage numeric, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        'performance' as right_type,
        COALESCE(SUM(performance_percentage), 0) as total_percentage,
        COALESCE(SUM(performance_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'mechanical' as right_type,
        COALESCE(SUM(mechanical_percentage), 0) as total_percentage,
        COALESCE(SUM(mechanical_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'synch' as right_type,
        COALESCE(SUM(synch_percentage), 0) as total_percentage,
        COALESCE(SUM(synch_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'print' as right_type,
        COALESCE(SUM(print_percentage), 0) as total_percentage,
        COALESCE(SUM(print_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'grand_rights' as right_type,
        COALESCE(SUM(grand_rights_percentage), 0) as total_percentage,
        COALESCE(SUM(grand_rights_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param
    
    UNION ALL
    
    SELECT 
        'karaoke' as right_type,
        COALESCE(SUM(karaoke_percentage), 0) as total_percentage,
        COALESCE(SUM(karaoke_percentage), 0) = 100 as is_valid
    FROM public.contract_interested_parties
    WHERE contract_id = contract_id_param;
END;
$function$;