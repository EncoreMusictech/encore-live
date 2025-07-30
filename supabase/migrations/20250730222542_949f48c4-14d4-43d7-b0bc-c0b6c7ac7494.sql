-- Fix search path security warnings for the new functions
CREATE OR REPLACE FUNCTION public.encrypt_sender_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple encryption placeholder - in production would use proper encryption
    NEW.encrypted_sender_code := encode(NEW.sender_code::bytea, 'base64');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_sender_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;