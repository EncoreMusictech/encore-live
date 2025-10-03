-- Create function to auto-link expenses to payouts when expenses are created
CREATE OR REPLACE FUNCTION public.auto_link_expense_on_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    matching_payout_id uuid;
BEGIN
    -- Only proceed if the expense doesn't already have a payout_id
    -- and is approved and recoupable
    IF NEW.payout_id IS NULL 
       AND NEW.expense_status = 'approved' 
       AND (NEW.is_recoupable = true OR (NEW.expense_flags->>'recoupable')::boolean = true)
       AND NEW.payee_id IS NOT NULL THEN
        
        -- Find the most recent pending or approved payout for this payee
        SELECT p.id INTO matching_payout_id
        FROM public.payouts p
        WHERE p.payee_id = NEW.payee_id
        AND p.user_id = NEW.user_id
        AND p.status IN ('pending', 'approved')
        ORDER BY p.created_at DESC
        LIMIT 1;
        
        -- If we found a matching payout, link the expense to it
        IF matching_payout_id IS NOT NULL THEN
            NEW.payout_id := matching_payout_id;
            
            -- Log that we auto-linked the expense
            RAISE NOTICE 'Auto-linked expense % to payout %', NEW.id, matching_payout_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger that runs BEFORE INSERT on payout_expenses
DROP TRIGGER IF EXISTS trigger_auto_link_expense_on_creation ON public.payout_expenses;
CREATE TRIGGER trigger_auto_link_expense_on_creation
    BEFORE INSERT ON public.payout_expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_link_expense_on_creation();