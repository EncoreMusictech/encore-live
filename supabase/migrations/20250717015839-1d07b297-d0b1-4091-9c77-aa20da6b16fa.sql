-- Security Fix Phase 5: Security Headers and Monitoring

-- Create a security events table for audit logging
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert security events, admins to view all
CREATE POLICY "System can create security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own security events" 
ON public.security_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}'::jsonb,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    event_id UUID;
BEGIN
    -- Input validation
    IF p_event_type IS NULL OR trim(p_event_type) = '' THEN
        RAISE EXCEPTION 'Event type cannot be null or empty';
    END IF;
    
    -- Validate severity
    IF p_severity NOT IN ('low', 'medium', 'high', 'critical') THEN
        p_severity := 'info';
    END IF;
    
    -- Sanitize text inputs
    p_event_type := substring(trim(p_event_type), 1, 100);
    p_user_agent := substring(p_user_agent, 1, 500);
    
    INSERT INTO public.security_events (
        user_id,
        event_type,
        event_data,
        ip_address,
        user_agent,
        severity
    )
    VALUES (
        p_user_id,
        p_event_type,
        p_event_data,
        p_ip_address::INET,
        p_user_agent,
        p_severity
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$function$;

-- Create function to clean up old logs (for GDPR compliance)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete logs older than 2 years
    DELETE FROM public.copyright_activity_logs 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete security events older than 1 year (except critical ones)
    DELETE FROM public.security_events 
    WHERE created_at < NOW() - INTERVAL '1 year' 
    AND severity != 'critical';
    
    RETURN deleted_count;
END;
$function$;

-- Add rate limiting table for enhanced security
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or user ID
    action_type TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    first_attempt TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT now(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    UNIQUE(identifier, action_type)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- System can manage rate limits
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action_type TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15,
    p_block_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    current_record public.rate_limits%ROWTYPE;
    is_allowed BOOLEAN := TRUE;
BEGIN
    -- Input validation
    IF p_identifier IS NULL OR p_action_type IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get or create rate limit record
    SELECT * INTO current_record
    FROM public.rate_limits
    WHERE identifier = p_identifier AND action_type = p_action_type;
    
    IF current_record.id IS NULL THEN
        -- First attempt, create record
        INSERT INTO public.rate_limits (identifier, action_type)
        VALUES (p_identifier, p_action_type);
        RETURN TRUE;
    END IF;
    
    -- Check if still blocked
    IF current_record.blocked_until IS NOT NULL 
       AND current_record.blocked_until > NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Check if outside time window, reset counter
    IF current_record.first_attempt < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
        UPDATE public.rate_limits
        SET attempt_count = 1,
            first_attempt = NOW(),
            last_attempt = NOW(),
            blocked_until = NULL
        WHERE id = current_record.id;
        RETURN TRUE;
    END IF;
    
    -- Increment attempt count
    UPDATE public.rate_limits
    SET attempt_count = attempt_count + 1,
        last_attempt = NOW()
    WHERE id = current_record.id;
    
    -- Check if exceeded limit
    IF current_record.attempt_count >= p_max_attempts THEN
        -- Block for specified time
        UPDATE public.rate_limits
        SET blocked_until = NOW() + (p_block_minutes || ' minutes')::INTERVAL
        WHERE id = current_record.id;
        
        -- Log security event
        PERFORM public.log_security_event(
            NULL,
            'rate_limit_exceeded',
            jsonb_build_object(
                'identifier', p_identifier,
                'action_type', p_action_type,
                'attempts', current_record.attempt_count
            ),
            CASE WHEN p_identifier ~ '^[0-9.]+$' THEN p_identifier ELSE NULL END,
            NULL,
            'medium'
        );
        
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$function$;