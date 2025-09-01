import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TenantConfiguration {
  id: string;
  user_id: string;
  tenant_slug: string;
  tenant_name: string;
  brand_config: any;
  custom_domain?: string;
  subdomain?: string;
  ssl_enabled: boolean;
  enabled_modules: any;
  feature_flags: any;
  company_info: any;
  status: 'active' | 'inactive' | 'suspended';
  subscription_tier: string;
  max_users: number;
}

interface TenantContextType {
  tenantConfig: TenantConfiguration | null;
  loading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
  updateTenantConfig: (updates: Partial<TenantConfiguration>) => Promise<void>;
  isWhitelabelMode: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenantConfig, setTenantConfig] = useState<TenantConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in whitelabel mode based on domain or subdomain
  const isWhitelabelMode = window.location.hostname !== 'localhost' && 
                          window.location.hostname !== 'lovable.app' &&
                          !window.location.hostname.includes('lovable');

  const fetchTenantConfig = async () => {
    if (!user) {
      setTenantConfig(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // If in whitelabel mode, try to get config by domain first
      if (isWhitelabelMode) {
        const { data: domainConfig, error: domainError } = await supabase
          .rpc('get_tenant_by_domain', { domain_name: window.location.hostname });

        if (domainConfig && !domainError) {
          setTenantConfig(domainConfig);
          setLoading(false);
          return;
        }
      }

      // Otherwise, get user's tenant config
      const { data, error: fetchError } = await supabase
        .from('tenant_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setTenantConfig(data);
    } catch (err) {
      console.error('Error fetching tenant config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenant configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateTenantConfig = async (updates: Partial<TenantConfiguration>) => {
    if (!user || !tenantConfig) return;

    try {
      const { data, error: updateError } = await supabase
        .from('tenant_configurations')
        .update(updates)
        .eq('id', tenantConfig.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setTenantConfig(data);
    } catch (err) {
      console.error('Error updating tenant config:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTenantConfig();
  }, [user]);

  const value: TenantContextType = {
    tenantConfig,
    loading,
    error,
    refreshTenant: fetchTenantConfig,
    updateTenantConfig,
    isWhitelabelMode,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
