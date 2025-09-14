-- Add support@encoremusic.tech as super admin role
DO $$ 
BEGIN
    -- Create app_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'moderator', 'user');
    ELSE
        -- Add super_admin to existing enum if not present
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
    END IF;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role function for security definer access
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create RLS policies for user_roles
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Super admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Sub Accounts Upload Jobs Table
CREATE TABLE public.sub_accounts_upload_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name varchar(255) NOT NULL,
    file_name varchar(255) NOT NULL,
    file_type varchar(10) NOT NULL CHECK (file_type IN ('csv', 'pdf')),
    file_size integer NOT NULL,
    file_path text NOT NULL,
    status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    total_records integer DEFAULT 0,
    processed_records integer DEFAULT 0,
    successful_records integer DEFAULT 0,
    failed_records integer DEFAULT 0,
    error_log jsonb,
    processing_stats jsonb,
    created_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Sub Accounts Staging Table
CREATE TABLE public.sub_accounts_staging (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_job_id uuid REFERENCES public.sub_accounts_upload_jobs(id) ON DELETE CASCADE,
    row_number integer NOT NULL,
    raw_data jsonb NOT NULL,
    mapped_data jsonb,
    validation_status varchar(50) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'warning')),
    validation_errors jsonb,
    processed boolean DEFAULT FALSE,
    target_subscriber_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Sub Accounts Field Mappings Table
CREATE TABLE public.sub_accounts_field_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mapping_name varchar(255) NOT NULL,
    file_type varchar(10) NOT NULL CHECK (file_type IN ('csv', 'pdf')),
    field_mappings jsonb NOT NULL,
    default_values jsonb,
    transformation_rules jsonb,
    validation_rules jsonb,
    is_active boolean DEFAULT TRUE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.sub_accounts_upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_accounts_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_accounts_field_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sub account tables
CREATE POLICY "Super admins can manage upload jobs"
ON public.sub_accounts_upload_jobs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can manage staging data"
ON public.sub_accounts_staging
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can manage field mappings"
ON public.sub_accounts_field_mappings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_sub_accounts_upload_jobs_status ON public.sub_accounts_upload_jobs(status);
CREATE INDEX idx_sub_accounts_upload_jobs_created_by ON public.sub_accounts_upload_jobs(created_by);
CREATE INDEX idx_sub_accounts_staging_upload_job_id ON public.sub_accounts_staging(upload_job_id);
CREATE INDEX idx_sub_accounts_staging_validation_status ON public.sub_accounts_staging(validation_status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_sub_accounts_upload_jobs_updated_at
    BEFORE UPDATE ON public.sub_accounts_upload_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sub_accounts_field_mappings_updated_at
    BEFORE UPDATE ON public.sub_accounts_field_mappings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default field mapping templates
INSERT INTO public.sub_accounts_field_mappings (mapping_name, file_type, field_mappings, default_values, validation_rules) VALUES
('Default CSV Mapping', 'csv', 
 '{"company_name": 0, "contact_email": 1, "contact_name": 2, "phone": 3, "subscription_tier": 4, "modules_access": 5, "billing_address": 6, "payment_method": 7}',
 '{"subscription_tier": "basic", "modules_access": ["catalog-valuation"], "payment_method": "stripe"}',
 '{"company_name": {"required": true, "min_length": 2}, "contact_email": {"required": true, "format": "email"}, "contact_name": {"required": true, "min_length": 2}}'
),
('Default PDF Mapping', 'pdf',
 '{"company_name": "Company:\\\\s*(.+)", "contact_email": "Email:\\\\s*([\\\\w\\\\.-]+@[\\\\w\\\\.-]+\\\\.[\\\\w]+)", "contact_name": "Contact:\\\\s*(.+)", "phone": "Phone:\\\\s*([\\\\+]?[\\\\d\\\\s\\\\-\\\\(\\\\)]+)", "subscription_tier": "Subscription:\\\\s*(.+)"}',
 '{"subscription_tier": "basic", "modules_access": ["catalog-valuation"], "payment_method": "stripe"}',
 '{"company_name": {"required": true, "min_length": 2}, "contact_email": {"required": true, "format": "email"}, "contact_name": {"required": true, "min_length": 2}}'
);

-- Add super admin role for support email (will be handled by edge function)
COMMENT ON TABLE public.user_roles IS 'User roles table with super_admin role for platform administration';