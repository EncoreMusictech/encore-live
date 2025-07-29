-- Fix the security warning by setting search_path for the new function
CREATE OR REPLACE FUNCTION public.send_module_onboarding_email()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    user_metadata JSONB;
BEGIN
    -- Only trigger for catalog-valuation module
    IF NEW.module_id = 'catalog-valuation' THEN
        -- Get user email from auth.users
        SELECT email, raw_user_meta_data 
        INTO user_email, user_metadata
        FROM auth.users 
        WHERE id = NEW.user_id;
        
        -- Check if we haven't already sent an onboarding email for this module
        IF NOT EXISTS (
            SELECT 1 FROM public.onboarding_emails 
            WHERE user_id = NEW.user_id 
            AND module_id = NEW.module_id 
            AND email_type = 'welcome'
        ) THEN
            -- Insert tracking record
            INSERT INTO public.onboarding_emails (
                user_id, 
                module_id, 
                email_type, 
                email_subject,
                email_data
            ) VALUES (
                NEW.user_id,
                NEW.module_id,
                'welcome',
                'Welcome to Catalog Valuation - Get Started Today!',
                jsonb_build_object(
                    'user_email', user_email,
                    'user_metadata', user_metadata,
                    'access_source', NEW.access_source,
                    'granted_at', NEW.granted_at
                )
            );
            
            -- Call the edge function to send the email
            PERFORM
                net.http_post(
                    url := 'https://plxsenykjisqutxcvjeg.supabase.co/functions/v1/send-catalog-valuation-onboarding',
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
                    ),
                    body := jsonb_build_object(
                        'user_id', NEW.user_id,
                        'user_email', user_email,
                        'module_id', NEW.module_id,
                        'access_source', NEW.access_source
                    )::text
                );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;