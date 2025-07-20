-- Create the relational hierarchy structure for payouts
-- Agreement (AGR#) → Original Publisher (OP#) → Writer (Writer ID) → Payee(s)

-- 1. Create original_publishers table
CREATE TABLE public.original_publishers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    op_id TEXT NOT NULL UNIQUE, -- OP# identifier
    publisher_name TEXT NOT NULL,
    contact_info JSONB DEFAULT '{}',
    agreement_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create writers table (linked to original publishers)
CREATE TABLE public.writers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    writer_id TEXT NOT NULL UNIQUE, -- Writer ID identifier
    writer_name TEXT NOT NULL,
    contact_info JSONB DEFAULT '{}',
    original_publisher_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create payees table (linked to writers)
CREATE TABLE public.payees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    payee_name TEXT NOT NULL,
    payee_type TEXT NOT NULL, -- 'attorney', 'admin', 'heir', 'writer', etc.
    contact_info JSONB DEFAULT '{}',
    payment_info JSONB DEFAULT '{}',
    writer_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT false, -- indicates if this is the primary payee for the writer
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Add foreign key constraints
ALTER TABLE public.original_publishers 
ADD CONSTRAINT fk_original_publishers_agreement 
FOREIGN KEY (agreement_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.writers 
ADD CONSTRAINT fk_writers_original_publisher 
FOREIGN KEY (original_publisher_id) REFERENCES public.original_publishers(id) ON DELETE CASCADE;

ALTER TABLE public.payees 
ADD CONSTRAINT fk_payees_writer 
FOREIGN KEY (writer_id) REFERENCES public.writers(id) ON DELETE CASCADE;

-- 5. Create indexes for better performance
CREATE INDEX idx_original_publishers_agreement ON public.original_publishers(agreement_id);
CREATE INDEX idx_original_publishers_user ON public.original_publishers(user_id);
CREATE INDEX idx_writers_original_publisher ON public.writers(original_publisher_id);
CREATE INDEX idx_writers_user ON public.writers(user_id);
CREATE INDEX idx_payees_writer ON public.payees(writer_id);
CREATE INDEX idx_payees_user ON public.payees(user_id);

-- 6. Enable Row Level Security
ALTER TABLE public.original_publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- Original Publishers policies
CREATE POLICY "Users can manage their own original publishers" 
ON public.original_publishers 
FOR ALL 
USING (auth.uid() = user_id);

-- Writers policies
CREATE POLICY "Users can manage their own writers" 
ON public.writers 
FOR ALL 
USING (auth.uid() = user_id);

-- Payees policies
CREATE POLICY "Users can manage their own payees" 
ON public.payees 
FOR ALL 
USING (auth.uid() = user_id);

-- 8. Create functions to generate IDs
CREATE OR REPLACE FUNCTION public.generate_op_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'OP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM public.original_publishers WHERE op_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_writer_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'WR-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::text, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM public.writers WHERE writer_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

-- 9. Create triggers to auto-generate IDs
CREATE OR REPLACE FUNCTION public.set_op_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.op_id IS NULL OR NEW.op_id = '' THEN
        NEW.op_id := public.generate_op_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_writer_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.writer_id IS NULL OR NEW.writer_id = '' THEN
        NEW.writer_id := public.generate_writer_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_op_id
    BEFORE INSERT ON public.original_publishers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_op_id();

CREATE TRIGGER trigger_set_writer_id
    BEFORE INSERT ON public.writers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_writer_id();

-- 10. Create triggers for updated_at
CREATE TRIGGER update_original_publishers_updated_at
    BEFORE UPDATE ON public.original_publishers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_writers_updated_at
    BEFORE UPDATE ON public.writers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payees_updated_at
    BEFORE UPDATE ON public.payees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();