-- Enable pgcrypto for secure token generation used by generate_invitation_token()
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Verify function exists (no-op if already present). Recreate to be safe to use gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    token text;
BEGIN
    -- 32 bytes -> 43 char URL-safe base64 after replacements
    token := encode(gen_random_bytes(32), 'base64');
    -- Make URL-safe
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    RETURN token;
END;
$function$;

-- Ensure trigger function uses the generator (idempotent)
CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.invitation_token IS NULL OR NEW.invitation_token = '' THEN
        NEW.invitation_token := public.generate_invitation_token();
    END IF;
    RETURN NEW;
END;
$function$;