
-- Add expense tracking table
CREATE TABLE public.payout_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payout_id UUID REFERENCES public.payouts(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL, -- 'admin_fee', 'processing_fee', 'other'
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_percentage BOOLEAN DEFAULT false,
  percentage_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add account balances tracking table
CREATE TABLE public.client_account_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  current_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_statement_date DATE,
  next_statement_due DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Enhance payouts table with additional fields
ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS admin_fee_percentage NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_fee_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_fee_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS statement_notes TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS approved_by_user_id UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add RLS policies for new tables
ALTER TABLE public.payout_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_account_balances ENABLE ROW LEVEL SECURITY;

-- RLS policies for payout_expenses
CREATE POLICY "Users can manage their own payout expenses" ON public.payout_expenses
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for client_account_balances  
CREATE POLICY "Users can manage their own client balances" ON public.client_account_balances
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_payout_expenses_updated_at
    BEFORE UPDATE ON public.payout_expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_account_balances_updated_at
    BEFORE UPDATE ON public.client_account_balances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update client balances when payouts change
CREATE OR REPLACE FUNCTION public.update_client_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update balance when payout is created, updated, or deleted
    IF TG_OP = 'DELETE' THEN
        -- Handle deletion
        INSERT INTO public.client_account_balances (user_id, client_id, current_balance, total_earned, total_paid)
        SELECT 
            OLD.user_id,
            OLD.client_id,
            COALESCE(SUM(CASE WHEN p.status = 'pending' OR p.status = 'approved' THEN p.amount_due ELSE 0 END), 0),
            COALESCE(SUM(p.gross_royalties), 0),
            COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_due ELSE 0 END), 0)
        FROM public.payouts p
        WHERE p.user_id = OLD.user_id AND p.client_id = OLD.client_id
        GROUP BY p.user_id, p.client_id
        ON CONFLICT (user_id, client_id) DO UPDATE SET
            current_balance = EXCLUDED.current_balance,
            total_earned = EXCLUDED.total_earned,
            total_paid = EXCLUDED.total_paid,
            updated_at = now();
        
        RETURN OLD;
    ELSE
        -- Handle insert or update
        INSERT INTO public.client_account_balances (user_id, client_id, current_balance, total_earned, total_paid)
        SELECT 
            NEW.user_id,
            NEW.client_id,
            COALESCE(SUM(CASE WHEN p.status = 'pending' OR p.status = 'approved' THEN p.amount_due ELSE 0 END), 0),
            COALESCE(SUM(p.gross_royalties), 0),
            COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_due ELSE 0 END), 0)
        FROM public.payouts p
        WHERE p.user_id = NEW.user_id AND p.client_id = NEW.client_id
        GROUP BY p.user_id, p.client_id
        ON CONFLICT (user_id, client_id) DO UPDATE SET
            current_balance = EXCLUDED.current_balance,
            total_earned = EXCLUDED.total_earned,
            total_paid = EXCLUDED.total_paid,
            updated_at = now();
        
        RETURN NEW;
    END IF;
END;
$$;

-- Create trigger for client balance updates
CREATE TRIGGER update_client_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_balance();
