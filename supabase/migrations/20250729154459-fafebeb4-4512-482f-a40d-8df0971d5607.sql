-- Fix the copyright that has over 100% writer ownership
-- First, let's identify and fix copyrights with invalid writer totals
UPDATE copyright_writers 
SET ownership_percentage = 50.00
WHERE copyright_id = '20b66d4a-ffb5-4740-a909-cc70c5c24438' 
AND writer_name = 'Janishia Jones';

-- Also check and fix any other copyrights that might have ownership issues
-- Find copyrights where writer percentages don't add up to 100%
WITH writer_totals AS (
  SELECT 
    copyright_id, 
    SUM(ownership_percentage) as total_writers
  FROM copyright_writers 
  GROUP BY copyright_id
  HAVING SUM(ownership_percentage) != 100
)
UPDATE copyright_writers 
SET ownership_percentage = CASE 
  WHEN ROW_NUMBER() OVER (PARTITION BY copyright_id ORDER BY created_at) = 1 
  THEN 100 - (
    SELECT SUM(cw2.ownership_percentage) 
    FROM copyright_writers cw2 
    WHERE cw2.copyright_id = copyright_writers.copyright_id 
    AND cw2.id != copyright_writers.id
  )
  ELSE ownership_percentage
END
FROM writer_totals wt
WHERE copyright_writers.copyright_id = wt.copyright_id;

-- Update validation status for the corrected copyrights
UPDATE copyrights 
SET validation_status = jsonb_build_object(
    'writers_total', (
        SELECT COALESCE(SUM(cw.ownership_percentage), 0)
        FROM copyright_writers cw 
        WHERE cw.copyright_id = copyrights.id
    ),
    'publishers_total', (
        SELECT COALESCE(SUM(cp.ownership_percentage), 0)
        FROM copyright_publishers cp 
        WHERE cp.copyright_id = copyrights.id
    ),
    'writers_valid', (
        SELECT COALESCE(SUM(cw.ownership_percentage), 0) = 100
        FROM copyright_writers cw 
        WHERE cw.copyright_id = copyrights.id
    ),
    'publishers_valid', (
        SELECT COALESCE(SUM(cp.ownership_percentage), 0) = 100
        FROM copyright_publishers cp 
        WHERE cp.copyright_id = copyrights.id
    ),
    'total_controlled_share', (
        SELECT COALESCE(SUM(cw.ownership_percentage), 0)
        FROM copyright_writers cw 
        WHERE cw.copyright_id = copyrights.id 
        AND cw.controlled_status = 'C'
    ),
    'last_validated', now()
);