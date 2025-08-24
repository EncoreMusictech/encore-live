-- Phase 3: Real-time Monitoring, Advanced Automation & Business Intelligence

-- Real-time monitoring events table
CREATE TABLE IF NOT EXISTS public.realtime_monitoring_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_source TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    assigned_to UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Advanced automation workflows table
CREATE TABLE IF NOT EXISTS public.automation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    workflow_type TEXT NOT NULL,
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    action_sequence JSONB NOT NULL DEFAULT '[]',
    execution_settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_execution_at TIMESTAMP WITH TIME ZONE,
    last_execution_status TEXT,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Business intelligence reports table
CREATE TABLE IF NOT EXISTS public.business_intelligence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    report_config JSONB NOT NULL DEFAULT '{}',
    report_data JSONB NOT NULL DEFAULT '{}',
    generated_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    schedule_config JSONB,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance monitoring metrics table
CREATE TABLE IF NOT EXISTS public.performance_monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_category TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT NOT NULL DEFAULT 'count',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_name TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    alert_message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    trigger_data JSONB DEFAULT '{}',
    assigned_to UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Integration management table
CREATE TABLE IF NOT EXISTS public.integration_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT NOT NULL,
    integration_type TEXT NOT NULL,
    connection_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'syncing')),
    configuration JSONB NOT NULL DEFAULT '{}',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency_hours INTEGER DEFAULT 24,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.realtime_monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_management ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operations team access
CREATE POLICY "Operations team can manage monitoring events" ON public.realtime_monitoring_events
FOR ALL USING (is_operations_team_member(auth.uid()));

CREATE POLICY "Operations team can manage automation workflows" ON public.automation_workflows
FOR ALL USING (is_operations_team_member(auth.uid()));

CREATE POLICY "Operations team can manage BI reports" ON public.business_intelligence_reports
FOR ALL USING (is_operations_team_member(auth.uid()) OR (is_public = true AND auth.uid() IS NOT NULL));

CREATE POLICY "Operations team can manage performance metrics" ON public.performance_monitoring_metrics
FOR ALL USING (is_operations_team_member(auth.uid()));

CREATE POLICY "Operations team can manage system alerts" ON public.system_alerts
FOR ALL USING (is_operations_team_member(auth.uid()));

CREATE POLICY "Operations team can manage integrations" ON public.integration_management
FOR ALL USING (is_operations_team_member(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_monitoring_events_created_at ON public.realtime_monitoring_events(created_at DESC);
CREATE INDEX idx_monitoring_events_severity ON public.realtime_monitoring_events(severity);
CREATE INDEX idx_monitoring_events_status ON public.realtime_monitoring_events(status);

CREATE INDEX idx_automation_workflows_active ON public.automation_workflows(is_active);
CREATE INDEX idx_automation_workflows_type ON public.automation_workflows(workflow_type);

CREATE INDEX idx_bi_reports_type ON public.business_intelligence_reports(report_type);
CREATE INDEX idx_bi_reports_public ON public.business_intelligence_reports(is_public);

CREATE INDEX idx_performance_metrics_timestamp ON public.performance_monitoring_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_category ON public.performance_monitoring_metrics(metric_category);

CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX idx_system_alerts_status ON public.system_alerts(status);

CREATE INDEX idx_integrations_status ON public.integration_management(connection_status);
CREATE INDEX idx_integrations_active ON public.integration_management(is_active);

-- Triggers for updated_at
CREATE TRIGGER update_realtime_monitoring_events_updated_at
    BEFORE UPDATE ON public.realtime_monitoring_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_operations_updated_at();

CREATE TRIGGER update_automation_workflows_updated_at
    BEFORE UPDATE ON public.automation_workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_operations_updated_at();

CREATE TRIGGER update_business_intelligence_reports_updated_at
    BEFORE UPDATE ON public.business_intelligence_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_operations_updated_at();

CREATE TRIGGER update_system_alerts_updated_at
    BEFORE UPDATE ON public.system_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_operations_updated_at();

CREATE TRIGGER update_integration_management_updated_at
    BEFORE UPDATE ON public.integration_management
    FOR EACH ROW
    EXECUTE FUNCTION public.update_operations_updated_at();