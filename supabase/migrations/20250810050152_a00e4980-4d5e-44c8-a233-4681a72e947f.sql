-- Create a secure RPC for client quarterly balances that includes paid amounts
CREATE OR REPLACE FUNCTION public.get_client_quarterly_balances()
RETURNS TABLE(
  year integer,
  quarter integer,
  period_label text,
  contact_name text,
  opening_balance numeric,
  royalties_amount numeric,
  expenses_amount numeric,
  payments_amount numeric,
  closing_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_id uuid := auth.uid();
  has_access boolean;
BEGIN
  -- Ensure the caller is an active client with royalties access
  has_access := public.has_client_portal_access(client_id, 'royalties');
  IF NOT has_access THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH assoc AS (
    SELECT data_id::uuid AS royalty_id
    FROM public.client_data_associations
    WHERE client_user_id = client_id
      AND data_type = 'royalty_allocation'
  ),
  ra AS (
    SELECT ra.*
    FROM public.royalty_allocations ra
    JOIN assoc a ON a.royalty_id = ra.id
  ),
  royalties AS (
    SELECT 
      EXTRACT(YEAR FROM rb.date_received)::int AS year,
      CEIL(EXTRACT(MONTH FROM rb.date_received)::numeric / 3.0)::int AS quarter,
      SUM(COALESCE(ra.net_amount, ra.gross_amount, 0)) AS royalties_amount
    FROM ra
    JOIN public.reconciliation_batches rb ON rb.id = ra.batch_id
    GROUP BY 1,2
  ),
  payments AS (
    SELECT 
      EXTRACT(YEAR FROM COALESCE(p.period_start, p.created_at))::int AS year,
      CEIL(EXTRACT(MONTH FROM COALESCE(p.period_start, p.created_at))::numeric / 3.0)::int AS quarter,
      SUM(COALESCE(pr.allocated_amount,0)) AS payments_amount,
      MIN(c.name) AS contact_name
    FROM ra
    JOIN public.payout_royalties pr ON pr.royalty_id = ra.id
    JOIN public.payouts p ON p.id = pr.payout_id AND p.status = 'paid'
    LEFT JOIN public.contacts c ON c.id = p.client_id
    GROUP BY 1,2
  ),
  periods AS (
    SELECT year, quarter FROM royalties
    UNION
    SELECT year, quarter FROM payments
  ),
  agg AS (
    SELECT 
      p.year, 
      p.quarter,
      COALESCE(r.royalties_amount,0) AS royalties_amount,
      0::numeric AS expenses_amount,
      COALESCE(pm.payments_amount,0) AS payments_amount,
      COALESCE(pm.contact_name, 'Unknown') AS contact_name
    FROM periods p
    LEFT JOIN royalties r ON r.year = p.year AND r.quarter = p.quarter
    LEFT JOIN payments pm ON pm.year = p.year AND pm.quarter = p.quarter
  ),
  ordered AS (
    SELECT 
      year, quarter, contact_name,
      ('Q' || quarter || ' ' || year)::text AS period_label,
      royalties_amount,
      0::numeric AS expenses_amount,
      payments_amount,
      ROW_NUMBER() OVER (ORDER BY year, quarter) AS rn
    FROM agg
  ),
  calc AS (
    SELECT 
      o.*,
      SUM(royalties_amount - payments_amount) OVER (ORDER BY year, quarter ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS closing_balance
    FROM ordered o
  )
  SELECT 
    year, quarter, period_label, contact_name,
    LAG(closing_balance,1,0) OVER (ORDER BY year, quarter) AS opening_balance,
    royalties_amount, expenses_amount, payments_amount,
    closing_balance
  FROM calc
  ORDER BY year DESC, quarter DESC;
END;
$$;