import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchActiveCompanyMemberships, pickPrimaryCompany } from '@/lib/companyMembership';

interface UserCompany {
  id: string;
  name: string;
  display_name: string;
  company_type: string | null;
  parent_company_id: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
}

interface UseUserCompanyReturn {
  userCompany: UserCompany | null;
  loading: boolean;
  error: string | null;
  isPublishingFirm: boolean;
  isClientLabel: boolean;
  isEnterpriseTier: boolean;
  canManageClients: boolean;
  hasCompany: boolean;
  refetch: () => void;
}

export function useUserCompany(): UseUserCompanyReturn {
  const { user } = useAuth();
  const [userCompany, setUserCompany] = useState<UserCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCompany = useCallback(async () => {
    if (!user) {
      setUserCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // A user can belong to multiple active companies; pick a sensible primary.
      const memberships = await fetchActiveCompanyMemberships(user.id);
      const company = pickPrimaryCompany(memberships) as unknown as UserCompany | null;

      if (!company) {
        setUserCompany(null);
        return;
      }

      setUserCompany({
        id: company.id,
        name: company.name,
        display_name: company.display_name,
        company_type: company.company_type,
        parent_company_id: company.parent_company_id,
        subscription_tier: company.subscription_tier,
        subscription_status: company.subscription_status,
      });
    } catch (err) {
      console.error('Error fetching user company:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user company');
      setUserCompany(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserCompany();
  }, [fetchUserCompany]);

  const isPublishingFirm = userCompany?.company_type === 'publishing_firm';
  const isClientLabel = userCompany?.company_type === 'client_label';
  const isEnterpriseTier = userCompany?.subscription_tier === 'enterprise' || 
                           userCompany?.subscription_tier === 'enterprise_internal';
  const canManageClients = isPublishingFirm && isEnterpriseTier;
  const hasCompany = !!userCompany;

  return {
    userCompany,
    loading,
    error,
    isPublishingFirm,
    isClientLabel,
    isEnterpriseTier,
    canManageClients,
    hasCompany,
    refetch: fetchUserCompany
  };
}
