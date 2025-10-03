-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS public.get_client_quarterly_balances();

-- Create or replace RPC to return client-visible quarterly balances
-- Maps client -> subscriber -> contacts/payees and returns QBR rows

CREATE OR REPLACE FUNCTION public.get_client_quarterly_balances()
RETURNS TABLE (
  year integer,
  quarter integer,
  payee_id uuid,
  payee_name text,
  contact_id uuid,
  opening_balance numeric,
  royalties_amount numeric,
  expenses_amount numeric,
  payments_amount numeric,
  closing_balance numeric,
  calculation_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_client_id uuid := auth.uid();
  v_has_access boolean;
  v_subscriber_id uuid;
  v_client_email text;
BEGIN
  -- Ensure caller is a client with active access
  v_has_access := public.has_client_portal_access(v_client_id, 'royalties');
  IF NOT v_has_access THEN
    RETURN;
  END IF;

  -- Resolve the owning subscriber (the publisher/admin user)
  v_subscriber_id := public.get_client_subscriber(v_client_id);
  IF v_subscriber_id IS NULL THEN
    RETURN;
  END IF;

  -- Get client email for matching
  SELECT email INTO v_client_email FROM auth.users WHERE id = v_client_id;

  RETURN QUERY
  WITH 
  -- 1) Direct payee associations configured for this client
  direct_payees AS (
    SELECT cda.data_id AS payee_id
    FROM public.client_data_associations cda
    WHERE cda.client_user_id = v_client_id
      AND cda.subscriber_user_id = v_subscriber_id
      AND cda.data_type = 'payee'
  ),
  -- 2) Contacts that likely correspond to this client (email match or heuristic name match)
  client_contacts AS (
    SELECT c.id, c.name, c.email
    FROM public.contacts c
    WHERE c.user_id = v_subscriber_id
      AND (
        (v_client_email IS NOT NULL AND lower(c.email) = lower(v_client_email))
        OR (
          -- Heuristic: turn the email local part into a spaced name and match ILIKE
          v_client_email IS NOT NULL
          AND c.name ILIKE '%' || regexp_replace(split_part(v_client_email, '@', 1), '[._]+', ' ', 'g') || '%'
        )
      )
  ),
  -- 3) Payees whose name matches any of the client's contact names
  contact_payees AS (
    SELECT p.id AS payee_id
    FROM public.payees p
    JOIN client_contacts cc ON lower(p.payee_name) = lower(cc.name)
    WHERE p.user_id = v_subscriber_id
  ),
  -- Union of allowed payees
  allowed_payees AS (
    SELECT payee_id FROM direct_payees
    UNION
    SELECT payee_id FROM contact_payees
  )
  SELECT 
    q.year,
    q.quarter,
    q.payee_id,
    p.payee_name,
    q.contact_id,
    q.opening_balance,
    q.royalties_amount,
    q.expenses_amount,
    q.payments_amount,
    q.closing_balance,
    q.calculation_date
  FROM public.quarterly_balance_reports q
  JOIN public.payees p ON p.id = q.payee_id
  WHERE q.user_id = v_subscriber_id
    AND q.payee_id IN (SELECT payee_id FROM allowed_payees)
  ORDER BY q.year DESC, q.quarter DESC;
END;
$$;

-- Ensure function is executable by authenticated users
REVOKE ALL ON FUNCTION public.get_client_quarterly_balances() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_quarterly_balances() TO authenticated;