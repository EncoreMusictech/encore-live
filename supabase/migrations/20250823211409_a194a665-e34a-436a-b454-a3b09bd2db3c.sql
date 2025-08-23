-- Create FTP credentials table for PRO endpoints
CREATE TABLE public.pro_ftp_credentials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    pro_name TEXT NOT NULL,
    pro_code TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 21,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    base_path TEXT DEFAULT '/',
    connection_type TEXT NOT NULL DEFAULT 'ftp' CHECK (connection_type IN ('ftp', 'sftp')),
    is_active BOOLEAN DEFAULT true,
    last_connection_test TIMESTAMP WITH TIME ZONE,
    connection_status TEXT DEFAULT 'untested',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pro_ftp_credentials
ALTER TABLE public.pro_ftp_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for pro_ftp_credentials
CREATE POLICY "Users can manage their own FTP credentials"
ON public.pro_ftp_credentials
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create delivery jobs table for tracking export transmissions
CREATE TABLE public.export_delivery_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    export_id UUID NOT NULL,
    ftp_credential_id UUID NOT NULL REFERENCES public.pro_ftp_credentials(id),
    file_path TEXT NOT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'in_progress', 'completed', 'failed', 'retrying')),
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    delivery_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on export_delivery_jobs
ALTER TABLE public.export_delivery_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for export_delivery_jobs
CREATE POLICY "Users can manage their own delivery jobs"
ON public.export_delivery_jobs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create ACK processing logs table
CREATE TABLE public.ack_processing_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    ack_file_name TEXT NOT NULL,
    ack_file_content TEXT,
    parsed_data JSONB DEFAULT '{}',
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'skipped')),
    works_updated INTEGER DEFAULT 0,
    errors_found INTEGER DEFAULT 0,
    processing_errors JSONB DEFAULT '[]',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ack_processing_logs
ALTER TABLE public.ack_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for ack_processing_logs
CREATE POLICY "Users can view their own ACK processing logs"
ON public.ack_processing_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enhance copyright_exports table with versioning and metadata
ALTER TABLE public.copyright_exports 
ADD COLUMN IF NOT EXISTS export_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS file_storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS export_notes TEXT,
ADD COLUMN IF NOT EXISTS export_tags TEXT[],
ADD COLUMN IF NOT EXISTS batch_name TEXT,
ADD COLUMN IF NOT EXISTS validation_score NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS readiness_issues JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS delivery_job_id UUID REFERENCES public.export_delivery_jobs(id),
ADD COLUMN IF NOT EXISTS parent_export_id UUID REFERENCES public.copyright_exports(id);

-- Create export validation results table
CREATE TABLE public.export_validation_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    copyright_ids UUID[] NOT NULL,
    validation_type TEXT NOT NULL CHECK (validation_type IN ('cwr', 'ddex')),
    overall_score NUMERIC(5,2) DEFAULT 0,
    validation_results JSONB NOT NULL DEFAULT '{}',
    blocking_issues JSONB DEFAULT '[]',
    warning_issues JSONB DEFAULT '[]',
    can_export BOOLEAN DEFAULT false,
    validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on export_validation_results
ALTER TABLE public.export_validation_results ENABLE ROW LEVEL SECURITY;

-- Create policy for export_validation_results
CREATE POLICY "Users can manage their own validation results"
ON public.export_validation_results
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_pro_ftp_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_pro_ftp_credentials_updated_at
    BEFORE UPDATE ON public.pro_ftp_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pro_ftp_credentials_updated_at();

CREATE OR REPLACE FUNCTION public.update_export_delivery_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_export_delivery_jobs_updated_at
    BEFORE UPDATE ON public.export_delivery_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_export_delivery_jobs_updated_at();

CREATE OR REPLACE FUNCTION public.update_ack_processing_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_ack_processing_logs_updated_at
    BEFORE UPDATE ON public.ack_processing_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ack_processing_logs_updated_at();

-- Create indexes for performance
CREATE INDEX idx_pro_ftp_credentials_user_id ON public.pro_ftp_credentials(user_id);
CREATE INDEX idx_pro_ftp_credentials_pro_code ON public.pro_ftp_credentials(pro_code);
CREATE INDEX idx_export_delivery_jobs_user_id ON public.export_delivery_jobs(user_id);
CREATE INDEX idx_export_delivery_jobs_export_id ON public.export_delivery_jobs(export_id);
CREATE INDEX idx_export_delivery_jobs_status ON public.export_delivery_jobs(delivery_status);
CREATE INDEX idx_ack_processing_logs_user_id ON public.ack_processing_logs(user_id);
CREATE INDEX idx_ack_processing_logs_status ON public.ack_processing_logs(processing_status);
CREATE INDEX idx_export_validation_results_user_id ON public.export_validation_results(user_id);

-- Create storage bucket for export files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cwr-exports', 'cwr-exports', false, 52428800, ARRAY['text/plain', 'application/xml', 'text/xml'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for export files
CREATE POLICY "Users can upload their own export files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'cwr-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own export files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'cwr-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own export files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'cwr-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own export files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'cwr-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
);