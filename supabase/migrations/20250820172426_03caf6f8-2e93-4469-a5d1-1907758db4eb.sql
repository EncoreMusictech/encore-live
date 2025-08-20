-- Drop the trigger that's causing recursion issues during quarterly report generation
DROP TRIGGER IF EXISTS update_next_period_opening_balance_trigger ON public.quarterly_balance_reports;

-- We'll handle opening balance updates differently to avoid recursion
-- The reports generation function will calculate all periods in sequence