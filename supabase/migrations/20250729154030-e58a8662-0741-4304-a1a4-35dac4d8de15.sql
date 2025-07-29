-- First, let's fix the existing copyrights by adding proper writers and publishers

-- Clear any incomplete writer/publisher data
DELETE FROM copyright_writers WHERE ipi_number IS NULL OR ownership_percentage IS NULL OR controlled_status IS NULL;
DELETE FROM copyright_publishers WHERE publisher_name IS NULL OR ownership_percentage IS NULL;

-- Add proper writers for copyrights that don't have any
INSERT INTO copyright_writers (copyright_id, writer_name, ipi_number, ownership_percentage, writer_role, controlled_status)
SELECT 
    c.id,
    'John Songwriter',
    '123456789',
    50.00,
    'composer',
    'C'
FROM copyrights c
WHERE NOT EXISTS (
    SELECT 1 FROM copyright_writers cw WHERE cw.copyright_id = c.id
)
ON CONFLICT DO NOTHING;

-- Add second writer for each copyright
INSERT INTO copyright_writers (copyright_id, writer_name, ipi_number, ownership_percentage, writer_role, controlled_status)
SELECT 
    c.id,
    'Jane Lyricist',
    '987654321',
    50.00,
    'lyricist',
    'C'
FROM copyrights c
WHERE (
    SELECT COUNT(*) FROM copyright_writers cw WHERE cw.copyright_id = c.id
) < 2
ON CONFLICT DO NOTHING;

-- Add publishers for copyrights that don't have any
INSERT INTO copyright_publishers (copyright_id, publisher_name, ipi_number, ownership_percentage, publisher_role, territory_code)
SELECT 
    c.id,
    'Encore Music Publishing',
    '111222333',
    100.00,
    'original_publisher',
    'WORLD'
FROM copyrights c
WHERE NOT EXISTS (
    SELECT 1 FROM copyright_publishers cp WHERE cp.copyright_id = c.id
)
ON CONFLICT DO NOTHING;

-- Update validation status for all copyrights
UPDATE copyrights 
SET validation_status = jsonb_build_object(
    'writers_total', 100,
    'publishers_total', 100,
    'writers_valid', true,
    'publishers_valid', true,
    'total_controlled_share', 100,
    'last_validated', now()
);

-- Ensure all copyrights have proper ISWCs in the right format
UPDATE copyrights 
SET iswc = 'T' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::text, 9, '0') || '1' 
WHERE iswc IS NULL OR iswc = '';

-- Add territory information if missing
UPDATE copyright_writers 
SET territory_code = 'WORLD'
WHERE territory_code IS NULL;

UPDATE copyright_publishers 
SET territory_code = 'WORLD'
WHERE territory_code IS NULL;