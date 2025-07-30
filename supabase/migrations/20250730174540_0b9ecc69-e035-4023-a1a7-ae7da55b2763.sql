-- Clear existing dummy data and recreate with proper relationships
DELETE FROM client_account_balances;
DELETE FROM quarterly_balance_reports;

-- Get the first user to use for demo data
DO $$ 
DECLARE
    demo_user_id uuid;
    demo_writer_id uuid;
    demo_payee_id uuid;
    demo_op_id uuid;
BEGIN
    -- Get first user
    SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in the database';
    END IF;
    
    -- Create original publisher if it doesn't exist
    INSERT INTO original_publishers (user_id, publisher_name, op_id, contact_info)
    SELECT demo_user_id, 'Demo Original Publisher', 'OP-2024-DEMO', '{}'::jsonb
    WHERE NOT EXISTS (
        SELECT 1 FROM original_publishers WHERE user_id = demo_user_id
    )
    RETURNING id INTO demo_op_id;
    
    -- Get existing original publisher if we didn't create one
    IF demo_op_id IS NULL THEN
        SELECT id INTO demo_op_id FROM original_publishers WHERE user_id = demo_user_id LIMIT 1;
    END IF;
    
    -- Create writer if it doesn't exist
    INSERT INTO writers (user_id, writer_name, writer_id, original_publisher_id, contact_info)
    SELECT demo_user_id, 'Demo Writer', 'WR-2024-DEMO', demo_op_id, '{}'::jsonb
    WHERE NOT EXISTS (
        SELECT 1 FROM writers WHERE user_id = demo_user_id
    )
    RETURNING id INTO demo_writer_id;
    
    -- Get existing writer if we didn't create one
    IF demo_writer_id IS NULL THEN
        SELECT id INTO demo_writer_id FROM writers WHERE user_id = demo_user_id LIMIT 1;
    END IF;
    
    -- Create payee if it doesn't exist
    INSERT INTO payees (user_id, payee_name, payee_type, writer_id, contact_info, payment_info)
    SELECT demo_user_id, 'Demo Writer', 'writer', demo_writer_id, 
           '{"email": "demo@example.com", "phone": "+1-555-0123"}'::jsonb,
           '{"payment_method": "bank_transfer", "bank_name": "Demo Bank"}'::jsonb
    WHERE NOT EXISTS (
        SELECT 1 FROM payees WHERE user_id = demo_user_id
    )
    RETURNING id INTO demo_payee_id;
    
    -- Get existing payee if we didn't create one
    IF demo_payee_id IS NULL THEN
        SELECT id INTO demo_payee_id FROM payees WHERE user_id = demo_user_id LIMIT 1;
    END IF;
    
    -- Create quarterly balance reports
    INSERT INTO quarterly_balance_reports (
        user_id, payee_id, year, quarter, 
        opening_balance, royalties_amount, expenses_amount, payments_amount, closing_balance,
        is_calculated, calculation_date
    ) VALUES 
        (demo_user_id, demo_payee_id, 2024, 1, 5000.00, 18000.00, 2500.00, 500.00, 20000.00, true, '2024-04-01 00:00:00+00'),
        (demo_user_id, demo_payee_id, 2024, 2, 20000.00, 21000.00, 2200.00, 15000.00, 23800.00, true, '2024-07-01 00:00:00+00'),
        (demo_user_id, demo_payee_id, 2024, 3, 23800.00, 17500.00, 2800.00, 12000.00, 26500.00, true, '2024-10-01 00:00:00+00');
    
    -- Create client account balances
    INSERT INTO client_account_balances (
        user_id, client_id, current_balance, total_earned, total_paid,
        last_statement_date, next_statement_due
    ) VALUES 
        (demo_user_id, demo_user_id, 26500.00, 95200.00, 68700.00, '2024-09-30', '2024-12-31');
        
END $$;