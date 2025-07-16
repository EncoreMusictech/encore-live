-- Add statement_id column to royalties_import_staging table
ALTER TABLE public.royalties_import_staging 
ADD COLUMN statement_id text UNIQUE;

-- Create function to generate unique statement IDs
CREATE OR REPLACE FUNCTION public.generate_statement_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_statement_id text;
    counter integer := 1;
BEGIN
    LOOP
        new_statement_id := 'STMT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.royalties_import_staging WHERE statement_id = new_statement_id) THEN
            RETURN new_statement_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

-- Create trigger function to auto-set statement_id
CREATE OR REPLACE FUNCTION public.set_statement_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.statement_id IS NULL OR NEW.statement_id = '' THEN
        NEW.statement_id := public.generate_statement_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger to auto-generate statement_id on insert
CREATE TRIGGER set_statement_id_trigger
    BEFORE INSERT ON public.royalties_import_staging
    FOR EACH ROW
    EXECUTE FUNCTION public.set_statement_id();

-- Backfill existing records with statement IDs
UPDATE public.royalties_import_staging 
SET statement_id = public.generate_statement_id()
WHERE statement_id IS NULL;