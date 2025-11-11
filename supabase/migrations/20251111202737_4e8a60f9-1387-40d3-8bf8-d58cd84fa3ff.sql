
-- Update the function to have proper search_path
CREATE OR REPLACE FUNCTION remove_duplicate_copyrights()
RETURNS TABLE(deleted_count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count bigint;
BEGIN
  WITH duplicates_to_delete AS (
    SELECT id
    FROM (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY work_title, user_id ORDER BY created_at ASC) as rn
      FROM copyrights
    ) t
    WHERE rn > 1
  )
  DELETE FROM copyrights
  WHERE id IN (SELECT id FROM duplicates_to_delete);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count;
END;
$$;
