
-- Drop the existing function and recreate with proper client filtering
DROP FUNCTION IF EXISTS public.get_client_quarterly_balances();

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
  contact_name text,
  agreement_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  client_payee_ids uuid[];
  client_contact_ids uuid[];
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Find the payees associated with this client
  -- Method 1: Find payees through client_data_associations
  SELECT ARRAY_AGG(DISTINCT data_id::uuid)
  INTO client_payee_ids
  FROM public.client_data_associations
  WHERE client_user_id = current_user_id
  AND data_type = 'payee';
  
  -- Method 2: Find contacts that match the client's profile
  -- Get the client's name from their profile or contacts table
  SELECT ARRAY_AGG(DISTINCT c.id)
  INTO client_contact_ids
  FROM public.contacts c
  JOIN public.client_portal_access cpa ON cpa.subscriber_user_id = c.user_id
  WHERE cpa.client_user_id = current_user_id
  AND cpa.status = 'active';
  
  -- Also check for payees with matching contact names
  IF client_contact_ids IS NOT NULL AND array_length(client_contact_ids, 1) > 0 THEN
    SELECT ARRAY_AGG(DISTINCT p.id)
    INTO client_payee_ids
    FROM public.payees p
    JOIN public.contacts c ON c.name = p.payee_name
    WHERE c.id = ANY(client_contact_ids)
    OR p.id = ANY(COALESCE(client_payee_ids, ARRAY[]::uuid[]));
  END IF;
  
  -- If still no payees found, try to find by matching user's email to contact email
  IF client_payee_ids IS NULL OR array_length(client_payee_ids, 1) = 0 THEN
    SELECT ARRAY_AGG(DISTINCT p.id)
    INTO client_payee_ids
    FROM public.payees p
    JOIN public.contacts c ON c.name = p.payee_name
    WHERE c.email = (SELECT email FROM auth.users WHERE id = current_user_id);
  END IF;
  
  -- Return quarterly balance reports only for the client's payees
  RETURN QUERY
  SELECT 
    qbr.year,
    qbr.quarter,
    ('Q' || qbr.quarter || ' ' || qbr.year) as period_label,
    qbr.opening_balance,
    qbr.royalties_amount,
    qbr.expenses_amount,
    qbr.payments_amount,
    qbr.closing_balance,
    COALESCE(c.name, p.payee_name, 'Unknown') as contact_name,
    qbr.agreement_id
  FROM public.quarterly_balance_reports qbr
  LEFT JOIN public.contacts c ON qbr.contact_id = c.id
  LEFT JOIN public.payees p ON qbr.payee_id = p.id
  WHERE qbr.payee_id = ANY(COALESCE(client_payee_ids, ARRAY[]::uuid[]))
  ORDER BY qbr.year DESC, qbr.quarter DESC;
END;
$$;
