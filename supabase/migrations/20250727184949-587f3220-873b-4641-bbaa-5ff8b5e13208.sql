-- Fix security warnings by adding search_path to the new functions
CREATE OR REPLACE FUNCTION public.calculate_payout_fields()
RETURNS TRIGGER AS $$
DECLARE
    total_exp numeric := 0;
    payments_total numeric := 0;
    royalties_cumulative numeric := 0;
    minimum_threshold numeric := 50; -- Default minimum payout threshold
BEGIN
    -- Calculate total expenses for this payout
    SELECT COALESCE(SUM(amount), 0)
    INTO total_exp
    FROM public.payout_expenses
    WHERE payout_id = NEW.id;
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to recalculate all payouts when expenses change
CREATE OR REPLACE FUNCTION public.recalculate_payout_on_expense_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the related payout to trigger recalculation
    UPDATE public.payouts 
    SET updated_at = now() 
    WHERE id = COALESCE(NEW.payout_id, OLD.payout_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;