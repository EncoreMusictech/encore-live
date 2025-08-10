-- Accept invitation RPC to handle RLS securely and enforce email match
CREATE OR REPLACE FUNCTION public.accept_client_invitation(
  p_token text,
  p_accepter uuid,
  p_accepter_email text
)
RETURNS public.client_portal_access
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  inv RECORD;
  access_row public.client_portal_access%ROWTYPE;
BEGIN
  -- Lock the invitation row to prevent race conditions
  SELECT * INTO inv
  FROM public.client_invitations
  WHERE invitation_token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  IF inv.status <> 'pending' OR inv.expires_at <= now() THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Enforce email match
  IF lower(coalesce(inv.email, '')) <> lower(coalesce(p_accepter_email, '')) THEN
    RAISE EXCEPTION 'This invite is for %', inv.email;
  END IF;

  -- Create client portal access
  INSERT INTO public.client_portal_access (
    subscriber_user_id,
    client_user_id,
    role,
    permissions,
    status
  ) VALUES (
    inv.subscriber_user_id,
    p_accepter,
    inv.role,
    inv.permissions,
    'active'
  ) RETURNING * INTO access_row;

  -- Mark invitation accepted
  UPDATE public.client_invitations
  SET status = 'accepted',
      accepted_at = now(),
      accepted_by_user_id = p_accepter
  WHERE id = inv.id;

  RETURN access_row;
END;
$$;

-- Allow authenticated users to call the RPC
GRANT EXECUTE ON FUNCTION public.accept_client_invitation(text, uuid, text) TO authenticated;