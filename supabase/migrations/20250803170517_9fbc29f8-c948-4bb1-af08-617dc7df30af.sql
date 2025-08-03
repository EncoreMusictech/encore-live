-- Add last_verified_at column if it doesn't exist for song_metadata_cache
ALTER TABLE song_metadata_cache 
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;

-- Add search_key column if it doesn't exist for improved cache management
ALTER TABLE song_metadata_cache 
ADD COLUMN IF NOT EXISTS search_key TEXT;

-- Add index for better performance on cache lookups
CREATE INDEX IF NOT EXISTS idx_song_metadata_cache_search_key ON song_metadata_cache(search_key);
CREATE INDEX IF NOT EXISTS idx_song_metadata_cache_verification_status ON song_metadata_cache(verification_status);
CREATE INDEX IF NOT EXISTS idx_song_metadata_cache_last_verified ON song_metadata_cache(last_verified_at DESC);

-- Update existing records to set search_key
UPDATE song_metadata_cache 
SET search_key = song_title || '|' || COALESCE(songwriter_name, '') || '|' || ''
WHERE search_key IS NULL;