-- Server-side creation for client labels (avoids client-side RLS insert edge cases)

CREATE OR REPLACE FUNCTION public.create_client_label(
  _parent_company_id uuid,
  _name text,
  _display_name text,
  _slug text
)
RETURNS TABLE(id uuid, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_display_name text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _parent_company_id IS NULL THEN
    RAISE EXCEPTION 'parent_company_id is required';
  END IF;

  IF _name IS NULL OR btrim(_name) = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;

  IF _display_name IS NULL OR btrim(_display_name) = '' THEN
    RAISE EXCEPTION 'display_name is required';
  END IF;

  IF _slug IS NULL OR btrim(_slug) = '' THEN
    RAISE EXCEPTION 'slug is required';
  END IF;

  IF NOT public.user_is_member_of_publishing_firm(v_user_id, _parent_company_id) THEN
    RAISE EXCEPTION 'Not authorized to create client labels for this company';
  END IF;

  INSERT INTO public.companies (
    name,
    display_name,
    slug,
    company_type,
    parent_company_id,
    created_by
  )
  VALUES (
    btrim(_name),
    btrim(_display_name),
    btrim(_slug),
    'client_label',
    _parent_company_id,
    v_user_id
  )
  RETURNING public.companies.id, public.companies.display_name
  INTO v_company_id, v_display_name;

  -- Ensure the creator can access/manage the newly created client label
  INSERT INTO public.company_users (company_id, user_id, role, status)
  VALUES (v_company_id, v_user_id, 'admin', 'active')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  RETURN QUERY
  SELECT v_company_id, v_display_name;
END;
$$;

-- Lock down execute permissions
REVOKE ALL ON FUNCTION public.create_client_label(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_client_label(uuid, text, text, text) TO authenticated;
