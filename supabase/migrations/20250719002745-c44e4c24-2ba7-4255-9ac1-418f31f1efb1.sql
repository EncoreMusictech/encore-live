
-- Add new fields to sync_licenses table for comprehensive license agreement data
ALTER TABLE public.sync_licenses ADD COLUMN IF NOT EXISTS 
  -- Additional licensing terms
  exclusive_license BOOLEAN DEFAULT FALSE,
  promotional_usage BOOLEAN DEFAULT FALSE,
  festival_usage BOOLEAN DEFAULT FALSE,
  trailer_usage BOOLEAN DEFAULT FALSE,
  advertising_usage BOOLEAN DEFAULT FALSE,
  
  -- Usage specifications  
  usage_duration_seconds INTEGER,
  usage_description TEXT,
  context_description TEXT,
  
  -- Production details
  production_company TEXT,
  production_budget NUMERIC(12,2),
  distribution_channels TEXT[],
  expected_audience_size BIGINT,
  
  -- Rights holder information
  master_owner TEXT,
  master_owner_contact TEXT,
  publishing_administrator TEXT,
  publishing_admin_contact TEXT,
  
  -- Advanced financial terms
  backend_royalty_rate NUMERIC(5,2),
  performance_bonus NUMERIC(12,2),
  sales_threshold_bonus NUMERIC(12,2),
  sales_threshold_amount BIGINT,
  
  -- Legal and compliance
  union_restrictions TEXT,
  content_rating TEXT,
  territory_restrictions TEXT[],
  embargo_territories TEXT[],
  
  -- Delivery requirements
  delivery_format TEXT,
  technical_specs JSONB DEFAULT '{}',
  delivery_deadline DATE,
  
  -- Additional metadata
  internal_project_code TEXT,
  priority_level TEXT DEFAULT 'normal',
  client_contact_info JSONB DEFAULT '{}',
  
  -- Approval workflow
  legal_review_status TEXT DEFAULT 'pending',
  legal_reviewer TEXT,
  legal_review_date DATE,
  approval_expiry_date DATE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sync_licenses_legal_review_status ON public.sync_licenses(legal_review_status);
CREATE INDEX IF NOT EXISTS idx_sync_licenses_priority_level ON public.sync_licenses(priority_level);
CREATE INDEX IF NOT EXISTS idx_sync_licenses_delivery_deadline ON public.sync_licenses(delivery_deadline);

-- Add check constraints for validation
ALTER TABLE public.sync_licenses ADD CONSTRAINT check_priority_level 
CHECK (priority_level IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE public.sync_licenses ADD CONSTRAINT check_legal_review_status 
CHECK (legal_review_status IN ('pending', 'in_review', 'approved', 'rejected', 'requires_changes'));

ALTER TABLE public.sync_licenses ADD CONSTRAINT check_content_rating 
CHECK (content_rating IS NULL OR content_rating IN ('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'));

-- Create a table for license agreement templates
CREATE TABLE IF NOT EXISTS public.sync_license_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'standard',
  template_content JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on templates table
ALTER TABLE public.sync_license_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for templates
CREATE POLICY "Users can view their own sync license templates" 
ON public.sync_license_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync license templates" 
ON public.sync_license_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync license templates" 
ON public.sync_license_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync license templates" 
ON public.sync_license_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_sync_license_templates_updated_at
  BEFORE UPDATE ON public.sync_license_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
