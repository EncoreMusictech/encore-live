-- Check current triggers on reconciliation_batches table
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'reconciliation_batches' 
AND event_object_schema = 'public';

-- Also check the current function definition
SELECT prosrc FROM pg_proc WHERE proname = 'set_batch_id';