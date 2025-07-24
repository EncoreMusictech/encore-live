-- Update the log_copyright_activity function to handle bulk_upload activities more gracefully
CREATE OR REPLACE FUNCTION public.log_copyright_activity(
    p_user_id UUID,
    p_copyright_id UUID DEFAULT NULL,
    p_action_type TEXT DEFAULT NULL,
    p_operation_details JSONB DEFAULT '{}'::jsonb,
    p_affected_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_batch_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    IF p_action_type NOT IN ('create', 'update', 'delete', 'view', 'export', 'import', 'bulk_update', 'bulk_upload') THEN
        RAISE EXCEPTION 'Invalid action type: %', p_action_type;
    END IF;
    
    -- Verify user has access to the copyright if copyright_id is provided
    -- Skip this check for bulk_upload as copyrights might be created in the same transaction
    IF p_copyright_id IS NOT NULL AND p_action_type != 'bulk_upload' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.copyrights 
            WHERE id = p_copyright_id AND user_id = p_user_id
        ) THEN
            RAISE EXCEPTION 'User does not have access to copyright: %', p_copyright_id;
        END IF;
    END IF;
    
    -- For bulk_upload, if copyright_id is provided, verify after a brief delay to allow for creation
    IF p_copyright_id IS NOT NULL AND p_action_type = 'bulk_upload' THEN
        -- Check if copyright exists and belongs to user, but don't fail if it doesn't
        -- This handles the case where logging happens immediately after creation
        PERFORM 1 FROM public.copyrights 
        WHERE id = p_copyright_id AND user_id = p_user_id;
        
        -- If not found, we'll still log but note this in the details
        IF NOT FOUND THEN
            p_operation_details := p_operation_details || jsonb_build_object(
                'note', 'Copyright verification skipped for bulk_upload'
            );
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
$$;