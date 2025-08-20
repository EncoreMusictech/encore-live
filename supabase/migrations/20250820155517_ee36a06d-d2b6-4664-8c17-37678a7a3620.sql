-- Fix the insert_quarterly_reports_batch function to remove superuser requirement
CREATE OR REPLACE FUNCTION public.insert_quarterly_reports_batch(reports_data jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    report_record jsonb;
    inserted_count integer := 0;
BEGIN
    -- Loop through each report in the batch
    FOR report_record IN SELECT * FROM jsonb_array_elements(reports_data)
    LOOP
        BEGIN
            -- Insert each report individually with error handling
            INSERT INTO public.quarterly_balance_reports (
                user_id, payee_id, contact_id, year, quarter, 
                opening_balance, royalties_amount, expenses_amount, 
                payments_amount, closing_balance, is_calculated, 
                calculation_date, created_at, updated_at
            ) VALUES (
                (report_record->>'user_id')::uuid,
                (report_record->>'payee_id')::uuid,
                CASE WHEN report_record->>'contact_id' = 'null' OR report_record->>'contact_id' IS NULL 
                     THEN NULL 
                     ELSE (report_record->>'contact_id')::uuid 
                END,
                (report_record->>'year')::integer,
                (report_record->>'quarter')::integer,
                (report_record->>'opening_balance')::numeric,
                (report_record->>'royalties_amount')::numeric,
                (report_record->>'expenses_amount')::numeric,
                (report_record->>'payments_amount')::numeric,
                (report_record->>'closing_balance')::numeric,
                (report_record->>'is_calculated')::boolean,
                (report_record->>'calculation_date')::timestamp with time zone,
                now(),
                now()
            )
            ON CONFLICT (user_id, payee_id, year, quarter) 
            DO UPDATE SET
                opening_balance = EXCLUDED.opening_balance,
                royalties_amount = EXCLUDED.royalties_amount,
                expenses_amount = EXCLUDED.expenses_amount,
                payments_amount = EXCLUDED.payments_amount,
                closing_balance = EXCLUDED.closing_balance,
                is_calculated = EXCLUDED.is_calculated,
                calculation_date = EXCLUDED.calculation_date,
                updated_at = now();
                
            inserted_count := inserted_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but continue with other records
            RAISE LOG 'Failed to insert quarterly report: %', SQLERRM;
        END;
    END LOOP;
    
    RETURN inserted_count;
END;
$function$