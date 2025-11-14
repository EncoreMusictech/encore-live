import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface ViewContext {
  mode: 'system' | 'subaccount';
  companyId?: string;
  companyName?: string;
  returnPath?: string;
}

interface ViewModeContextType {
  viewContext: ViewContext | null;
  isViewingAsSubAccount: boolean;
  exitViewMode: () => void;
  refreshViewContext: () => void;
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

  const exitViewMode = () => {
    const returnPath = viewContext?.returnPath || '/dashboard/operations';
    sessionStorage.removeItem('viewContext');
    setViewContext(null);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('viewContextChanged'));
    
    navigate(returnPath);
  };

  const refreshViewContext = () => {
    loadViewContext();
  };

  const isViewingAsSubAccount = viewContext?.mode === 'subaccount';

  return (
    <ViewModeContext.Provider
      value={{
        viewContext,
        isViewingAsSubAccount,
        exitViewMode,
        refreshViewContext,
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
