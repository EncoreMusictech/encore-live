-- Update calculate_payout_fields to calculate Royalties to Date as cumulative sum of Gross Royalties (ITD)

CREATE OR REPLACE FUNCTION public.calculate_payout_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    total_exp numeric := 0;
    payments_total numeric := 0;
    royalties_cumulative numeric := 0;
    minimum_threshold numeric := 50;
    client_payee_id uuid;
    client_contact_name text;
    agreement_commission numeric := 0;
    total_royalties_amount numeric := 0;
    commissions_deducted numeric := 0;
BEGIN
    -- Get the contact name for this payout's client
    SELECT c.name INTO client_contact_name
    FROM public.contacts c
    WHERE c.id = NEW.client_id;
    
    -- If we have a contact name, find the associated payee
    IF client_contact_name IS NOT NULL THEN
        SELECT p.id INTO client_payee_id
        FROM public.payees p
        WHERE p.payee_name = client_contact_name
        AND p.user_id = NEW.user_id
        LIMIT 1;
    END IF;
    
    -- Calculate total royalties ONLY from royalties linked to THIS payout
    SELECT COALESCE(SUM(pr.allocated_amount), 0)
    INTO total_royalties_amount
    FROM public.payout_royalties pr
    WHERE pr.payout_id = NEW.id;
    
    -- If no linked royalties yet (e.g., on initial insert), use the gross_royalties value passed in
    IF total_royalties_amount = 0 AND NEW.gross_royalties IS NOT NULL THEN
        total_royalties_amount := NEW.gross_royalties;
    END IF;
    
    -- Try to find an active or signed agreement for this client to get commission percentage
    SELECT COALESCE(commission_percentage, 0)
    INTO agreement_commission
    FROM public.contracts
    WHERE user_id = NEW.user_id
    AND counterparty_name = client_contact_name
    AND contract_status IN ('active', 'signed')
    AND contract_type = 'publishing'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Calculate commissions based on agreement
    commissions_deducted := COALESCE(total_royalties_amount * (agreement_commission / 100.0), 0);
    
    -- Calculate total expenses for this payout
    SELECT COALESCE(SUM(amount), 0)
    INTO total_exp
    FROM public.payout_expenses
    WHERE (payout_id = NEW.id OR (payee_id = client_payee_id AND payout_id IS NULL))
    AND user_id = NEW.user_id
    AND expense_status = 'approved'
    AND (is_recoupable = true OR (expense_flags->>'recoupable')::boolean = true);
    
    -- Calculate payments to date for this client/payee
    SELECT COALESCE(SUM(amount_due), 0)
    INTO payments_total
    FROM public.payouts
    WHERE user_id = NEW.user_id 
    AND client_id = NEW.client_id
    AND status = 'paid'
    AND id != NEW.id;
    
    -- FIX: Calculate Royalties to Date as cumulative sum of GROSS ROYALTIES (ITD - Inception To Date)
    -- This includes all previous payouts' gross_royalties plus the current period
    SELECT COALESCE(SUM(gross_royalties), 0)
    INTO royalties_cumulative
    FROM public.payouts
    WHERE user_id = NEW.user_id 
    AND client_id = NEW.client_id
    AND id != NEW.id;
    
    -- Add current period gross royalties (after commissions)
    royalties_cumulative := COALESCE(royalties_cumulative + (total_royalties_amount - commissions_deducted), (total_royalties_amount - commissions_deducted));
    
    -- Set calculated fields
    NEW.total_royalties := COALESCE(total_royalties_amount, 0);
    NEW.commissions_amount := COALESCE(commissions_deducted, 0);
    NEW.gross_royalties := COALESCE(total_royalties_amount - commissions_deducted, NEW.gross_royalties, 0);
    NEW.total_expenses := COALESCE(total_exp, 0);
    NEW.net_royalties := COALESCE(NEW.gross_royalties - total_exp, 0);
    NEW.payments_to_date := COALESCE(payments_total, 0);
    NEW.royalties_to_date := COALESCE(royalties_cumulative, 0);
    NEW.net_payable := COALESCE(NEW.net_royalties - payments_total, 0);
    
    -- Calculate amount_due based on minimum threshold
    IF COALESCE(NEW.net_payable, 0) >= minimum_threshold THEN
        NEW.amount_due := COALESCE(NEW.net_payable, 0);
    ELSE
        NEW.amount_due := 0;
    END IF;
    
    RETURN NEW;
END;
$function$;