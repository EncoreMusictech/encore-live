-- Create companies table for sub-accounts
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  address JSONB DEFAULT '{}',
  contact_email TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'active',
  subscription_end TIMESTAMP WITH TIME ZONE,
  module_access JSONB DEFAULT '[]',
  billing_info JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create company_users table to link users to companies with roles
CREATE TABLE public.company_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create company_module_access table for module permissions at company level
CREATE TABLE public.company_module_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  access_source TEXT NOT NULL DEFAULT 'subscription',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, module_id)
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_module_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Companies are viewable by their members" 
ON public.companies FOR SELECT 
USING (
  id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Company owners and admins can update company info" 
ON public.companies FOR UPDATE 
USING (
  id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin') 
    AND status = 'active'
  )
);

CREATE POLICY "Authenticated users can create companies" 
ON public.companies FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- RLS Policies for company_users
CREATE POLICY "Company users are viewable by company members" 
ON public.company_users FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM public.company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
);

CREATE POLICY "Company owners and admins can manage users" 
ON public.company_users FOR ALL 
USING (
  company_id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin') 
    AND status = 'active'
  )
);

CREATE POLICY "Users can view their own company memberships" 
ON public.company_users FOR SELECT 
USING (user_id = auth.uid());

-- RLS Policies for company_module_access
CREATE POLICY "Company module access viewable by company members" 
ON public.company_module_access FOR SELECT 
USING (
  company_id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Company owners and admins can manage module access" 
ON public.company_module_access FOR ALL 
USING (
  company_id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin') 
    AND status = 'active'
  )
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_companies_updated_at();

CREATE OR REPLACE FUNCTION public.update_company_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_users_updated_at
    BEFORE UPDATE ON public.company_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_company_users_updated_at();

-- Function to get user's company role
CREATE OR REPLACE FUNCTION public.get_user_company_role(company_id_param UUID, user_id_param UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.company_users 
  WHERE company_id = company_id_param 
  AND user_id = user_id_param 
  AND status = 'active';
$$;

-- Function to check if user has company module access
CREATE OR REPLACE FUNCTION public.has_company_module_access(company_id_param UUID, module_id_param TEXT, user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_module_access cma
    JOIN public.company_users cu ON cu.company_id = cma.company_id
    WHERE cma.company_id = company_id_param
    AND cma.module_id = module_id_param
    AND cu.user_id = user_id_param
    AND cu.status = 'active'
    AND (cma.expires_at IS NULL OR cma.expires_at > now())
  );
$$;