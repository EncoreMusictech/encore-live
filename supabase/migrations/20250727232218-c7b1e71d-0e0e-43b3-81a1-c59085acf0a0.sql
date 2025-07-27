-- First, let's improve the calculate_payout_fields trigger to include payee-level expenses
-- This trigger should calculate expenses based on payee associations, not just direct payout linkage

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
    minimum_threshold numeric := 50; -- Default minimum payout threshold
    client_payee_id uuid;
    contact_name text;
BEGIN
    -- Get the contact name for this payout's client
    SELECT c.name INTO contact_name
    FROM public.contacts c
    WHERE c.id = NEW.client_id;
    
    -- If we have a contact name, find the associated payee
    IF contact_name IS NOT NULL THEN
        SELECT p.id INTO client_payee_id
        FROM public.payees p
        WHERE p.payee_name = contact_name
        AND p.user_id = NEW.user_id
        LIMIT 1;
    END IF;
    
    -- Calculate total expenses for this payout
    -- Include both direct payout expenses and payee-level expenses
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
    
    -- Calculate cumulative royalties to date for this client
    SELECT COALESCE(SUM(gross_royalties), 0)
    INTO royalties_cumulative
    FROM public.payouts
    WHERE user_id = NEW.user_id 
    AND client_id = NEW.client_id
    AND id != NEW.id;
    
    -- Add current period royalties
    royalties_cumulative := royalties_cumulative + COALESCE(NEW.gross_royalties, 0);
    
    -- Set calculated fields
    NEW.total_expenses := total_exp;
    NEW.net_royalties := COALESCE(NEW.gross_royalties, 0) - total_exp;
    NEW.payments_to_date := payments_total;
    NEW.royalties_to_date := royalties_cumulative;
    NEW.net_payable := NEW.net_royalties - payments_total;
    
    -- Calculate amount_due based on minimum threshold
    IF NEW.net_payable >= minimum_threshold THEN
        NEW.amount_due := NEW.net_payable;
    ELSE
        NEW.amount_due := 0;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create a function to link expenses to payouts when they're created
CREATE OR REPLACE FUNCTION public.link_expenses_to_payout(payout_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    payout_record public.payouts%ROWTYPE;
    contact_name text;
    client_payee_id uuid;
BEGIN
    -- Get the payout details
    SELECT * INTO payout_record
    FROM public.payouts
    WHERE id = payout_id_param;
    
    IF payout_record.id IS NULL THEN
        RAISE EXCEPTION 'Payout not found: %', payout_id_param;
    END IF;
    
    -- Get the contact name for this payout's client
    SELECT c.name INTO contact_name
    FROM public.contacts c
    WHERE c.id = payout_record.client_id;
    
    -- If we have a contact name, find the associated payee
    IF contact_name IS NOT NULL THEN
        SELECT p.id INTO client_payee_id
        FROM public.payees p
        WHERE p.payee_name = contact_name
        AND p.user_id = payout_record.user_id
        LIMIT 1;
        
        -- Link unlinked expenses for this payee to this payout
        IF client_payee_id IS NOT NULL THEN
            UPDATE public.payout_expenses
            SET payout_id = payout_id_param
            WHERE payee_id = client_payee_id
            AND payout_id IS NULL
            AND user_id = payout_record.user_id
            AND expense_status = 'approved'
            AND (is_recoupable = true OR (expense_flags->>'recoupable')::boolean = true);
        END IF;
    END IF;
END;
$function$;

-- Add a trigger to automatically link expenses when a payout is created
CREATE OR REPLACE FUNCTION public.auto_link_expenses_on_payout_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Only execute on INSERT
    IF TG_OP = 'INSERT' THEN
        -- Link expenses in a separate transaction to avoid conflicts
        PERFORM public.link_expenses_to_payout(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the trigger (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'auto_link_expenses_trigger'
        AND tgrelid = 'public.payouts'::regclass
    ) THEN
        CREATE TRIGGER auto_link_expenses_trigger
            AFTER INSERT ON public.payouts
            FOR EACH ROW
            EXECUTE FUNCTION public.auto_link_expenses_on_payout_creation();
    END IF;
END
$$;