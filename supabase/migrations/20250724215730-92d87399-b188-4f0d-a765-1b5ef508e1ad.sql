-- Update the log_copyright_activity function to allow 'bulk_upload' action type
CREATE OR REPLACE FUNCTION public.log_copyright_activity(
    p_user_id UUID,
    p_copyright_id UUID,
    p_action_type TEXT,
    p_operation_details JSONB,
    p_affected_fields TEXT[],
    p_old_values JSONB,
    p_new_values JSONB,
    p_batch_id UUID,
    p_ip_address TEXT,
    p_user_agent TEXT
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
    
    -- Validate action type against allowed values (updated to include bulk_upload)
    IF p_action_type NOT IN ('create', 'update', 'delete', 'view', 'export', 'import', 'bulk_update', 'bulk_upload') THEN
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
        COALESCE(p_operation_details, '{}'::jsonb),
        COALESCE(p_affected_fields, ARRAY[]::TEXT[]),
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