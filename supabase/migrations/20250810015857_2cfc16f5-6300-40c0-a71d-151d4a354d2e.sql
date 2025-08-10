-- Ensure pgcrypto is available (let Supabase place it in the default extensions schema)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate token generator to reference the extensions schema explicitly and broaden search_path
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  token text;
BEGIN
  -- Explicitly reference the extension schema for reliability
  token := encode(extensions.gen_random_bytes(32), 'base64');
  token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
  RETURN token;
END;
$$;

-- (Idempotent) keep the trigger helper intact
CREATE OR REPLACE FUNCTION public.set_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  IF NEW.invitation_token IS NULL OR NEW.invitation_token = '' THEN
    NEW.invitation_token := public.generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$;