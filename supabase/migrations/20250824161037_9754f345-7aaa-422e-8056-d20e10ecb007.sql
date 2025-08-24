-- Phase 1: Enhance Operations Foundation
-- Add department-based access controls and team performance tracking

-- Expand operations_team_members with department structure
ALTER TABLE public.operations_team_members 
ADD COLUMN IF NOT EXISTS performance_score NUMERIC DEFAULT 75.0 CHECK (performance_score >= 0 AND performance_score <= 100),
ADD COLUMN IF NOT EXISTS active_tickets_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolved_tickets_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_resolution_time_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS department_level INTEGER DEFAULT 1 CHECK (department_level >= 1 AND department_level <= 5),
ADD COLUMN IF NOT EXISTS is_team_lead BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_performance_review DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave'));

-- Create workflow automation rules table
CREATE TABLE IF NOT EXISTS public.workflow_automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('customer_health_change', 'ticket_created', 'revenue_event', 'time_based', 'manual')),
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    actions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100 CHECK (priority >= 1 AND priority <= 999),
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer touchpoints table
CREATE TABLE IF NOT EXISTS public.customer_touchpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_user_id UUID NOT NULL,
    touchpoint_type TEXT NOT NULL CHECK (touchpoint_type IN ('email', 'call', 'meeting', 'support_ticket', 'notification', 'survey', 'onboarding', 'training')),
    interaction_direction TEXT NOT NULL CHECK (interaction_direction IN ('inbound', 'outbound', 'automated')),
    subject TEXT NOT NULL,
    content TEXT,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'phone', 'chat', 'video', 'in_app', 'sms', 'web')),
    handled_by_user_id UUID,
    outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative', 'no_response')),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('team_member', 'department', 'system', 'customer_success')),
    entity_id UUID NOT NULL, -- team member id, department id, or system identifier
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT DEFAULT 'count',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    calculation_method TEXT DEFAULT 'sum' CHECK (calculation_method IN ('sum', 'avg', 'min', 'max', 'count')),
    benchmark_value NUMERIC,
    variance_percentage NUMERIC,
    trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for new tables
ALTER TABLE public.workflow_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies using the operations team member function
CREATE POLICY "Operations team can manage workflow rules"
ON public.workflow_automation_rules
FOR ALL
USING (public.is_operations_team_member(auth.uid()));

CREATE POLICY "Operations team can manage customer touchpoints"
ON public.customer_touchpoints
FOR ALL
USING (public.is_operations_team_member(auth.uid()));

CREATE POLICY "Operations team can view performance metrics"
ON public.performance_metrics
FOR SELECT
USING (public.is_operations_team_member(auth.uid()));

CREATE POLICY "Operations team can manage performance metrics"
ON public.performance_metrics
FOR ALL
USING (public.is_operations_team_member(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_rules_trigger_type ON public.workflow_automation_rules(trigger_type, is_active);
CREATE INDEX IF NOT EXISTS idx_customer_touchpoints_customer ON public.customer_touchpoints(customer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_touchpoints_type ON public.customer_touchpoints(touchpoint_type, outcome);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_entity ON public.performance_metrics(entity_id, metric_type, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON public.performance_metrics(metric_name, period_end DESC);

-- Update functions for timestamps
CREATE OR REPLACE FUNCTION public.update_workflow_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_touchpoints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_performance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_workflow_automation_rules_updated_at
    BEFORE UPDATE ON public.workflow_automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_rules_updated_at();

CREATE TRIGGER update_customer_touchpoints_updated_at
    BEFORE UPDATE ON public.customer_touchpoints
    FOR EACH ROW
    EXECUTE FUNCTION public.update_touchpoints_updated_at();

CREATE TRIGGER update_performance_metrics_updated_at
    BEFORE UPDATE ON public.performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_performance_metrics_updated_at();