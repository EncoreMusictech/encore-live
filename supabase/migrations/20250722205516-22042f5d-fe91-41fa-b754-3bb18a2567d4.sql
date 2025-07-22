-- Create quarterly balance reports table
CREATE TABLE public.quarterly_balance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payee_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  agreement_id UUID REFERENCES public.contracts(id),
  
  -- Period information
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  period_label TEXT GENERATED ALWAYS AS (year || ' Q' || quarter) STORED,
  
  -- Financial amounts (all in cents for precision, display as dollars)
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  royalties_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expenses_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payments_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Calculation tracking
  is_calculated BOOLEAN NOT NULL DEFAULT false,
  calculation_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique records per payee per period
  UNIQUE(user_id, payee_id, year, quarter)
);

-- Enable RLS
ALTER TABLE public.quarterly_balance_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own quarterly balance reports" 
ON public.quarterly_balance_reports 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_quarterly_balance_reports_user_payee ON public.quarterly_balance_reports(user_id, payee_id);
CREATE INDEX idx_quarterly_balance_reports_period ON public.quarterly_balance_reports(year, quarter);
CREATE INDEX idx_quarterly_balance_reports_contact ON public.quarterly_balance_reports(contact_id);

-- Create function to auto-calculate closing balance
CREATE OR REPLACE FUNCTION public.calculate_closing_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.closing_balance := ROUND(
        NEW.opening_balance + NEW.royalties_amount - NEW.expenses_amount - NEW.payments_amount, 
        2
    );
    NEW.is_calculated := true;
    NEW.calculation_date := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-calculation
CREATE TRIGGER calculate_closing_balance_trigger
BEFORE INSERT OR UPDATE OF opening_balance, royalties_amount, expenses_amount, payments_amount
ON public.quarterly_balance_reports
FOR EACH ROW
EXECUTE FUNCTION public.calculate_closing_balance();

-- Create function to update next period opening balance
CREATE OR REPLACE FUNCTION public.update_next_period_opening_balance()
RETURNS TRIGGER AS $$
DECLARE
    next_year INTEGER;
    next_quarter INTEGER;
BEGIN
    -- Calculate next period
    IF NEW.quarter = 4 THEN
        next_year := NEW.year + 1;
        next_quarter := 1;
    ELSE
        next_year := NEW.year;
        next_quarter := NEW.quarter + 1;
    END IF;
    
    -- Update or insert next period record
    INSERT INTO public.quarterly_balance_reports (
        user_id, payee_id, contact_id, agreement_id, 
        year, quarter, opening_balance
    )
    VALUES (
        NEW.user_id, NEW.payee_id, NEW.contact_id, NEW.agreement_id,
        next_year, next_quarter, NEW.closing_balance
    )
    ON CONFLICT (user_id, payee_id, year, quarter) 
    DO UPDATE SET 
        opening_balance = NEW.closing_balance,
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update next period
CREATE TRIGGER update_next_period_opening_balance_trigger
AFTER INSERT OR UPDATE OF closing_balance
ON public.quarterly_balance_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_next_period_opening_balance();

-- Create trigger for updated_at
CREATE TRIGGER update_quarterly_balance_reports_updated_at
BEFORE UPDATE ON public.quarterly_balance_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();