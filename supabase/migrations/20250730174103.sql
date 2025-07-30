-- Create dummy quarterly balance reports data
INSERT INTO quarterly_balance_reports (
  user_id, payee_id, year, quarter, period_label, 
  opening_balance, royalties_amount, expenses_amount, payments_amount, closing_balance,
  is_calculated, calculation_date
) VALUES 
-- Q1 2024 entries
((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM payees LIMIT 1), 2024, 1, '2024-Q1', 5000.00, 18000.00, 2500.00, 500.00, 20000.00, true, '2024-04-01 00:00:00+00'),
((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM payees LIMIT 1), 2024, 1, '2024-Q1', 3000.00, 12000.00, 3000.00, 500.00, 11500.00, true, '2024-04-01 00:00:00+00'),
-- Q2 2024 entries  
((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM payees LIMIT 1), 2024, 2, '2024-Q2', 20000.00, 21000.00, 2200.00, 15000.00, 23800.00, true, '2024-07-01 00:00:00+00'),
((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM payees LIMIT 1), 2024, 2, '2024-Q2', 11500.00, 15500.00, 3200.00, 8000.00, 15800.00, true, '2024-07-01 00:00:00+00'),
-- Q3 2024 entries
((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM payees LIMIT 1), 2024, 3, '2024-Q3', 23800.00, 17500.00, 2800.00, 12000.00, 26500.00, true, '2024-10-01 00:00:00+00'),
((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM payees LIMIT 1), 2024, 3, '2024-Q3', 15800.00, 14200.00, 2200.00, 10000.00, 17800.00, true, '2024-10-01 00:00:00+00');

-- Create dummy client account balances  
INSERT INTO client_account_balances (
  user_id, client_id, current_balance, total_earned, total_paid,
  last_statement_date, next_statement_due
) VALUES 
((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1), 26500.00, 95200.00, 68700.00, '2024-09-30', '2024-12-31'),
((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1), 17800.00, 71400.00, 53600.00, '2024-09-30', '2024-12-31');