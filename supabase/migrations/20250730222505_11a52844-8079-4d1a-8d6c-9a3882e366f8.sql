-- Create enum for PRO types
CREATE TYPE public.pro_type AS ENUM ('ASCAP', 'BMI', 'ICE', 'SOCAN', 'PRS', 'OTHER');

-- Create enum for sender code status
CREATE TYPE public.sender_code_status AS ENUM ('not_submitted', 'submitted', 'verified');

-- Create table for CWR sender codes
CREATE TABLE public.cwr_sender_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    sender_code TEXT NOT NULL,
    encrypted_sender_code TEXT NOT NULL, -- Encrypted version for storage
    company_name TEXT NOT NULL,
    ipi_cae_number TEXT,
    contact_email TEXT NOT NULL,
    target_pros pro_type[] NOT NULL DEFAULT '{}',
    status sender_code_status NOT NULL DEFAULT 'not_submitted',
    supporting_document_url TEXT,
    status_updated_at TIMESTAMP WITH TIME ZONE,
    status_updated_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT sender_code_length CHECK (char_length(sender_code) <= 9),
    CONSTRAINT sender_code_format CHECK (sender_code ~ '^[A-Z0-9]+$'),
    CONSTRAINT unique_sender_code_per_user UNIQUE (user_id, sender_code)
);

-- Enable RLS
ALTER TABLE public.cwr_sender_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own sender codes"
ON public.cwr_sender_codes
FOR ALL
USING (auth.uid() = user_id);

-- Create policy for copyright management module access
CREATE POLICY "Copyright module subscribers can view sender codes"
ON public.cwr_sender_codes
FOR SELECT
USING (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.user_module_access uma
        WHERE uma.user_id = auth.uid()
        AND uma.module_id = 'copyright-management'
        AND (uma.expires_at IS NULL OR uma.expires_at > now())
    )
);

-- Create table for sender code request history
CREATE TABLE public.cwr_sender_code_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_code_id UUID NOT NULL REFERENCES public.cwr_sender_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    pro_type pro_type NOT NULL,
    request_content TEXT NOT NULL,
    request_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    response_received_at TIMESTAMP WITH TIME ZONE,
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on requests table
ALTER TABLE public.cwr_sender_code_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for requests
CREATE POLICY "Users can manage their own sender code requests"
ON public.cwr_sender_code_requests
FOR ALL
USING (auth.uid() = user_id);

-- Create function to encrypt sender codes
CREATE OR REPLACE FUNCTION public.encrypt_sender_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple encryption placeholder - in production would use proper encryption
    NEW.encrypted_sender_code := encode(NEW.sender_code::bytea, 'base64');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for encryption
CREATE TRIGGER encrypt_sender_code_trigger
    BEFORE INSERT OR UPDATE ON public.cwr_sender_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.encrypt_sender_code();

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_sender_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_sender_code_updated_at_trigger
    BEFORE UPDATE ON public.cwr_sender_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sender_code_updated_at();

-- Create function to check for duplicate sender codes
CREATE OR REPLACE FUNCTION public.check_duplicate_sender_code(p_sender_code TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.cwr_sender_codes
        WHERE sender_code = upper(p_sender_code)
        AND (p_user_id IS NULL OR user_id != p_user_id)
    );
END;
$$;