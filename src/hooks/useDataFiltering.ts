import { useState, useEffect, useMemo } from 'react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { supabase } from '@/integrations/supabase/client';

interface DataFilteringConfig {
  companyId: string | null;
  companyUserIds: string[];
  isFilterActive: boolean;
}

/**
 * Hook to manage data filtering based on sub-account view mode
 * Returns filtering configuration for use in Supabase queries
 */
export function useDataFiltering() {
  const { isViewingAsSubAccount, viewContext } = useViewMode();
  const [filterConfig, setFilterConfig] = useState<DataFilteringConfig>({
    companyId: null,
    companyUserIds: [],
    isFilterActive: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFilterConfig = async () => {
      if (!isViewingAsSubAccount || !viewContext?.companyId) {
        setFilterConfig({
          companyId: null,
          companyUserIds: [],
          isFilterActive: false,
        });
        return;
      }

      setLoading(true);
      try {
        // Get all user IDs associated with this company
        const { data: companyUsers, error } = await supabase
          .from('company_users')
          .select('user_id')
          .eq('company_id', viewContext.companyId)
          .eq('status', 'active');

        if (error) throw error;

        const userIds = companyUsers?.map(cu => cu.user_id) || [];

        setFilterConfig({
          companyId: viewContext.companyId,
          companyUserIds: userIds,
          isFilterActive: true,
        });
      } catch (error) {
        console.error('Error loading filter config:', error);
        setFilterConfig({
          companyId: null,
          companyUserIds: [],
          isFilterActive: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadFilterConfig();
  }, [isViewingAsSubAccount, viewContext?.companyId]);

  // Create a stable filter key that changes when filter state changes
  // This can be used as a dependency in other hooks to trigger refetch
  const filterKey = useMemo(() => {
    if (!filterConfig.isFilterActive) {
      return 'no-filter';
    }
    return `filter-${filterConfig.companyId}-${filterConfig.companyUserIds.join(',')}`;
  }, [filterConfig.isFilterActive, filterConfig.companyId, filterConfig.companyUserIds]);

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
    if (!filterConfig.isFilterActive || !filterConfig.companyId) {
      return query;
    }
    return query.eq('company_id', filterConfig.companyId);
  };

  /**
   * Check if a user ID belongs to the filtered company
   */
  const isUserInScope = (userId: string): boolean => {
    if (!filterConfig.isFilterActive) return true;
    return filterConfig.companyUserIds.includes(userId);
  };

  /**
   * Get filter summary for display
   */
  const getFilterSummary = () => {
    if (!filterConfig.isFilterActive) {
      return 'Showing all data';
    }
    return `Filtered to ${viewContext?.companyName} (${filterConfig.companyUserIds.length} user${filterConfig.companyUserIds.length !== 1 ? 's' : ''})`;
  };

  return {
    filterConfig,
    loading,
    isFilterActive: filterConfig.isFilterActive,
    filterKey, // Use this as a dependency to trigger refetch when filter changes
    applyUserIdFilter,
    applyCompanyIdFilter,
    isUserInScope,
    getFilterSummary,
    companyId: filterConfig.companyId,
    companyUserIds: filterConfig.companyUserIds,
  };
}
