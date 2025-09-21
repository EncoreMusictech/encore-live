import { useEffect, useCallback } from 'react';

interface SessionPersistenceOptions {
  key: string;
  data: any;
  enabled?: boolean;
}

/**
 * Hook to persist session state and prevent data loss during navigation
 * Handles browser navigation, tab switches, and external link access
 */
export const useSessionPersistence = ({
  key,
  data,
  enabled = true
}: SessionPersistenceOptions) => {
  
  // Save session state to sessionStorage
  const saveSessionState = useCallback(() => {
    if (!enabled) return;
    
    try {
      const sessionData = {
        data,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      sessionStorage.setItem(`session_${key}`, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }, [data, enabled, key]);

  // Load session state from sessionStorage
  const loadSessionState = useCallback(() => {
    if (!enabled) return null;
    
    try {
      const saved = sessionStorage.getItem(`session_${key}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
    return null;
  }, [enabled, key]);

  // Clear session state
  const clearSessionState = useCallback(() => {
    try {
      sessionStorage.removeItem(`session_${key}`);
    } catch (error) {
      console.error('Failed to clear session state:', error);
    }
  }, [key]);

  // Setup event listeners for session persistence
  useEffect(() => {
    if (!enabled) return;

    // Save state when data changes
    saveSessionState();

    // Save state on page visibility change (tab switches)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveSessionState();
      }
    };

    // Save state before page unload
    const handleBeforeUnload = () => {
      saveSessionState();
    };

    // Save state on focus loss (when clicking external links)
    const handleWindowBlur = () => {
      saveSessionState();
    };

    // Restore state on focus gain (returning from external windows)
    const handleWindowFocus = () => {
      // Small delay to ensure any navigation has completed
      setTimeout(() => {
        const savedState = loadSessionState();
        if (savedState && savedState.data) {
          // Emit custom event for components to listen to
          window.dispatchEvent(new CustomEvent('sessionStateRestore', {
            detail: savedState
          }));
        }
      }, 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enabled, saveSessionState, loadSessionState]);

  return {
    loadSessionState,
    clearSessionState,
    saveSessionState
  };
};