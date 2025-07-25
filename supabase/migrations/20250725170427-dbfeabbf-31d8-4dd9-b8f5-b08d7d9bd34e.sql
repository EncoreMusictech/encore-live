-- Create a function to safely add new enum values to royalty_source
CREATE OR REPLACE FUNCTION add_royalty_source_if_not_exists(new_source text)
RETURNS void AS $$
BEGIN
  -- Check if the enum value already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = new_source 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'royalty_source')
  ) THEN
    -- Add the new enum value
    EXECUTE format('ALTER TYPE royalty_source ADD VALUE %L', new_source);
  END IF;
END;
$$ LANGUAGE plpgsql;