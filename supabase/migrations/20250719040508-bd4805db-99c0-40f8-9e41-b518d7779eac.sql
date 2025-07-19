-- Update media_type check constraint to allow more values
ALTER TABLE public.sync_licenses 
DROP CONSTRAINT IF EXISTS sync_licenses_media_type_check;

ALTER TABLE public.sync_licenses 
ADD CONSTRAINT sync_licenses_media_type_check 
CHECK (media_type IN (
  'Film', 'TV', 'Television', 'Documentary', 'Commercial', 'Ad', 
  'Video Game', 'Game', 'Web Series', 'Podcast', 'Audio Book', 
  'Streaming', 'Social', 'Other'
));