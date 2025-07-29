-- Fix the copyright that has over 100% writer ownership
-- Simply fix the specific problematic record
UPDATE copyright_writers 
SET ownership_percentage = 50.00
WHERE copyright_id = '20b66d4a-ffb5-4740-a909-cc70c5c24438' 
AND writer_name = 'Janishia Jones';

-- Update validation status for all copyrights with correct calculations
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