-- Create modular pricing system tables

-- Create module_products table to define individual module pricing
CREATE TABLE public.module_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bundle_products table for bundle packages
CREATE TABLE public.bundle_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2),
  included_modules TEXT[] NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_subscriptions table to track what users have purchased
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('module', 'bundle')),
  product_id UUID NOT NULL, -- References either module_products.id or bundle_products.id
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused', 'expired')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_module_access table for tracking individual module access
CREATE TABLE public.user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  access_source TEXT NOT NULL CHECK (access_source IN ('module_subscription', 'bundle_subscription', 'free_tier')),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, module_id)
);

-- Enable RLS on all tables
ALTER TABLE public.module_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for module_products (public read access)
CREATE POLICY "Anyone can view active module products" ON public.module_products
FOR SELECT USING (is_active = true);

-- RLS Policies for bundle_products (public read access)
CREATE POLICY "Anyone can view active bundle products" ON public.bundle_products
FOR SELECT USING (is_active = true);

-- RLS Policies for user_subscriptions (users can only see their own)
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_module_access (users can only see their own)
CREATE POLICY "Users can view their own module access" ON public.user_module_access
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage module access" ON public.user_module_access
FOR ALL USING (true);

-- Create function to automatically grant module access when subscriptions are created
CREATE OR REPLACE FUNCTION public.grant_module_access_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_type = 'module' THEN
    -- Grant access to the specific module
    INSERT INTO public.user_module_access (user_id, module_id, access_source, subscription_id, expires_at)
    SELECT NEW.user_id, mp.module_id, 'module_subscription', NEW.id, NEW.expires_at
    FROM public.module_products mp
    WHERE mp.id = NEW.product_id
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      access_source = EXCLUDED.access_source,
      subscription_id = EXCLUDED.subscription_id,
      expires_at = EXCLUDED.expires_at;
      
  ELSIF NEW.subscription_type = 'bundle' THEN
    -- Grant access to all modules in the bundle
    INSERT INTO public.user_module_access (user_id, module_id, access_source, subscription_id, expires_at)
    SELECT NEW.user_id, unnest(bp.included_modules), 'bundle_subscription', NEW.id, NEW.expires_at
    FROM public.bundle_products bp
    WHERE bp.id = NEW.product_id
    ON CONFLICT (user_id, module_id) DO UPDATE SET
      access_source = EXCLUDED.access_source,
      subscription_id = EXCLUDED.subscription_id,
      expires_at = EXCLUDED.expires_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically grant module access
CREATE TRIGGER grant_module_access_trigger
  AFTER INSERT ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.grant_module_access_on_subscription();

-- Add updated_at trigger for all tables
CREATE TRIGGER update_module_products_updated_at
  BEFORE UPDATE ON public.module_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bundle_products_updated_at
  BEFORE UPDATE ON public.bundle_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial module products based on existing modules
INSERT INTO public.module_products (module_id, name, description, monthly_price, annual_price, features) VALUES
('catalog-valuation', 'Catalog Valuation', 'AI-powered catalog assessment with 3-5 year forecasting and fair market value analysis', 29.00, 290.00, '["Revenue history analysis", "Growth modeling (CAGR)", "Scenario-based estimates", "Downloadable investor reports", "Comp-based valuation range"]'::jsonb),
('contract-management', 'Contract Management', 'Centralized contract storage with smart tagging, alerts, and template library', 0.00, 0.00, '["Upload & organize contracts", "Auto-tag by deal type", "Renewal deadline alerts", "Template library access", "Smart field extraction"]'::jsonb),
('copyright-management', 'Copyright Management', 'Register and track copyrights with split assignments and metadata management', 0.00, 0.00, '["ISRC/ISWC/IPI tracking", "Writer/publisher splits", "PRO registration status", "Duplicate warnings", "Metadata form builder"]'::jsonb),
('sync-licensing', 'Sync Licensing Tracker', 'Comprehensive sync deal pipeline with pitch tracking and deal memo generation', 19.00, 190.00, '["Pitch status tracking", "Media type categorization", "Territory & term management", "Contract attachments", "Auto-generated deal memos"]'::jsonb),
('royalties-processing', 'Royalties Processing', 'Automated royalty statement processing with split calculations and reporting', 49.00, 490.00, '["CSV/PDF statement upload", "Auto-assign to tracks", "Split calculations", "Recoupment tracking", "Contributor statements"]'::jsonb),
('client-portal', 'Client Portal', 'Secure tier-based access for artists, managers, and vendors with custom views', 15.00, 150.00, '["Artist earnings dashboard", "Manager deal oversight", "Vendor collaboration", "Permission-based content", "Custom reporting views"]'::jsonb);

-- Insert bundle products using proper array syntax
INSERT INTO public.bundle_products (name, description, monthly_price, annual_price, included_modules, discount_percentage, is_popular, features) VALUES
('Starter Bundle', 'Perfect for independent artists and small operations', 0.00, 0.00, ARRAY['contract-management', 'copyright-management'], 0.00, false, '["Contract Management", "Copyright Management", "Up to 100 tracks", "Basic reporting", "Email support"]'::jsonb),
('Professional Bundle', 'Ideal for managers, small labels, and growing businesses', 49.00, 490.00, ARRAY['contract-management', 'copyright-management', 'catalog-valuation', 'sync-licensing', 'client-portal'], 25.00, true, '["All Starter features", "Catalog Valuation", "Sync Licensing Tracker", "Client Portal", "Unlimited tracks", "Advanced reporting", "Priority support"]'::jsonb),
('Enterprise Bundle', 'For large publishers, labels, and rights organizations', 99.00, 990.00, ARRAY['contract-management', 'copyright-management', 'catalog-valuation', 'sync-licensing', 'client-portal', 'royalties-processing'], 35.00, false, '["All Professional features", "Royalties Processing", "Custom integrations", "Dedicated account manager", "API access", "White-label options", "SLA guarantee"]'::jsonb);