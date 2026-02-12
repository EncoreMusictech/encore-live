import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ONBOARDING_PHASES, getPhaseIndex, getNextPhaseId } from '@/constants/onboardingPhases';
import { useToast } from '@/hooks/use-toast';

interface OnboardingProgress {
  id: string;
  company_id: string;
  current_phase: string;
  phase_progress: number;
  week_number: number;
  start_date: string;
  target_go_live: string;
  risk_level: string;
  assigned_csm: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChecklistEntry {
  id: string;
  company_id: string;
  phase_id: string;
  item_id: string;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
}

export function useOnboardingProgress(companyId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const progressQuery = useQuery({
    queryKey: ['onboarding-progress', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('client_onboarding_progress')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data as OnboardingProgress | null;
    },
    enabled: !!companyId,
  });

  const checklistQuery = useQuery({
    queryKey: ['onboarding-checklist', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('client_onboarding_checklist')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return (data || []) as ChecklistEntry[];
    },
    enabled: !!companyId,
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase
        .from('client_onboarding_progress')
        .insert({
          company_id: companyId,
          current_phase: 'account_setup',
          phase_progress: 0,
          week_number: 1,
          risk_level: 'low',
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress', companyId] });
    },
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ phaseId, itemId, completed }: { phaseId: string; itemId: string; completed: boolean }) => {
      if (!companyId) throw new Error('No company ID');
      const { data: { user } } = await supabase.auth.getUser();

      if (completed) {
        const { error } = await supabase
          .from('client_onboarding_checklist')
          .upsert({
            company_id: companyId,
            phase_id: phaseId,
            item_id: itemId,
            completed: true,
            completed_by: user?.id || null,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'company_id,phase_id,item_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_onboarding_checklist')
          .delete()
          .eq('company_id', companyId)
          .eq('phase_id', phaseId)
          .eq('item_id', itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-checklist', companyId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress', companyId] });
    },
  });

  const advancePhase = useMutation({
    mutationFn: async () => {
      if (!companyId || !progressQuery.data) throw new Error('No data');
      const nextPhase = getNextPhaseId(progressQuery.data.current_phase);
      if (!nextPhase) {
        // Final phase — mark completed
        const { error } = await supabase
          .from('client_onboarding_progress')
          .update({ status: 'completed', phase_progress: 100 })
          .eq('company_id', companyId);
        if (error) throw error;
        return;
      }
      const currentIdx = getPhaseIndex(progressQuery.data.current_phase);
      const newWeek = Math.max(1, currentIdx + 2);
      const { error } = await supabase
        .from('client_onboarding_progress')
        .update({
          current_phase: nextPhase,
          phase_progress: 0,
          week_number: newWeek,
        })
        .eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress', companyId] });
      toast({ title: 'Phase advanced successfully' });
    },
  });

  const updateRiskLevel = useMutation({
    mutationFn: async (riskLevel: string) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('client_onboarding_progress')
        .update({ risk_level: riskLevel })
        .eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress', companyId] });
    },
  });

  const updateCSM = useMutation({
    mutationFn: async (csm: string) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('client_onboarding_progress')
        .update({ assigned_csm: csm })
        .eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress', companyId] });
    },
  });

  // Computed helpers
  const completedItemIds = new Set(
    (checklistQuery.data || []).filter(c => c.completed).map(c => `${c.phase_id}:${c.item_id}`)
  );

  const isItemCompleted = (phaseId: string, itemId: string) =>
    completedItemIds.has(`${phaseId}:${itemId}`);

  const getPhaseCompletion = (phaseId: string) => {
    const phase = ONBOARDING_PHASES.find(p => p.id === phaseId);
    if (!phase) return 0;
    const completed = phase.checklist.filter(item => isItemCompleted(phaseId, item.id)).length;
    return Math.round((completed / phase.checklist.length) * 100);
  };

  const getPhaseRequiredComplete = (phaseId: string) => {
    const phase = ONBOARDING_PHASES.find(p => p.id === phaseId);
    if (!phase) return true;
    return phase.checklist
      .filter(item => item.required)
      .every(item => isItemCompleted(phaseId, item.id));
  };

  const getOverallProgress = () => {
    if (!progressQuery.data) return 0;
    const currentIdx = getPhaseIndex(progressQuery.data.current_phase);
    const phaseCompletion = getPhaseCompletion(progressQuery.data.current_phase);
    return Math.round(((currentIdx + phaseCompletion / 100) / ONBOARDING_PHASES.length) * 100);
  };

  return {
    progress: progressQuery.data,
    checklist: checklistQuery.data || [],
    isLoading: progressQuery.isLoading || checklistQuery.isLoading,
    isInitialized: !!progressQuery.data,
    initialize: initializeMutation.mutateAsync,
    toggleChecklistItem: toggleChecklistItem.mutate,
    advancePhase: advancePhase.mutate,
    updateRiskLevel: updateRiskLevel.mutate,
    updateCSM: updateCSM.mutate,
    isItemCompleted,
    getPhaseCompletion,
    getPhaseRequiredComplete,
    getOverallProgress,
  };
}

// Hook for fetching all onboarding progress (for pipeline view)
export function useAllOnboardingProgress() {
  return useQuery({
    queryKey: ['all-onboarding-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_onboarding_progress')
        .select('*, companies(name, display_name, contact_email, subscription_tier, subscription_status)');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllOnboardingChecklists(companyIds: string[]) {
  return useQuery({
    queryKey: ['all-onboarding-checklists', companyIds],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('client_onboarding_checklist')
        .select('*')
        .in('company_id', companyIds);
      if (error) throw error;
      return data || [];
    },
    enabled: companyIds.length > 0,
  });
}
