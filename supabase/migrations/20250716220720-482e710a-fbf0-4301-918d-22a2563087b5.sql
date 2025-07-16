-- Add unique royalty_id field to royalty_allocations table
ALTER TABLE public.royalty_allocations 
ADD COLUMN royalty_id TEXT;

-- Create function to generate unique royalty IDs
CREATE OR REPLACE FUNCTION public.generate_royalty_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_royalty_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_royalty_id := 'ROY-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.royalty_allocations WHERE royalty_id = new_royalty_id) THEN
            RETURN new_royalty_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

-- Create trigger to auto-generate royalty IDs for new records
CREATE OR REPLACE FUNCTION public.set_royalty_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.royalty_id IS NULL OR NEW.royalty_id = '' THEN
        NEW.royalty_id := public.generate_royalty_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_royalty_id ON public.royalty_allocations;
CREATE TRIGGER trigger_set_royalty_id
    BEFORE INSERT ON public.royalty_allocations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_royalty_id();

-- Update existing records with unique royalty IDs
UPDATE public.royalty_allocations 
SET royalty_id = public.generate_royalty_id() 
WHERE royalty_id IS NULL;

-- Make royalty_id NOT NULL after populating existing records
ALTER TABLE public.royalty_allocations 
ALTER COLUMN royalty_id SET NOT NULL;