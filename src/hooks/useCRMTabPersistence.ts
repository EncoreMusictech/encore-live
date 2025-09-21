import { useState, useEffect, useCallback } from 'react';

interface TabState {
  [modulePath: string]: string;
}

const STORAGE_KEY = 'crm_tab_states';

/**
 * Hook to persist and restore tab states across CRM modules
 * Automatically saves tab state when switching tabs or navigating away
 */
export const useCRMTabPersistence = (modulePath: string, defaultTab: string) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Load saved tab state on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const tabStates: TabState = JSON.parse(saved);
        if (tabStates[modulePath]) {
          setActiveTab(tabStates[modulePath]);
        }
      }
    } catch (error) {
      console.error('Error loading tab state:', error);
    }
  }, [modulePath]);

  // Save tab state whenever it changes
  const saveTabState = useCallback((tab: string) => {
    try {
      const existing = sessionStorage.getItem(STORAGE_KEY);
      const tabStates: TabState = existing ? JSON.parse(existing) : {};
      tabStates[modulePath] = tab;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabStates));
    } catch (error) {
      console.error('Error saving tab state:', error);
    }
  }, [modulePath]);

  // Enhanced setActiveTab that also saves to storage
  const setActiveTabWithPersistence = useCallback((tab: string) => {
    setActiveTab(tab);
    saveTabState(tab);
  }, [saveTabState]);

  // Save state when window loses focus (external navigation)
  useEffect(() => {
    const handleBlur = () => saveTabState(activeTab);
    const handleVisibilityChange = () => {
      if (document.hidden) saveTabState(activeTab);
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, saveTabState]);

  return {
    activeTab,
    setActiveTab: setActiveTabWithPersistence
  };
};