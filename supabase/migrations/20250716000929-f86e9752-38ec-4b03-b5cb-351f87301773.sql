-- Create a trigger function to sync import staging status with reconciliation batch status
CREATE OR REPLACE FUNCTION sync_import_staging_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If the reconciliation batch status is updated to 'Processed' and it has a linked statement
  IF NEW.status = 'Processed' AND OLD.status != 'Processed' AND NEW.linked_statement_id IS NOT NULL THEN
    UPDATE public.royalties_import_staging 
    SET processing_status = 'processed'
    WHERE id = NEW.linked_statement_id;
    
    RAISE LOG 'Updated import staging record % status to processed due to batch % being processed', NEW.linked_statement_id, NEW.id;
  END IF;
  
  -- If the reconciliation batch status is updated back to 'Pending' or 'Imported' and it has a linked statement
  IF (NEW.status = 'Pending' OR NEW.status = 'Imported') AND OLD.status = 'Processed' AND NEW.linked_statement_id IS NOT NULL THEN
    -- Check if the staging record has validation errors or unmapped fields
    UPDATE public.royalties_import_staging 
    SET processing_status = CASE 
      WHEN (validation_status->>'hasErrors')::boolean = true OR 
           (validation_status->>'hasUnmapped')::boolean = true OR
           array_length(unmapped_fields, 1) > 0 
      THEN 'needs_review'
      ELSE 'pending'
    END
    WHERE id = NEW.linked_statement_id;
    
    RAISE LOG 'Reverted import staging record % status due to batch % status change', NEW.linked_statement_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on reconciliation_batches table
DROP TRIGGER IF EXISTS sync_import_staging_on_batch_update ON public.reconciliation_batches;
CREATE TRIGGER sync_import_staging_on_batch_update
  AFTER UPDATE ON public.reconciliation_batches
  FOR EACH ROW
  EXECUTE FUNCTION sync_import_staging_status();