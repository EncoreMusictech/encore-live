-- Create CWR Registration Status Tracking Tables

-- Table to track work submissions to PROs
CREATE TABLE public.cwr_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    copyright_id UUID REFERENCES public.copyrights(id) ON DELETE CASCADE,
    sender_code TEXT NOT NULL,
    pro_name TEXT NOT NULL,
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cwr_file_name TEXT,
    cwr_file_url TEXT,
    work_title TEXT NOT NULL,
    iswc TEXT,
    submission_status TEXT NOT NULL DEFAULT 'pending',
    submitted_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to store parsed ACK responses from PROs
CREATE TABLE public.cwr_acknowledgments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    submission_id UUID REFERENCES public.cwr_submissions(id) ON DELETE CASCADE,
    ack_file_name TEXT,
    ack_file_url TEXT,
    response_code TEXT, -- RA, AC, RJ, DU, NP, etc.
    response_message TEXT,
    registration_status TEXT NOT NULL DEFAULT 'pending', -- not_registered, pending, registered, needs_amending, in_dispute
    parsed_data JSONB DEFAULT '{}'::jsonb,
    linked_records JSONB DEFAULT '{}'::jsonb, -- SWR, PWR, NWR references
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to track registration status history over time
CREATE TABLE public.registration_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    submission_id UUID REFERENCES public.cwr_submissions(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    status_reason TEXT,
    changed_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_cwr_submissions_user_id ON public.cwr_submissions(user_id);
CREATE INDEX idx_cwr_submissions_copyright_id ON public.cwr_submissions(copyright_id);
CREATE INDEX idx_cwr_submissions_pro_name ON public.cwr_submissions(pro_name);
CREATE INDEX idx_cwr_submissions_submission_date ON public.cwr_submissions(submission_date);
CREATE INDEX idx_cwr_submissions_status ON public.cwr_submissions(submission_status);

CREATE INDEX idx_cwr_acknowledgments_user_id ON public.cwr_acknowledgments(user_id);
CREATE INDEX idx_cwr_acknowledgments_submission_id ON public.cwr_acknowledgments(submission_id);
CREATE INDEX idx_cwr_acknowledgments_registration_status ON public.cwr_acknowledgments(registration_status);

CREATE INDEX idx_registration_status_history_user_id ON public.registration_status_history(user_id);
CREATE INDEX idx_registration_status_history_submission_id ON public.registration_status_history(submission_id);

-- Add RLS policies
ALTER TABLE public.cwr_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cwr_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_status_history ENABLE ROW LEVEL SECURITY;

-- Users can manage their own submissions
CREATE POLICY "Users can manage their own CWR submissions" ON public.cwr_submissions
    FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own acknowledgments  
CREATE POLICY "Users can manage their own CWR acknowledgments" ON public.cwr_acknowledgments
    FOR ALL USING (auth.uid() = user_id);

-- Users can view their own status history
CREATE POLICY "Users can view their own registration status history" ON public.registration_status_history
    FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert status history
CREATE POLICY "System can insert registration status history" ON public.registration_status_history
    FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_cwr_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cwr_submissions_updated_at
    BEFORE UPDATE ON public.cwr_submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_cwr_submissions_updated_at();

CREATE OR REPLACE FUNCTION public.update_cwr_acknowledgments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cwr_acknowledgments_updated_at 
    BEFORE UPDATE ON public.cwr_acknowledgments
    FOR EACH ROW EXECUTE FUNCTION public.update_cwr_acknowledgments_updated_at();

-- Create function to automatically track status changes
CREATE OR REPLACE FUNCTION public.track_registration_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if registration status actually changed
    IF (OLD.registration_status IS DISTINCT FROM NEW.registration_status) THEN
        INSERT INTO public.registration_status_history (
            user_id,
            submission_id, 
            previous_status,
            new_status,
            status_reason,
            changed_by,
            metadata
        ) VALUES (
            NEW.user_id,
            NEW.submission_id,
            OLD.registration_status,
            NEW.registration_status,
            'ACK response processed',
            auth.uid(),
            jsonb_build_object(
                'response_code', NEW.response_code,
                'response_message', NEW.response_message,
                'ack_file_name', NEW.ack_file_name
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_registration_status_change
    AFTER UPDATE ON public.cwr_acknowledgments
    FOR EACH ROW EXECUTE FUNCTION public.track_registration_status_change();