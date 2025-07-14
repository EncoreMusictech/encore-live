-- Create subscription tiers table for the new pricing structure
CREATE TABLE public.subscription_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price NUMERIC NOT NULL,
  annual_price NUMERIC,
  tier_level INTEGER NOT NULL, -- 1=Starter, 2=Creator, 3=Producer, 4=Label, 5=Enterprise, 6=Agency
  included_modules TEXT[] NOT NULL DEFAULT '{}',
  max_valuations_per_month INTEGER,
  max_deal_simulations_per_month INTEGER,
  max_contracts_per_month INTEGER,
  api_access_enabled BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  custom_branding BOOLEAN NOT NULL DEFAULT false,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create add-ons table
CREATE TABLE public.subscription_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price NUMERIC NOT NULL,
  addon_type TEXT NOT NULL, -- 'usage_increase', 'feature_unlock', 'support_upgrade'
  target_limit_field TEXT, -- which field this addon increases (e.g., 'max_valuations_per_month')
  limit_increase INTEGER, -- how much to increase the limit by
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE public.user_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL, -- format: 'YYYY-MM'
  valuations_used INTEGER NOT NULL DEFAULT 0,
  deal_simulations_used INTEGER NOT NULL DEFAULT 0,
  contracts_created INTEGER NOT NULL DEFAULT 0,
  api_calls_made INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Create user addon subscriptions table
CREATE TABLE public.user_addon_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  addon_id UUID REFERENCES public.subscription_addons(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addon_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers (public read)
CREATE POLICY "Anyone can view active subscription tiers" 
ON public.subscription_tiers 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for subscription_addons (public read)
CREATE POLICY "Anyone can view active addons" 
ON public.subscription_addons 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for user_usage_tracking
CREATE POLICY "Users can view their own usage" 
ON public.user_usage_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
ON public.user_usage_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
ON public.user_usage_tracking 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for user_addon_subscriptions
CREATE POLICY "Users can view their own addon subscriptions" 
ON public.user_addon_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addon subscriptions" 
ON public.user_addon_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addon subscriptions" 
ON public.user_addon_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert the new subscription tiers
INSERT INTO public.subscription_tiers (name, slug, description, monthly_price, annual_price, tier_level, included_modules, max_valuations_per_month, max_deal_simulations_per_month, max_contracts_per_month, features, is_popular) VALUES
('Starter', 'starter', 'Perfect for individual artists and songwriters getting started', 0, 0, 1, '{"catalog-valuation"}', 3, 1, 2, '["Basic catalog valuation", "1 deal simulation", "2 contract templates", "Email support"]', false),
('Creator', 'creator', 'For active creators managing their rights and deals', 29, 290, 2, '{"catalog-valuation", "deal-simulator", "contract-management"}', 10, 5, 10, '["Everything in Starter", "Advanced deal simulator", "Contract management", "10 valuations/month", "5 deal simulations/month", "Priority email support"]', true),
('Producer', 'producer', 'For producers and beatmakers scaling their business', 79, 790, 3, '{"catalog-valuation", "deal-simulator", "contract-management", "copyright-management"}', 25, 15, 25, '["Everything in Creator", "Copyright management", "25 valuations/month", "15 deal simulations/month", "Advanced contract templates", "Phone support"]', false),
('Label', 'label', 'For independent labels managing multiple artists', 199, 1990, 4, '{"catalog-valuation", "deal-simulator", "contract-management", "copyright-management"}', 100, 50, 100, '["Everything in Producer", "100 valuations/month", "50 deal simulations/month", "Multi-artist dashboard", "Bulk operations", "Custom reporting"]', false),
('Enterprise', 'enterprise', 'For large organizations with custom needs', 499, 4990, 5, '{"catalog-valuation", "deal-simulator", "contract-management", "copyright-management"}', NULL, NULL, NULL, '["Everything in Label", "Unlimited usage", "API access", "Custom integrations", "Dedicated account manager", "SLA guarantee", "White-label options"]', false),
('Agency', 'agency', 'For agencies managing multiple client catalogs', 299, 2990, 6, '{"catalog-valuation", "deal-simulator", "contract-management", "copyright-management"}', 200, 100, 200, '["Everything in Producer", "200 valuations/month", "100 deal simulations/month", "Client management tools", "Multi-catalog dashboard", "Agency reporting"]', false);

-- Insert add-ons
INSERT INTO public.subscription_addons (name, slug, description, monthly_price, addon_type, target_limit_field, limit_increase, features) VALUES
('Extra Valuations (10)', 'extra-valuations-10', 'Add 10 additional catalog valuations per month', 15, 'usage_increase', 'max_valuations_per_month', 10, '["10 additional valuations per month"]'),
('Extra Valuations (25)', 'extra-valuations-25', 'Add 25 additional catalog valuations per month', 30, 'usage_increase', 'max_valuations_per_month', 25, '["25 additional valuations per month"]'),
('Extra Deal Simulations (5)', 'extra-deal-sims-5', 'Add 5 additional deal simulations per month', 20, 'usage_increase', 'max_deal_simulations_per_month', 5, '["5 additional deal simulations per month"]'),
('Extra Deal Simulations (15)', 'extra-deal-sims-15', 'Add 15 additional deal simulations per month', 50, 'usage_increase', 'max_deal_simulations_per_month', 15, '["15 additional deal simulations per month"]'),
('Priority Support', 'priority-support', 'Get priority support with faster response times', 25, 'support_upgrade', NULL, NULL, '["Priority email support", "Phone support", "Faster response times"]'),
('API Access', 'api-access', 'Access to ENCORE API for custom integrations', 99, 'feature_unlock', NULL, NULL, '["REST API access", "Webhook support", "API documentation", "Rate limiting: 1000 calls/hour"]');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_tiers_updated_at
BEFORE UPDATE ON public.subscription_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_subscription_addons_updated_at
BEFORE UPDATE ON public.subscription_addons
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_user_usage_tracking_updated_at
BEFORE UPDATE ON public.user_usage_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_user_addon_subscriptions_updated_at
BEFORE UPDATE ON public.user_addon_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_updated_at_column();