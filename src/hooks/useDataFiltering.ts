import { useState, useEffect, useMemo } from 'react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { supabase } from '@/integrations/supabase/client';

interface DataFilteringConfig {
  companyId: string | null;
  companyIds: string[];
  companyUserIds: string[];
  isFilterActive: boolean;
}

/**
 * Hook to manage data filtering based on sub-account view mode
 * Returns filtering configuration for use in Supabase queries
 */
export function useDataFiltering() {
  const { isViewingAsSubAccount, viewContext, isEntityFiltered } = useViewMode();
  const [filterConfig, setFilterConfig] = useState<DataFilteringConfig>({
    companyId: null,
    companyIds: [],
    companyUserIds: [],
    isFilterActive: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFilterConfig = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setFilterConfig({
            companyId: null,
            companyIds: [],
            companyUserIds: [],
            isFilterActive: false,
          });
          return;
        }

        // View-as-sub-account: strict single-company scope
        if (isViewingAsSubAccount && viewContext?.companyId) {
          const [{ data: companyUsers, error }, { data: serviceAccountUserId }] = await Promise.all([
            supabase
              .from('company_users')
              .select('user_id')
              .eq('company_id', viewContext.companyId)
              .eq('status', 'active'),
            supabase.rpc('get_company_service_account_user_id', {
              _company_id: viewContext.companyId,
            }),
          ]);

          if (error) throw error;

          const userIds = companyUsers?.map(cu => cu.user_id) || [];
          const scopedUserIds = serviceAccountUserId
            ? Array.from(new Set([...userIds, serviceAccountUserId]))
            : userIds;

          setFilterConfig({
            companyId: viewContext.companyId,
            companyIds: [viewContext.companyId],
            companyUserIds: scopedUserIds,
            isFilterActive: true,
          });
          return;
        }

        // Default mode: scope to caller's active companies only (no global cross-account bleed)
        const { data: memberships, error: membershipError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (membershipError) throw membershipError;

        const companyIds = Array.from(new Set((memberships || []).map(m => m.company_id).filter(Boolean)));

        // Fallback for users with no company membership records
        if (companyIds.length === 0) {
          setFilterConfig({
            companyId: null,
            companyIds: [],
            companyUserIds: [user.id],
            isFilterActive: true,
          });
          return;
        }

        const [{ data: companyUsers, error: companyUsersError }, { data: serviceAccounts, error: serviceAccountsError }] = await Promise.all([
          supabase
            .from('company_users')
            .select('user_id')
            .in('company_id', companyIds)
            .eq('status', 'active'),
          supabase
            .from('company_service_accounts')
            .select('service_user_id')
            .in('company_id', companyIds),
        ]);

        if (companyUsersError) throw companyUsersError;
        if (serviceAccountsError) throw serviceAccountsError;

        const userIds = companyUsers?.map(cu => cu.user_id) || [];
        const serviceUserIds = serviceAccounts?.map(sa => sa.service_user_id) || [];
        const scopedUserIds = Array.from(new Set([...userIds, ...serviceUserIds, user.id]));

        setFilterConfig({
          companyId: companyIds[0] ?? null,
          companyIds,
          companyUserIds: scopedUserIds,
          isFilterActive: true,
        });
      } catch (error) {
        console.error('Error loading filter config:', error);
        setFilterConfig({
          companyId: null,
          companyIds: [],
          companyUserIds: [],
          isFilterActive: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadFilterConfig();
  }, [isViewingAsSubAccount, viewContext?.companyId]);

  const publishingEntityId = viewContext?.publishingEntityId || null;
  const publishingEntityName = viewContext?.publishingEntityName || null;

  // Create a stable filter key that changes when filter state changes
  // This can be used as a dependency in other hooks to trigger refetch
  const filterKey = useMemo(() => {
    const parts: string[] = [];
    if (filterConfig.isFilterActive) {
      parts.push(`filter-${filterConfig.companyIds.join(',')}-${filterConfig.companyUserIds.join(',')}`);
    } else {
      parts.push('no-filter');
    }
    if (publishingEntityId) {
      parts.push(`entity-${publishingEntityId}`);
    }
    return parts.join('|');
  }, [filterConfig.isFilterActive, filterConfig.companyIds, filterConfig.companyUserIds, publishingEntityId]);

  /**
   * Apply filters to a Supabase query builder for tables with user_id
   */
  const applyUserIdFilter = <T>(query: any): any => {
    if (!filterConfig.isFilterActive || filterConfig.companyUserIds.length === 0) {
      return query;
    }
    return query.in('user_id', filterConfig.companyUserIds);
  };

  /**
   * Apply filters to a Supabase query builder for tables with company_id
   */
  const applyCompanyIdFilter = <T>(query: any): any => {
    if (!filterConfig.isFilterActive || filterConfig.companyIds.length === 0) {
      return query;
    }
    return filterConfig.companyIds.length === 1
      ? query.eq('company_id', filterConfig.companyIds[0])
      : query.in('company_id', filterConfig.companyIds);
  };

  /**
   * Apply publishing entity filter to a Supabase query builder for tables with publishing_entity_id
   */
  const applyEntityFilter = <T>(query: any): any => {
    if (!publishingEntityId) {
      return query;
    }
    return query.eq('publishing_entity_id', publishingEntityId);
  };

  /**
   * Apply filters to a Supabase query builder for tables with client_company_id
   */
  const applyClientCompanyIdFilter = <T>(query: any): any => {
    if (!filterConfig.isFilterActive || filterConfig.companyIds.length === 0) {
      return query;
    }
    return filterConfig.companyIds.length === 1
      ? query.eq('client_company_id', filterConfig.companyIds[0])
      : query.in('client_company_id', filterConfig.companyIds);
  };

  /**
   * Check if a user ID belongs to the filtered company scope
   */
  const isUserInScope = (userId: string): boolean => {
    if (!filterConfig.isFilterActive) return true;
    return filterConfig.companyUserIds.includes(userId);
  };

  /**
   * Check if a company ID is in scope
   */
  const isCompanyInScope = (companyId: string | null): boolean => {
    if (!filterConfig.isFilterActive) return true;
    if (!companyId) return true;
    return filterConfig.companyIds.includes(companyId);
  };

  /**
   * Get filter summary for display
   */
  const getFilterSummary = () => {
    const parts: string[] = [];
    if (filterConfig.isFilterActive) {
      const label = viewContext?.companyName || `Scoped buckets: ${filterConfig.companyIds.length || 1}`;
      parts.push(`${label} (${filterConfig.companyUserIds.length} user${filterConfig.companyUserIds.length !== 1 ? 's' : ''})`);
    }
    if (publishingEntityName) {
      parts.push(`Entity: ${publishingEntityName}`);
    }
    if (parts.length === 0) return 'Showing all data';
    return `Filtered to ${parts.join(' · ')}`;
  };

  return {
    filterConfig,
    loading,
    isFilterActive: filterConfig.isFilterActive,
    isEntityFiltered: !!publishingEntityId,
    filterKey, // Use this as a dependency to trigger refetch when filter changes
    applyUserIdFilter,
    applyCompanyIdFilter,
    applyEntityFilter,
    applyClientCompanyIdFilter,
    isUserInScope,
    isCompanyInScope,
    getFilterSummary,
    companyId: filterConfig.companyId,
    companyIds: filterConfig.companyIds,
    companyUserIds: filterConfig.companyUserIds,
    publishingEntityId,
    publishingEntityName,
  };
}
