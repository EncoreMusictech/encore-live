-- Clear existing dummy data and recreate
DELETE FROM client_account_balances;
DELETE FROM quarterly_balance_reports;

-- Ensure we have at least one payee for the dummy data
INSERT INTO payees (user_id, payee_name, payee_type, writer_id, contact_info, payment_info)
SELECT 
  au.id,
  'Demo Writer',
  'writer',
  gen_random_uuid(),
  '{"email": "demo@example.com", "phone": "+1-555-0123"}'::jsonb,
  '{"payment_method": "bank_transfer", "bank_name": "Demo Bank"}'::jsonb
FROM auth.users au 
WHERE NOT EXISTS (
  SELECT 1 FROM payees p WHERE p.user_id = au.id
)
LIMIT 1;

-- Create dummy quarterly balance reports data (without period_label since it's generated)
INSERT INTO quarterly_balance_reports (
  user_id, payee_id, year, quarter, 
  opening_balance, royalties_amount, expenses_amount, payments_amount, closing_balance,
  is_calculated, calculation_date
) 
SELECT 
  au.id,
  p.id,
  2024,
  1,
  5000.00,
  18000.00,
  2500.00,
  500.00,
  20000.00,
  true,
  '2024-04-01 00:00:00+00'
FROM auth.users au
CROSS JOIN payees p
WHERE p.user_id = au.id
LIMIT 1;

-- Add more quarterly data
INSERT INTO quarterly_balance_reports (
  user_id, payee_id, year, quarter, 
  opening_balance, royalties_amount, expenses_amount, payments_amount, closing_balance,
  is_calculated, calculation_date
) 
SELECT 
  au.id,
  p.id,
  qdata.year,
  qdata.quarter,
  qdata.opening_balance,
  qdata.royalties_amount,
  qdata.expenses_amount,
  qdata.payments_amount,
  qdata.closing_balance,
  true,
  qdata.calculation_date
FROM auth.users au
CROSS JOIN payees p
CROSS JOIN (VALUES 
  (2024, 2, 20000.00, 21000.00, 2200.00, 15000.00, 23800.00, '2024-07-01 00:00:00+00'::timestamptz),
  (2024, 3, 23800.00, 17500.00, 2800.00, 12000.00, 26500.00, '2024-10-01 00:00:00+00'::timestamptz)
) AS qdata(year, quarter, opening_balance, royalties_amount, expenses_amount, payments_amount, closing_balance, calculation_date)
WHERE p.user_id = au.id
LIMIT 2;

-- Create dummy client account balances  
INSERT INTO client_account_balances (
  user_id, client_id, current_balance, total_earned, total_paid,
  last_statement_date, next_statement_due
) 
SELECT 
  au.id,
  au.id,
  26500.00,
  95200.00,
  68700.00,
  '2024-09-30',
  '2024-12-31'
FROM auth.users au
LIMIT 1;