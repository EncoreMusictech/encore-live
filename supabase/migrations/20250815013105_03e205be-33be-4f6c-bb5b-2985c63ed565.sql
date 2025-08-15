-- Add MLC-specific fields to song_metadata_cache table
ALTER TABLE song_metadata_cache 
ADD COLUMN mlc_work_id text,
ADD COLUMN mlc_verification_status text DEFAULT 'pending',
ADD COLUMN mlc_confidence_score numeric(3,2) DEFAULT 0,
ADD COLUMN mlc_writers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN mlc_publishers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN mlc_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN data_quality_score numeric(3,2) DEFAULT 0,
ADD COLUMN last_mlc_lookup_at timestamp with time zone;