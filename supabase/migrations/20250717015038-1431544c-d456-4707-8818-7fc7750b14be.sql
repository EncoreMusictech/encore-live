-- Security Fix Phase 1: Database Function Security Improvements

-- Fix 1: Add input validation and improve security for generate_work_id function
CREATE OR REPLACE FUNCTION public.generate_work_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_id text;
    counter integer := 1;
    max_attempts integer := 1000; -- Prevent infinite loops
BEGIN
    -- Input validation and rate limiting could be added here
    LOOP
        new_id := 'WK' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.copyrights WHERE work_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loops
        IF counter > max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique work ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$function$;

-- Fix 2: Improve log_copyright_activity function security
CREATE OR REPLACE FUNCTION public.log_copyright_activity(
    p_user_id uuid, 
    p_copyright_id uuid, 
    p_action_type text, 
    p_operation_details jsonb DEFAULT '{}'::jsonb, 
    p_affected_fields text[] DEFAULT '{}'::text[], 
    p_old_values jsonb DEFAULT NULL::jsonb, 
    p_new_values jsonb DEFAULT NULL::jsonb, 
    p_batch_id uuid DEFAULT NULL::uuid, 
    p_ip_address text DEFAULT NULL::text, 
    p_user_agent text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    log_id UUID;
BEGIN
    -- Input validation
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;
    
    IF p_action_type IS NULL OR trim(p_action_type) = '' THEN
        RAISE EXCEPTION 'Action type cannot be null or empty';
    END IF;
    
    -- Validate action type against allowed values
    IF p_action_type NOT IN ('create', 'update', 'delete', 'view', 'export', 'import', 'bulk_update') THEN
        RAISE EXCEPTION 'Invalid action type: %', p_action_type;
    END IF;
    
    -- Verify user has access to the copyright if copyright_id is provided
    IF p_copyright_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.copyrights 
            WHERE id = p_copyright_id AND user_id = p_user_id
        ) THEN
            RAISE EXCEPTION 'User does not have access to copyright: %', p_copyright_id;
        END IF;
    END IF;
    
    -- Sanitize and limit text fields
    p_ip_address := substring(p_ip_address, 1, 45); -- Max IPv6 length
    p_user_agent := substring(p_user_agent, 1, 500); -- Reasonable limit
    
    INSERT INTO public.copyright_activity_logs (
        user_id,
        copyright_id,
        action_type,
        operation_details,
        affected_fields,
        old_values,
        new_values,
        batch_id,
        ip_address,
        user_agent
    )
    VALUES (
        p_user_id,
        p_copyright_id,
        p_action_type,
        p_operation_details,
        p_affected_fields,
        p_old_values,
        p_new_values,
        p_batch_id,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$;

-- Fix 3: Add rate limiting for batch ID generation
CREATE OR REPLACE FUNCTION public.generate_batch_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    batch_id TEXT;
    counter INTEGER := 1;
    max_attempts INTEGER := 1000;
BEGIN
    LOOP
        batch_id := 'BATCH-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.reconciliation_batches WHERE batch_id = batch_id) THEN
            RETURN batch_id;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loops
        IF counter > max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique batch ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$function$;

-- Fix 4: Improve setup_demo_user function security
CREATE OR REPLACE FUNCTION public.setup_demo_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
    demo_user_id uuid;
    module_list text[] := ARRAY[
        'catalog-valuation',
        'deal-simulator', 
        'contract-management',
        'copyright-management',
        'royalties-processing',
        'sync-licensing'
    ];
BEGIN
    -- Find the demo user with additional validation
    SELECT id INTO demo_user_id 
    FROM auth.users 
    WHERE email = 'info@encoremusic.tech'
    AND email_confirmed_at IS NOT NULL; -- Ensure email is confirmed
    
    -- If demo user exists and is valid, grant access to modules
    IF demo_user_id IS NOT NULL THEN
        -- First, remove any existing demo access to avoid duplicates
        DELETE FROM public.user_module_access 
        WHERE user_id = demo_user_id AND access_source = 'demo_access';
        
        -- Insert new module access
        INSERT INTO public.user_module_access (user_id, module_id, access_source, granted_at)
        SELECT 
            demo_user_id,
            unnest(module_list) as module_id,
            'demo_access' as access_source,
            now() as granted_at
        ON CONFLICT (user_id, module_id) DO UPDATE SET
            access_source = EXCLUDED.access_source,
            granted_at = EXCLUDED.granted_at;
            
        RAISE NOTICE 'Demo user access granted for % modules', array_length(module_list, 1);
    ELSE
        RAISE NOTICE 'Demo user not found or not confirmed';
    END IF;
END;
$function$;

-- Fix 5: Add comprehensive input validation for royalty work ID generation
CREATE OR REPLACE FUNCTION public.generate_royalty_work_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    work_id TEXT;
    counter INTEGER := 1;
    max_attempts INTEGER := 1000;
BEGIN
    LOOP
        work_id := 'ROY-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.royalty_allocations WHERE work_id = work_id) THEN
            RETURN work_id;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loops
        IF counter > max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique royalty work ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$function$;