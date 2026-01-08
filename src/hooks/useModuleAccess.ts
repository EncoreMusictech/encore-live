import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useFreeTrial } from '@/hooks/useFreeTrial';

interface ModuleAccessState {
  accessibleModules: string[];
  loading: boolean;
  companyId: string | null;
  companyName: string | null;
}

export const useModuleAccess = () => {
  const { user } = useAuth();
  const { subscribed, subscription_tier } = useSubscription();
  const { hasActiveTrial, trialInfo } = useFreeTrial();
  const [state, setState] = useState<ModuleAccessState>({
    accessibleModules: [],
    loading: true,
    companyId: null,
    companyName: null,
  });

  const checkModuleAccess = useCallback(async () => {
    if (!user) {
      setState({
        accessibleModules: [],
        loading: false,
        companyId: null,
        companyName: null,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      // Get user's company and module access
      const { data: companyUserData, error: companyError } = await supabase
        .from('company_users')
        .select(`
          company_id,
          companies (
            id,
            name,
            display_name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (companyError) {
        console.error('Error fetching company:', companyError);
      }

      const companyId = companyUserData?.company_id || null;
      const companyName = (companyUserData?.companies as any)?.display_name || null;

      // Get modules accessible through company
      let companyModules: string[] = [];
      if (companyId) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('company_module_access')
          .select('module_id')
          .eq('company_id', companyId)
          .eq('enabled', true);

        if (!moduleError && moduleData) {
          companyModules = moduleData.map(m => m.module_id);
        }
      }

      // Get modules from active trial
      let trialModules: string[] = [];
      if (hasActiveTrial && trialInfo?.trial_modules) {
        trialModules = trialInfo.trial_modules;
      }

      // Combine all accessible modules (deduplicated)
      const allModules = [...new Set([...companyModules, ...trialModules])];

      setState({
        accessibleModules: allModules,
        loading: false,
        companyId,
        companyName,
      });
    } catch (error) {
      console.error('Error checking module access:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, hasActiveTrial, trialInfo]);

  useEffect(() => {
    checkModuleAccess();
  }, [checkModuleAccess]);

  const hasModuleAccess = useCallback((moduleId: string): boolean => {
    // Subscribed users may have access based on tier
    if (subscribed) {
      // Enterprise/Agency tiers have access to all modules
      if (subscription_tier?.toLowerCase().includes('enterprise') || 
          subscription_tier?.toLowerCase().includes('agency')) {
        return true;
      }
    }

    // Check company-based access
    return state.accessibleModules.includes(moduleId);
  }, [subscribed, subscription_tier, state.accessibleModules]);

  const hasAnyModuleAccess = useCallback((): boolean => {
    return state.accessibleModules.length > 0 || subscribed;
  }, [state.accessibleModules, subscribed]);

  return {
    ...state,
    hasModuleAccess,
    hasAnyModuleAccess,
    refreshAccess: checkModuleAccess,
  };
};
