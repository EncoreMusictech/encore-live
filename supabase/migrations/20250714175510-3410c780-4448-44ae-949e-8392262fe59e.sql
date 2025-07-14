-- Add new metadata fields to copyrights table
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS work_id text UNIQUE DEFAULT ('W' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM now())::text, 8, '0'));
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS album_title text;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS masters_ownership text;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS mp3_link text;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS contains_sample boolean DEFAULT false;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS akas text[];

-- Add PRO Work IDs and Registration tracking
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS ascap_work_id text;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS bmi_work_id text;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS socan_work_id text;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS sesac_work_id text;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS registration_status text DEFAULT 'not_registered' CHECK (registration_status IN ('not_registered', 'pending_registration', 'fully_registered', 'needs_amendment'));
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS date_submitted date;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS copyright_reg_number text;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS copyright_date date;
ALTER TABLE public.copyrights ADD COLUMN IF NOT EXISTS notice_date date;

-- Update copyright_writers table to add controlled logic and PRO affiliation
ALTER TABLE public.copyright_writers ADD COLUMN IF NOT EXISTS controlled_status text DEFAULT 'NC' CHECK (controlled_status IN ('C', 'NC'));

-- Create function to auto-generate work IDs
CREATE OR REPLACE FUNCTION public.generate_work_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_id text;
    counter integer := 1;
BEGIN
    LOOP
        new_id := 'W' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.copyrights WHERE work_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

-- Create trigger to set work_id on insert
CREATE OR REPLACE FUNCTION public.set_work_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.work_id IS NULL THEN
        NEW.work_id := public.generate_work_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for setting work_id
CREATE OR REPLACE TRIGGER trigger_set_work_id
    BEFORE INSERT ON public.copyrights
    FOR EACH ROW
    EXECUTE FUNCTION public.set_work_id();

-- Create function to calculate total controlled share
CREATE OR REPLACE FUNCTION public.calculate_controlled_share(copyright_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    total_controlled numeric;
BEGIN
    SELECT COALESCE(SUM(ownership_percentage), 0)
    INTO total_controlled
    FROM public.copyright_writers
    WHERE copyright_id = copyright_id_param
    AND controlled_status = 'C';
    
    RETURN total_controlled;
END;
$$;

-- Create trigger to update controlled share calculation
CREATE OR REPLACE FUNCTION public.update_controlled_share()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    total_controlled numeric;
BEGIN
    -- Calculate the new total controlled share
    total_controlled := public.calculate_controlled_share(COALESCE(NEW.copyright_id, OLD.copyright_id));
    
    -- Update the copyright record with calculated controlled share
    UPDATE public.copyrights
    SET validation_status = jsonb_set(
        COALESCE(validation_status, '{}'::jsonb),
        '{total_controlled_share}',
        to_jsonb(total_controlled)
    )
    WHERE id = COALESCE(NEW.copyright_id, OLD.copyright_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for controlled share updates
CREATE OR REPLACE TRIGGER trigger_update_controlled_share
    AFTER INSERT OR UPDATE OR DELETE ON public.copyright_writers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_controlled_share();