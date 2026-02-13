
-- Drop and recreate the function with updated return type
DROP FUNCTION IF EXISTS public.accept_client_invitation(text, uuid, text);

CREATE OR REPLACE FUNCTION public.accept_client_invitation(p_token text, p_accepter uuid, p_accepter_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_invitation record;
    v_access_id uuid;
    v_result jsonb;
BEGIN
    SELECT * INTO v_invitation
    FROM public.client_invitations
    WHERE invitation_token = p_token
    AND status = 'pending'
    AND expires_at > now();

    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;

    IF lower(v_invitation.email) != lower(p_accepter_email) THEN
        RAISE EXCEPTION 'Email does not match invitation';
    END IF;

    INSERT INTO public.client_portal_access (
        client_user_id, subscriber_user_id, role, permissions, status, visibility_scope
    ) VALUES (
        p_accepter, v_invitation.subscriber_user_id, v_invitation.role, 
        v_invitation.permissions, 'active',
        COALESCE(v_invitation.visibility_scope, '{"scope_type": "all"}'::jsonb)
    )
    ON CONFLICT (client_user_id, subscriber_user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        status = 'active',
        visibility_scope = EXCLUDED.visibility_scope,
        updated_at = now()
    RETURNING id INTO v_access_id;

    UPDATE public.client_invitations
    SET status = 'accepted',
        accepted_at = now(),
        accepted_by_user_id = p_accepter
    WHERE id = v_invitation.id;

    v_result := jsonb_build_object(
        'access_id', v_access_id,
        'subscriber_user_id', v_invitation.subscriber_user_id,
        'role', v_invitation.role,
        'permissions', v_invitation.permissions,
        'visibility_scope', COALESCE(v_invitation.visibility_scope, '{"scope_type": "all"}'::jsonb)
    );

    RETURN v_result;
END;
$$;
