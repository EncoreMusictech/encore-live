-- Create table to track onboarding emails sent
CREATE TABLE public.onboarding_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'welcome',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_status TEXT NOT NULL DEFAULT 'sent',
  email_subject TEXT,
  email_data JSONB DEFAULT '{}'::jsonb,
  delivery_status TEXT DEFAULT 'pending',
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.onboarding_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own onboarding emails" 
ON public.onboarding_emails 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage onboarding emails" 
ON public.onboarding_emails 
FOR ALL 
USING (true);

-- Create index for better performance
CREATE INDEX idx_onboarding_emails_user_module ON public.onboarding_emails(user_id, module_id);
CREATE INDEX idx_onboarding_emails_sent_at ON public.onboarding_emails(sent_at);

-- Create function to send onboarding email
CREATE OR REPLACE FUNCTION public.send_module_onboarding_email()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_module_access
CREATE TRIGGER trigger_send_onboarding_email
    AFTER INSERT ON public.user_module_access
    FOR EACH ROW
    EXECUTE FUNCTION public.send_module_onboarding_email();