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

// Map database module IDs to pricing page module IDs and vice versa
const MODULE_ID_ALIASES: Record<string, string[]> = {
  'royalties': ['royalties-processing', 'royalties_processing', 'royalties'],
  'copyright': ['copyright-management', 'copyright_management', 'copyright'],
  'contracts': ['contract-management', 'contract_management', 'contracts'],
  'sync': ['sync-licensing', 'sync_licensing', 'sync'],
  'valuation': ['catalog-valuation', 'catalog_valuation', 'valuation'],
  'dashboard': ['client-portal', 'client_portal', 'dashboard', 'client-dashboard'],
  'catalog': ['catalog-management', 'catalog_management', 'catalog'],
};

// Create a reverse lookup map
const createReverseLookup = (): Record<string, string> => {
  const lookup: Record<string, string> = {};
  for (const [canonical, aliases] of Object.entries(MODULE_ID_ALIASES)) {
    for (const alias of aliases) {
      lookup[alias.toLowerCase()] = canonical;
    }
  }
  return lookup;
};

const REVERSE_LOOKUP = createReverseLookup();

// Normalize a module ID to its canonical form
const normalizeModuleId = (moduleId: string): string => {
  const lowerId = moduleId.toLowerCase();
  return REVERSE_LOOKUP[lowerId] || lowerId;
};

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
          // Normalize module IDs to canonical form
          companyModules = moduleData.map(m => normalizeModuleId(m.module_id));
        }
      }

      // Get modules from active trial
      let trialModules: string[] = [];
      if (hasActiveTrial && trialInfo?.trial_modules) {
        // Normalize trial module IDs as well
        trialModules = trialInfo.trial_modules.map(normalizeModuleId);
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

    // Normalize the requested module ID and check access
    const normalizedId = normalizeModuleId(moduleId);
    return state.accessibleModules.includes(normalizedId);
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
