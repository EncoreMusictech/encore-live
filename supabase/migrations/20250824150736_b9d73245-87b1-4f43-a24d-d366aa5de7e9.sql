-- Operations Team Management
CREATE TABLE public.operations_team_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    team_member_name text NOT NULL,
    department text NOT NULL,
    role_title text NOT NULL,
    permissions jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    hire_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Customer Health Metrics
CREATE TABLE public.customer_health_metrics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    health_score numeric(3,2) DEFAULT 0.0,
    feature_adoption_rate numeric(3,2) DEFAULT 0.0,
    login_frequency integer DEFAULT 0,
    last_activity_date timestamp with time zone,
    modules_used text[] DEFAULT '{}',
    contracts_created integer DEFAULT 0,
    royalties_processed numeric DEFAULT 0,
    support_tickets_count integer DEFAULT 0,
    subscription_status text,
    days_since_signup integer,
    risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Support Ticket Analytics
CREATE TABLE public.support_ticket_analytics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_team_member_id uuid REFERENCES public.operations_team_members(id),
    ticket_subject text NOT NULL,
    ticket_category text NOT NULL,
    priority_level text DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolution_time_hours numeric,
    first_response_time_hours numeric,
    customer_satisfaction_score integer CHECK (customer_satisfaction_score >= 1 AND customer_satisfaction_score <= 5),
    tags text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);

-- Revenue Events for detailed tracking
CREATE TABLE public.revenue_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('signup', 'upgrade', 'downgrade', 'churn', 'reactivation', 'payment_success', 'payment_failed')),
    revenue_amount numeric DEFAULT 0,
    previous_plan text,
    new_plan text,
    billing_cycle text,
    mrr_change numeric DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operations_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_health_metrics ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.support_ticket_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Operations Team Members
CREATE POLICY "Operations team members can view all" ON public.operations_team_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.operations_team_members otm 
        WHERE otm.user_id = auth.uid() AND otm.is_active = true
    )
);

CREATE POLICY "Operations team members can manage team" ON public.operations_team_members  
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.operations_team_members otm 
        WHERE otm.user_id = auth.uid() AND otm.is_active = true 
        AND otm.permissions->>'manage_team' = 'true'
    )
);

-- RLS Policies for Customer Health Metrics
CREATE POLICY "Operations team can view customer health" ON public.customer_health_metrics
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.operations_team_members otm 
        WHERE otm.user_id = auth.uid() AND otm.is_active = true
    )
);

CREATE POLICY "System can manage customer health" ON public.customer_health_metrics
FOR ALL USING (true);

-- RLS Policies for Support Tickets
CREATE POLICY "Operations team can view support tickets" ON public.support_ticket_analytics
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.operations_team_members otm 
        WHERE otm.user_id = auth.uid() AND otm.is_active = true
    )
);

-- RLS Policies for Revenue Events  
CREATE POLICY "Operations team can view revenue events" ON public.revenue_events
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.operations_team_members otm 
        WHERE otm.user_id = auth.uid() AND otm.is_active = true
    )
);

CREATE POLICY "System can manage revenue events" ON public.revenue_events
FOR ALL USING (true);

-- Update triggers
CREATE OR REPLACE FUNCTION public.update_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_operations_team_members_updated_at
    BEFORE UPDATE ON public.operations_team_members
    FOR EACH ROW EXECUTE FUNCTION public.update_operations_updated_at();

CREATE TRIGGER update_customer_health_metrics_updated_at
    BEFORE UPDATE ON public.customer_health_metrics  
    FOR EACH ROW EXECUTE FUNCTION public.update_operations_updated_at();

CREATE TRIGGER update_support_ticket_analytics_updated_at
    BEFORE UPDATE ON public.support_ticket_analytics
    FOR EACH ROW EXECUTE FUNCTION public.update_operations_updated_at();

-- Indexes for performance
CREATE INDEX idx_customer_health_user_id ON public.customer_health_metrics(customer_user_id);
CREATE INDEX idx_customer_health_score ON public.customer_health_metrics(health_score);
CREATE INDEX idx_customer_health_risk ON public.customer_health_metrics(risk_level);
CREATE INDEX idx_support_tickets_status ON public.support_ticket_analytics(status);
CREATE INDEX idx_support_tickets_customer ON public.support_ticket_analytics(customer_user_id);
CREATE INDEX idx_revenue_events_customer ON public.revenue_events(customer_user_id);
CREATE INDEX idx_revenue_events_type ON public.revenue_events(event_type);
CREATE INDEX idx_revenue_events_date ON public.revenue_events(created_at);