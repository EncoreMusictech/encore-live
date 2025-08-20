-- Fix get_client_quarterly_balances to return actual payee names
CREATE OR REPLACE FUNCTION public.get_client_quarterly_balances()
RETURNS TABLE (
  year integer,
  quarter integer,
  period_label text,
  opening_balance numeric,
  royalties_amount numeric,
  expenses_amount numeric,
  payments_amount numeric,
  closing_balance numeric,
  contact_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_user uuid := auth.uid();
  v_subscriber_user uuid;
  v_contact_ids uuid[];
BEGIN
  -- Determine the subscriber (owner) for this client user
  SELECT public.get_client_subscriber(v_client_user)
  INTO v_subscriber_user;

  IF v_subscriber_user IS NULL THEN
    RAISE EXCEPTION 'No active client portal access for this user';
  END IF;

  -- Contacts explicitly linked to this client under the subscriber
  SELECT COALESCE(array_agg(cda.data_id), ARRAY[]::uuid[])
  INTO v_contact_ids
  FROM public.client_data_associations cda
  WHERE cda.subscriber_user_id = v_subscriber_user
    AND cda.client_user_id = v_client_user
    AND cda.data_type = 'contact';

  -- Aggregate quarterly balances for those contacts (or all if none explicitly linked)
  RETURN QUERY
  WITH qb AS (
    SELECT
      q.year::int AS y,
      q.quarter::int AS qtr,
      SUM(COALESCE(q.opening_balance, 0)) AS ob,
      SUM(COALESCE(q.royalties_amount, 0)) AS roy,
      SUM(COALESCE(q.expenses_amount, 0)) AS exp,
      SUM(COALESCE(q.payments_amount, 0)) AS pay,
      SUM(COALESCE(q.closing_balance, 0)) AS cb,
      -- Get the payee name from the first non-null payee in the group
      MAX(p.payee_name) AS payee_name
    FROM public.quarterly_balance_reports q
    LEFT JOIN public.payees p ON p.id = q.payee_id
    WHERE q.user_id = v_subscriber_user
      AND (
        v_contact_ids = '{}'::uuid[]
        OR q.contact_id = ANY(v_contact_ids)
      )
    GROUP BY q.year, q.quarter
  )
  SELECT 
    qb.y AS year,
    qb.qtr AS quarter,
    'Q' || qb.qtr::text || ' ' || qb.y::text AS period_label,
    qb.ob AS opening_balance,
    qb.roy AS royalties_amount,
    qb.exp AS expenses_amount,
    qb.pay AS payments_amount,
    qb.cb AS closing_balance,
    qb.payee_name AS contact_name
  FROM qb
  ORDER BY qb.y DESC, qb.qtr DESC;
END;
$$;