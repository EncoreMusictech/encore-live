-- Create dummy quarterly balance reports data
INSERT INTO quarterly_balance_reports (
  id, user_id, report_period, total_balance, total_royalties, 
  total_expenses, total_payments, work_title, right_type, territory
) VALUES 
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), '2024-Q1', 15000.00, 18000.00, 2500.00, 500.00, 'Summer Vibes', 'Performance', 'US'),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), '2024-Q1', 8500.00, 12000.00, 3000.00, 500.00, 'Midnight Dreams', 'Mechanical', 'UK'),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), '2024-Q1', 22000.00, 25000.00, 2800.00, 200.00, 'City Lights', 'Sync', 'CA'),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), '2024-Q2', 18500.00, 21000.00, 2200.00, 300.00, 'Ocean Waves', 'Performance', 'US'),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), '2024-Q2', 12000.00, 15500.00, 3200.00, 300.00, 'Summer Vibes', 'Digital', 'UK');