import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ViewContext {
  mode: 'system' | 'subaccount' | 'client';
  companyId?: string;
  companyName?: string;
  companyType?: 'publishing_firm' | 'client_label' | 'standard';
  parentCompanyId?: string;       // For child companies
  parentCompanyName?: string;     // For breadcrumb display
  viewScope: 'all' | 'single';    // Aggregated or single client
  publishingEntityId?: string;    // Selected publishing entity filter
  publishingEntityName?: string;  // Display name for entity filter
  returnPath?: string;
  sessionId?: string;             // For audit logging
}

interface ViewModeContextType {
  viewContext: ViewContext | null;
  isViewingAsSubAccount: boolean;
  isViewingAsClient: boolean;
  isAggregateView: boolean;
  isEntityFiltered: boolean;
  exitViewMode: () => void;
  refreshViewContext: () => void;
  setViewScope: (scope: 'all' | 'single', companyId?: string) => void;
  switchToClientView: (clientCompanyId: string, clientCompanyName: string) => void;
  setPublishingEntity: (entityId: string | null, entityName?: string) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewContext, setViewContext] = useState<ViewContext | null>(null);
  const navigate = useNavigate();

  const loadViewContext = () => {
    const stored = sessionStorage.getItem('viewContext');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure viewScope has a default value
        if (!parsed.viewScope) {
          parsed.viewScope = 'single';
        }
        setViewContext(parsed);
      } catch (error) {
        console.error('Failed to parse view context:', error);
        sessionStorage.removeItem('viewContext');
        setViewContext(null);
      }
    } else {
      setViewContext(null);
    }
  };

  useEffect(() => {
    loadViewContext();

    // Listen for storage changes (in case it's updated from another component)
    const handleStorageChange = () => {
      loadViewContext();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    window.addEventListener('viewContextChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('viewContextChanged', handleStorageChange);
    };
  }, []);

  const saveViewContext = (context: ViewContext | null) => {
    if (context) {
      sessionStorage.setItem('viewContext', JSON.stringify(context));
    } else {
      sessionStorage.removeItem('viewContext');
    }
    setViewContext(context);
    window.dispatchEvent(new Event('viewContextChanged'));
  };

  const exitViewMode = async () => {
    const returnPath = viewContext?.returnPath || '/dashboard/operations';
    const sessionId = viewContext?.sessionId;
    
    // Log view mode exit for audit trail
    if (sessionId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('close_admin_view_mode_session' as any, {
            p_session_id: sessionId,
            p_ip_address: null,
            p_user_agent: navigator.userAgent
          });
        }
      } catch (error) {
        console.error('Failed to log view mode exit:', error);
      }
    }
    
    saveViewContext(null);
    navigate(returnPath);
  };

  const refreshViewContext = () => {
    loadViewContext();
  };

  /**
   * Toggle between aggregate (all clients) and single client view
   */
  const setViewScope = (scope: 'all' | 'single', companyId?: string) => {
    if (!viewContext) return;

    const updatedContext: ViewContext = {
      ...viewContext,
      viewScope: scope,
    };

    // If switching to single mode and a company ID is provided, update the viewed company
    if (scope === 'single' && companyId) {
      updatedContext.companyId = companyId;
    }

    saveViewContext(updatedContext);
  };

  /**
   * Switch to viewing a specific client label under the current publishing firm
   */
  const switchToClientView = (clientCompanyId: string, clientCompanyName: string) => {
    if (!viewContext) return;

    const updatedContext: ViewContext = {
      ...viewContext,
      mode: 'client',
      companyId: clientCompanyId,
      companyName: clientCompanyName,
      companyType: 'client_label',
      viewScope: 'single',
      // Keep the parent info for navigation
      parentCompanyId: viewContext.parentCompanyId || viewContext.companyId,
      parentCompanyName: viewContext.parentCompanyName || viewContext.companyName,
    };

    saveViewContext(updatedContext);
  };

  /**
   * Set or clear the publishing entity filter
   */
  const setPublishingEntity = (entityId: string | null, entityName?: string) => {
    if (!viewContext) return;

    const updatedContext: ViewContext = {
      ...viewContext,
      publishingEntityId: entityId || undefined,
      publishingEntityName: entityName || undefined,
    };

    saveViewContext(updatedContext);
  };

  const isViewingAsSubAccount = viewContext?.mode === 'subaccount' || viewContext?.mode === 'client';
  const isViewingAsClient = viewContext?.mode === 'client';
  const isAggregateView = viewContext?.viewScope === 'all';
  const isEntityFiltered = !!viewContext?.publishingEntityId;

  return (
    <ViewModeContext.Provider
      value={{
        viewContext,
        isViewingAsSubAccount,
        isViewingAsClient,
        isAggregateView,
        isEntityFiltered,
        exitViewMode,
        refreshViewContext,
        setViewScope,
        switchToClientView,
        setPublishingEntity,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
