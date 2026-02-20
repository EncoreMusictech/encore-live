import { useViewMode } from '@/contexts/ViewModeContext';

/**
 * Safe wrapper around useViewMode that returns defaults when used outside ViewModeProvider.
 * Use this in hooks that may be rendered outside the provider tree.
 */
export function useViewModeOptional() {
  try {
    return useViewMode();
  } catch {
    return {
      isViewingAsSubAccount: false,
      isViewingAsClient: false,
      isAggregateView: false,
      isEntityFiltered: false,
      viewContext: null,
      exitViewMode: () => {},
      refreshViewContext: () => {},
      setViewScope: (() => {}) as (scope: 'all' | 'single', companyId?: string) => void,
      switchToClientView: (() => {}) as (clientCompanyId: string, clientCompanyName: string) => void,
      setPublishingEntity: (() => {}) as (entityId: string | null, entityName?: string) => void,
    };
  }
}
