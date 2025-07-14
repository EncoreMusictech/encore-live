-- Create copyrights table for work registrations
CREATE TABLE public.copyrights (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    
    -- Work identification
    work_title text NOT NULL,
    internal_id text UNIQUE,
    iswc text,
    work_type text DEFAULT 'original',
    language_code text DEFAULT 'EN',
    
    -- Registration metadata
    registration_type text DEFAULT 'new' CHECK (registration_type IN ('new', 'amendment', 're_registration')),
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'error', 'pending')),
    submission_date timestamp with time zone,
    
    -- Work details
    creation_date date,
    duration_seconds integer,
    work_classification text,
    opus_number text,
    catalogue_number text,
    
    -- Rights and territories
    collection_territories text[] DEFAULT '{}',
    rights_types text[] DEFAULT '{}',
    
    -- Export formats
    supports_ddex boolean DEFAULT true,
    supports_cwr boolean DEFAULT true,
    
    -- Validation status
    validation_status jsonb DEFAULT '{}',
    validation_errors jsonb DEFAULT '[]',
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    notes text
);

-- Create writers table
CREATE TABLE public.copyright_writers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    copyright_id uuid NOT NULL REFERENCES public.copyrights(id) ON DELETE CASCADE,
    
    -- Writer identification
    writer_name text NOT NULL,
    ipi_number text,
    cae_number text,
    isni text,
    
    -- Writer details
    writer_role text DEFAULT 'composer' CHECK (writer_role IN ('composer', 'author', 'lyricist', 'arranger', 'adapter', 'translator')),
    pro_affiliation text,
    nationality text,
    
    -- Ownership
    ownership_percentage numeric(5,2) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    mechanical_share numeric(5,2) DEFAULT 0,
    performance_share numeric(5,2) DEFAULT 0,
    synchronization_share numeric(5,2) DEFAULT 0,
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create publishers table
CREATE TABLE public.copyright_publishers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    copyright_id uuid NOT NULL REFERENCES public.copyrights(id) ON DELETE CASCADE,
    
    -- Publisher identification
    publisher_name text NOT NULL,
    ipi_number text,
    cae_number text,
    isni text,
    
    -- Publisher details
    publisher_role text DEFAULT 'original_publisher' CHECK (publisher_role IN ('original_publisher', 'sub_publisher', 'administrator', 'collecting_society')),
    pro_affiliation text,
    territory text,
    
    -- Ownership
    ownership_percentage numeric(5,2) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
    mechanical_share numeric(5,2) DEFAULT 0,
    performance_share numeric(5,2) DEFAULT 0,
    synchronization_share numeric(5,2) DEFAULT 0,
    
    -- Agreement details
    agreement_type text,
    agreement_start_date date,
    agreement_end_date date,
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create recordings table for ISRC linkages
CREATE TABLE public.copyright_recordings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    copyright_id uuid NOT NULL REFERENCES public.copyrights(id) ON DELETE CASCADE,
    
    -- Recording identification
    isrc text,
    recording_title text,
    artist_name text,
    label_name text,
    
    -- Recording details
    duration_seconds integer,
    release_date date,
    recording_version text,
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create export logs table
CREATE TABLE public.copyright_exports (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    copyright_id uuid REFERENCES public.copyrights(id) ON DELETE SET NULL,
    
    -- Export details
    export_format text NOT NULL CHECK (export_format IN ('ddex_xml', 'cwr_flat', 'csv', 'xlsx')),
    export_type text DEFAULT 'single' CHECK (export_type IN ('single', 'bulk')),
    file_url text,
    
    -- Export metadata
    export_status text DEFAULT 'processing' CHECK (export_status IN ('processing', 'completed', 'failed')),
    record_count integer DEFAULT 1,
    error_message text,
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copyrights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_writers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for copyrights
CREATE POLICY "Users can view their own copyrights" 
ON public.copyrights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own copyrights" 
ON public.copyrights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own copyrights" 
ON public.copyrights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own copyrights" 
ON public.copyrights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for writers
CREATE POLICY "Users can manage writers for their copyrights" 
ON public.copyright_writers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.copyrights 
    WHERE id = copyright_writers.copyright_id 
    AND user_id = auth.uid()
));

-- Create RLS policies for publishers
CREATE POLICY "Users can manage publishers for their copyrights" 
ON public.copyright_publishers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.copyrights 
    WHERE id = copyright_publishers.copyright_id 
    AND user_id = auth.uid()
));

-- Create RLS policies for recordings
CREATE POLICY "Users can manage recordings for their copyrights" 
ON public.copyright_recordings 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.copyrights 
    WHERE id = copyright_recordings.copyright_id 
    AND user_id = auth.uid()
));

-- Create RLS policies for exports
CREATE POLICY "Users can view their own exports" 
ON public.copyright_exports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports" 
ON public.copyright_exports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger for copyrights
CREATE TRIGGER update_copyrights_updated_at
    BEFORE UPDATE ON public.copyrights
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate internal IDs
CREATE OR REPLACE FUNCTION public.generate_copyright_internal_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_id text;
    counter integer := 1;
BEGIN
    LOOP
        new_id := 'CR' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 6, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.copyrights WHERE internal_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

-- Create trigger to auto-generate internal IDs
CREATE OR REPLACE FUNCTION public.set_copyright_internal_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.internal_id IS NULL THEN
        NEW.internal_id := public.generate_copyright_internal_id();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_copyright_internal_id_trigger
    BEFORE INSERT ON public.copyrights
    FOR EACH ROW
    EXECUTE FUNCTION public.set_copyright_internal_id();

-- Create validation function for ownership percentages
CREATE OR REPLACE FUNCTION public.validate_copyright_ownership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    total_writers_share numeric(5,2);
    total_publishers_share numeric(5,2);
BEGIN
    -- Calculate total writer ownership
    SELECT COALESCE(SUM(ownership_percentage), 0)
    INTO total_writers_share
    FROM public.copyright_writers
    WHERE copyright_id = COALESCE(NEW.copyright_id, OLD.copyright_id);
    
    -- Calculate total publisher ownership
    SELECT COALESCE(SUM(ownership_percentage), 0)
    INTO total_publishers_share
    FROM public.copyright_publishers
    WHERE copyright_id = COALESCE(NEW.copyright_id, OLD.copyright_id);
    
    -- Update validation status on the copyright record
    UPDATE public.copyrights
    SET validation_status = jsonb_build_object(
        'writers_total', total_writers_share,
        'publishers_total', total_publishers_share,
        'writers_valid', total_writers_share <= 100,
        'publishers_valid', total_publishers_share <= 100,
        'last_validated', now()
    )
    WHERE id = COALESCE(NEW.copyright_id, OLD.copyright_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER validate_writers_ownership
    AFTER INSERT OR UPDATE OR DELETE ON public.copyright_writers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_copyright_ownership();

CREATE TRIGGER validate_publishers_ownership
    AFTER INSERT OR UPDATE OR DELETE ON public.copyright_publishers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_copyright_ownership();

-- Create indexes for performance
CREATE INDEX idx_copyrights_user_id ON public.copyrights(user_id);
CREATE INDEX idx_copyrights_internal_id ON public.copyrights(internal_id);
CREATE INDEX idx_copyrights_iswc ON public.copyrights(iswc);
CREATE INDEX idx_copyrights_status ON public.copyrights(status);
CREATE INDEX idx_copyright_writers_copyright_id ON public.copyright_writers(copyright_id);
CREATE INDEX idx_copyright_publishers_copyright_id ON public.copyright_publishers(copyright_id);
CREATE INDEX idx_copyright_recordings_copyright_id ON public.copyright_recordings(copyright_id);
CREATE INDEX idx_copyright_recordings_isrc ON public.copyright_recordings(isrc);
CREATE INDEX idx_copyright_exports_user_id ON public.copyright_exports(user_id);