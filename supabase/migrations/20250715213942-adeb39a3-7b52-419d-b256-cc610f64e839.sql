-- Check all functions that might reference batch_id
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%batch_id%';

-- Check if there are any other triggers on the table
SELECT trigger_name, action_statement, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'reconciliation_batches';

-- Let's also check the exact table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reconciliation_batches' 
AND table_schema = 'public'
ORDER BY ordinal_position;