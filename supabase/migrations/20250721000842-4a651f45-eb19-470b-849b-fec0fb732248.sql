-- Clean up duplicate original publishers, keeping only the oldest one
DELETE FROM original_publishers 
WHERE id IN (
  'ef91c971-e4e3-44c0-a064-95b7fb585c0b',
  'd6f94752-0d3d-4006-9ead-ea6cbf27fe87',
  'd3be812c-8f14-479f-9922-b694ba368567',
  'a291726c-d9b5-4619-b3a8-6ac319bddd8f',
  'eb68b0fa-0b5a-4066-9e97-796233db3122',
  'f0d1dcd9-268e-48aa-8957-a967c164cce5',
  'c765a504-ec40-4c75-9526-d270917ea617'
);