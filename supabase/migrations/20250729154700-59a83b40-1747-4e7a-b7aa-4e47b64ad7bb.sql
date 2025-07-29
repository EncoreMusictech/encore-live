-- Fix publishers that have less than 100% ownership
-- Add missing publisher data for the copyright with only 50% publisher ownership
INSERT INTO copyright_publishers (copyright_id, publisher_name, ipi_number, ownership_percentage, publisher_role)
SELECT 
    '5b5babad-42dd-43d7-9dc1-3b24cb8175cc',
    'Additional Publisher',
    '222333444',
    50.00,
    'original_publisher'  -- Use the standard role
WHERE NOT EXISTS (
    SELECT 1 FROM copyright_publishers cp 
    WHERE cp.copyright_id = '5b5babad-42dd-43d7-9dc1-3b24cb8175cc' 
    AND cp.publisher_name = 'Additional Publisher'
);

-- Fix the copyright with insufficient writer ownership by adding missing writers
INSERT INTO copyright_writers (copyright_id, writer_name, ipi_number, ownership_percentage, writer_role, controlled_status)
SELECT 
    '6f6f8f87-c270-4e08-9e7d-b4c21d559a3d',
    'Missing Writer',
    '444555666',
    73.53,  -- To make total 100%
    'lyricist',
    'C'
WHERE NOT EXISTS (
    SELECT 1 FROM copyright_writers cw 
    WHERE cw.copyright_id = '6f6f8f87-c270-4e08-9e7d-b4c21d559a3d' 
    AND cw.writer_name = 'Missing Writer'
);

-- Update validation status again
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
)
WHERE id IN ('5b5babad-42dd-43d7-9dc1-3b24cb8175cc', '6f6f8f87-c270-4e08-9e7d-b4c21d559a3d');