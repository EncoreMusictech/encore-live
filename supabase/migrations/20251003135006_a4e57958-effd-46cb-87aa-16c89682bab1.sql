-- Replace RPC to compute client quarterly balances from payouts so client portals get values without stored reports
DROP FUNCTION IF EXISTS public.get_client_quarterly_balances();

CREATE OR REPLACE FUNCTION public.get_client_quarterly_balances()
RETURNS TABLE(
  year integer,
  quarter integer,
  period_label text,
  opening_balance numeric,
  royalties_amount numeric,
  expenses_amount numeric,
  payments_amount numeric,
  closing_balance numeric,
  contact_name text,
  agreement_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  subscriber_id uuid;
  client_payee_ids uuid[] := ARRAY[]::uuid[];
  client_contact_ids uuid[];
BEGIN
  -- Identify client and mapped subscriber
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  subscriber_id := public.get_client_subscriber(current_user_id);
  IF subscriber_id IS NULL THEN
    -- If the user is not a client (e.g., subscriber viewing their own portal), default to their own ID
    subscriber_id := current_user_id;
  END IF;

  -- Gather payees explicitly associated to the client
  SELECT COALESCE(ARRAY_AGG(DISTINCT cda.data_id::uuid), ARRAY[]::uuid[])
  INTO client_payee_ids
  FROM public.client_data_associations cda
  WHERE cda.client_user_id = current_user_id
    AND cda.data_type = 'payee';

  -- Also gather contacts tied to this client access and match payees by name for the subscriber
  SELECT ARRAY_AGG(DISTINCT c.id)
  INTO client_contact_ids
  FROM public.contacts c
  JOIN public.client_portal_access cpa 
    ON cpa.subscriber_user_id = c.user_id
   AND cpa.client_user_id = current_user_id
   AND cpa.status = 'active';

  IF client_contact_ids IS NOT NULL AND array_length(client_contact_ids,1) > 0 THEN
    SELECT ARRAY_AGG(DISTINCT p.id)
    INTO client_payee_ids
    FROM public.payees p
    JOIN public.contacts c ON c.name = p.payee_name
    WHERE c.id = ANY(client_contact_ids)
      AND p.user_id = subscriber_id
      OR p.id = ANY(COALESCE(client_payee_ids, ARRAY[]::uuid[]));
  END IF;

  -- Fallback via matching client email -> contact email
  IF client_payee_ids IS NULL OR array_length(client_payee_ids,1) = 0 THEN
    SELECT ARRAY_AGG(DISTINCT p.id)
    INTO client_payee_ids
    FROM public.payees p
    JOIN public.contacts c ON c.name = p.payee_name
    WHERE c.email = (SELECT email FROM auth.users WHERE id = current_user_id)
      AND p.user_id = subscriber_id;
  END IF;

  -- If still no payees, return empty set
  IF client_payee_ids IS NULL OR array_length(client_payee_ids,1) = 0 THEN
    RETURN; 
  END IF;

  RETURN QUERY
  WITH payout_rows AS (
    SELECT 
      p.payee_id,
      COALESCE(p.period_start::date, p.created_at::date) AS period_date,
      EXTRACT(YEAR FROM COALESCE(p.period_start, p.created_at))::int AS year,
      CEIL(EXTRACT(MONTH FROM COALESCE(p.period_start, p.created_at)) / 3.0)::int AS quarter,
      COALESCE(p.gross_royalties, 0)::numeric AS royalties_amount,
      COALESCE(p.total_expenses, 0)::numeric AS expenses_amount,
      CASE WHEN lower(COALESCE(p.status::text,'')) = 'paid' 
             OR lower(COALESCE(p.workflow_stage::text,'')) = 'paid'
           THEN COALESCE(p.amount_due, 0)::numeric
           ELSE 0::numeric
      END AS payments_amount
    FROM public.payouts p
    WHERE p.user_id = subscriber_id
      AND p.payee_id = ANY(client_payee_ids)
  ), agg AS (
    SELECT 
      payee_id,
      year,
      quarter,
      SUM(royalties_amount)::numeric AS royalties_amount,
      SUM(expenses_amount)::numeric AS expenses_amount,
      SUM(payments_amount)::numeric AS payments_amount
    FROM payout_rows
    GROUP BY payee_id, year, quarter
  ), ordered AS (
    SELECT *, (year * 10 + quarter) AS sort_key
    FROM agg
  ), with_running AS (
    SELECT 
      o.payee_id,
      o.year,
      o.quarter,
      o.royalties_amount,
      o.expenses_amount,
      o.payments_amount,
      COALESCE(
        SUM(o.royalties_amount - o.expenses_amount - o.payments_amount)
          OVER (PARTITION BY o.payee_id ORDER BY o.year, o.quarter ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),
        0
      )::numeric AS opening_balance
    FROM ordered o
  )
  SELECT 
    w.year,
    w.quarter,
    ('Q' || w.quarter || ' ' || w.year) AS period_label,
    ROUND(w.opening_balance, 2) AS opening_balance,
    ROUND(w.royalties_amount, 2) AS royalties_amount,
    ROUND(w.expenses_amount, 2) AS expenses_amount,
    ROUND(w.payments_amount, 2) AS payments_amount,
    ROUND(w.opening_balance + w.royalties_amount - w.expenses_amount - w.payments_amount, 2) AS closing_balance,
    COALESCE(c.name, p.payee_name, 'Unknown') AS contact_name,
    NULL::text AS agreement_id
  FROM with_running w
  LEFT JOIN public.payees p ON p.id = w.payee_id
  LEFT JOIN public.contacts c ON c.name = p.payee_name AND c.user_id = subscriber_id
  ORDER BY w.year DESC, w.quarter DESC;
END;
$$;