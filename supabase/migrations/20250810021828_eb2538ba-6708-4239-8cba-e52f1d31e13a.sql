-- Shorten auto-cleanup window to 14 days and adjust cleanup function
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired pending invitations
    UPDATE public.client_invitations 
    SET status = 'expired',
        -- schedule cleanup 14 days after expiration
        auto_cleanup_scheduled_at = now() + INTERVAL '14 days'
    WHERE status = 'pending' 
    AND expires_at < now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the expiration activity
    IF expired_count > 0 THEN
        PERFORM public.log_security_event(
            NULL,
            'invitation_auto_expired',
            jsonb_build_object(
                'expired_count', expired_count,
                'timestamp', now()
            ),
            NULL,
            NULL,
            'info'
        );
    END IF;
    
    RETURN expired_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Delete invitations that have been expired for more than 14 days
    DELETE FROM public.client_invitations 
    WHERE status = 'expired' 
      AND (
        (auto_cleanup_scheduled_at IS NOT NULL AND auto_cleanup_scheduled_at < now())
        OR (auto_cleanup_scheduled_at IS NULL AND expires_at < now() - INTERVAL '14 days')
      );
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Log the cleanup activity
    IF cleaned_count > 0 THEN
        PERFORM public.log_security_event(
            NULL,
            'invitation_auto_cleanup',
            jsonb_build_object(
                'cleaned_count', cleaned_count,
                'timestamp', now()
            ),
            NULL,
            NULL,
            'info'
        );
    END IF;
    
    RETURN cleaned_count;
END;
$$;