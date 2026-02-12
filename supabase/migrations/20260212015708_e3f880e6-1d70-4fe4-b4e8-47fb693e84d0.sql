
-- Create client_onboarding_progress table
CREATE TABLE public.client_onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL DEFAULT 'account_setup',
  phase_progress INTEGER NOT NULL DEFAULT 0,
  week_number INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_go_live DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 weeks'),
  risk_level TEXT NOT NULL DEFAULT 'low',
  assigned_csm TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_onboarding UNIQUE (company_id)
);

-- Create client_onboarding_checklist table
CREATE TABLE public.client_onboarding_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  CONSTRAINT unique_checklist_item UNIQUE (company_id, phase_id, item_id)
);

-- Enable RLS
ALTER TABLE public.client_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_onboarding_checklist ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_onboarding_progress
CREATE POLICY "Admins can view onboarding progress"
  ON public.client_onboarding_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert onboarding progress"
  ON public.client_onboarding_progress FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update onboarding progress"
  ON public.client_onboarding_progress FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete onboarding progress"
  ON public.client_onboarding_progress FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for client_onboarding_checklist
CREATE POLICY "Admins can view onboarding checklist"
  ON public.client_onboarding_checklist FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert onboarding checklist"
  ON public.client_onboarding_checklist FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update onboarding checklist"
  ON public.client_onboarding_checklist FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete onboarding checklist"
  ON public.client_onboarding_checklist FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_client_onboarding_progress_updated_at
  BEFORE UPDATE ON public.client_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
