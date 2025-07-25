-- Drop and recreate the function with SECURITY DEFINER
DROP FUNCTION IF EXISTS add_royalty_source_if_not_exists(text);

CREATE OR REPLACE FUNCTION add_royalty_source_if_not_exists(new_source text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Input validation
  IF new_source IS NULL OR trim(new_source) = '' THEN
    RAISE EXCEPTION 'Source name cannot be null or empty';
  END IF;
  
  -- Sanitize input (remove extra whitespace, limit length)
  new_source := trim(substring(new_source, 1, 100));
  
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
$$;