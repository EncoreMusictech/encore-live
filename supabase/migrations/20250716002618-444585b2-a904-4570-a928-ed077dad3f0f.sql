-- Insert sample copyrights for testing the song matching functionality
INSERT INTO public.copyrights (
  user_id,
  work_title,
  work_id,
  iswc,
  work_type,
  status,
  created_at,
  updated_at
) VALUES 
(
  '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b',
  'ANOTHER ONE',
  'W20250716-001',
  'T-123456789-1',
  'original',
  'active',
  now(),
  now()
),
(
  '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b',
  'AT THA HOUSE',
  'W20250716-002',
  'T-123456789-2',
  'original',
  'active',
  now(),
  now()
),
(
  '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b',
  'BAGG',
  'W20250716-003',
  'T-123456789-3',
  'original',
  'active',
  now(),
  now()
),
(
  '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b',
  'BEEPER RECORD',
  'W20250716-004',
  'T-123456789-4',
  'original',
  'active',
  now(),
  now()
),
(
  '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b',
  'IMA GANGSTA',
  'W20250716-005',
  'T-123456789-5',
  'original',
  'active',
  now(),
  now()
),
(
  '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b',
  'IN MY PRAYERS',
  'W20250716-006',
  'T-123456789-6',
  'original',
  'active',
  now(),
  now()
);