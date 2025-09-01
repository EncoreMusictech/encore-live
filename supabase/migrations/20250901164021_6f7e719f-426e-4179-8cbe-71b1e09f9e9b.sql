-- Create enum for tenant status
CREATE TYPE tenant_status AS ENUM ('active', 'inactive', 'suspended');

-- Create tenant_configurations table for whitelabel branding
CREATE TABLE public.tenant_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_slug TEXT NOT NULL UNIQUE,
    tenant_name TEXT NOT NULL,
    
    -- Brand Configuration
    brand_config JSONB NOT NULL DEFAULT '{
        "logo_url": null,
        "favicon_url": null,
        "brand_colors": {
            "primary": "254 100% 76%",
            "secondary": "0 0% 15%",
            "accent": "39 35% 64%",
            "background": "0 0% 0%",
            "foreground": "0 0% 90%"
        },
        "fonts": {
            "heading": "Space Grotesk",
            "body": "Inter"
        }
    }'::JSONB,
    
    -- Domain Configuration
    custom_domain TEXT,
    subdomain TEXT,
    ssl_enabled BOOLEAN DEFAULT true,
    
    -- Feature Configuration
    enabled_modules JSONB NOT NULL DEFAULT '[]'::JSONB,
    feature_flags JSONB NOT NULL DEFAULT '{}'::JSONB,
    
    -- Contact Information
    company_info JSONB NOT NULL DEFAULT '{
        "company_name": "",
        "contact_email": "",
        "support_email": "",
        "website": "",
        "address": {}
    }'::JSONB,
    
    -- Status and Metadata
    status tenant_status NOT NULL DEFAULT 'active',
    subscription_tier TEXT DEFAULT 'enterprise',
    max_users INTEGER DEFAULT 100,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tenant_configurations
ALTER TABLE public.tenant_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own tenant configurations"
ON public.tenant_configurations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_tenant_configurations_user_id ON public.tenant_configurations(user_id);
CREATE INDEX idx_tenant_configurations_tenant_slug ON public.tenant_configurations(tenant_slug);
CREATE INDEX idx_tenant_configurations_custom_domain ON public.tenant_configurations(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenant_configurations_subdomain ON public.tenant_configurations(subdomain) WHERE subdomain IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_tenant_configurations_updated_at
    BEFORE UPDATE ON public.tenant_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tenant_configurations_updated_at();

-- Create table for tenant user assignments (for multi-user enterprise accounts)
CREATE TABLE public.tenant_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenant_configurations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', 'viewer'
    permissions JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, user_id)
);

-- Enable RLS on tenant_users
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant_users
CREATE POLICY "Users can view tenant assignments they belong to"
ON public.tenant_users
FOR SELECT
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.tenant_configurations tc 
        WHERE tc.id = tenant_users.tenant_id AND tc.user_id = auth.uid()
    )
);

CREATE POLICY "Tenant owners can manage user assignments"
ON public.tenant_users
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tenant_configurations tc 
        WHERE tc.id = tenant_users.tenant_id AND tc.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenant_configurations tc 
        WHERE tc.id = tenant_users.tenant_id AND tc.user_id = auth.uid()
    )
);

-- Create indexes
CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON public.tenant_users(user_id);

-- Create function to get tenant by domain
CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(domain_name TEXT)
RETURNS public.tenant_configurations
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM public.tenant_configurations 
    WHERE (custom_domain = domain_name OR subdomain = domain_name) 
    AND status = 'active';
$$;