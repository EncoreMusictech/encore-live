-- Phase 1: Database enhancements for invitation lifecycle management

-- Add invitation lifecycle tracking columns
ALTER TABLE public.client_invitations 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_cleanup_scheduled_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_client_invitations_expires_at ON public.client_invitations(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_client_invitations_reminder_tracking ON public.client_invitations(reminder_sent_at, reminder_count) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_client_portal_access_expires_at ON public.client_portal_access(expires_at) WHERE status = 'active';

-- Function to automatically expire invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired pending invitations
    UPDATE public.client_invitations 
    SET status = 'expired',
        auto_cleanup_scheduled_at = now() + INTERVAL '30 days'
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

-- Function to clean up old expired records
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Delete invitations that have been expired for more than 30 days
    DELETE FROM public.client_invitations 
    WHERE status = 'expired' 
    AND (auto_cleanup_scheduled_at IS NOT NULL AND auto_cleanup_scheduled_at < now())
    OR (auto_cleanup_scheduled_at IS NULL AND expires_at < now() - INTERVAL '30 days');
    
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

-- Function to expire client portal access
CREATE OR REPLACE FUNCTION public.expire_client_access()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired active client access
    UPDATE public.client_portal_access 
    SET status = 'expired'
    WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the expiration activity
    IF expired_count > 0 THEN
        PERFORM public.log_security_event(
            NULL,
            'client_access_auto_expired',
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

-- Function to identify invitations that need reminders
CREATE OR REPLACE FUNCTION public.get_invitations_needing_reminders()
RETURNS TABLE (
    id UUID,
    email TEXT,
    subscriber_user_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    reminder_count INTEGER,
    days_until_expiry INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        ci.id,
        ci.email,
        ci.subscriber_user_id,
        ci.expires_at,
        ci.reminder_count,
        EXTRACT(DAYS FROM (ci.expires_at - now()))::INTEGER as days_until_expiry
    FROM public.client_invitations ci
    WHERE ci.status = 'pending'
    AND ci.expires_at > now()
    AND (
        -- First reminder: 3 days before expiry, no reminders sent yet
        (EXTRACT(DAYS FROM (ci.expires_at - now())) <= 3 AND ci.reminder_count = 0)
        OR
        -- Second reminder: 1 day before expiry, only one reminder sent
        (EXTRACT(DAYS FROM (ci.expires_at - now())) <= 1 AND ci.reminder_count = 1)
    );
$$;

-- Function to mark reminder as sent
CREATE OR REPLACE FUNCTION public.mark_invitation_reminder_sent(invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.client_invitations 
    SET reminder_sent_at = now(),
        reminder_count = reminder_count + 1
    WHERE id = invitation_id;
END;
$$;