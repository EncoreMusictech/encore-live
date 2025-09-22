import { useEffect, useCallback, useRef } from 'react';

interface FormPersistenceOptions {
  key: string;
  data: any;
  delay?: number; // Delay in milliseconds before saving
  enabled?: boolean;
}

/**
 * Custom hook for persisting form data to localStorage with debounced saving
 * Automatically saves form state and restores it on component mount
 */
export const useFormPersistence = ({
  key,
  data,
  delay = 2000, // Default 2 second delay
  enabled = true
}: FormPersistenceOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);

  // Generate a unique storage key
  const storageKey = `form_draft_${key}`;

  // Debounced save function
  const saveToStorage = useCallback(() => {
    if (!enabled) return;
    
    try {
      const dataToSave = {
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log(`Auto-saved form data for ${key}`);
    } catch (error) {
      console.error('Failed to save form data to localStorage:', error);
    }
  }, [data, enabled, storageKey, key]);

  // Load saved data from storage
  const loadFromStorage = useCallback(() => {
    if (!enabled) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log(`Restored form data for ${key}`, parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load form data from localStorage:', error);
    }
    return null;
  }, [enabled, storageKey, key]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      console.log(`Cleared saved form data for ${key}`);
    } catch (error) {
      console.error('Failed to clear saved form data:', error);
    }
  }, [storageKey, key]);

  // Check if there's saved data available
  const hasSavedData = useCallback(() => {
    if (!enabled) return false;
    return localStorage.getItem(storageKey) !== null;
  }, [enabled, storageKey]);

  // Get saved data timestamp
  const getSavedDataTimestamp = useCallback(() => {
    const saved = loadFromStorage();
    return saved?.timestamp || null;
  }, [loadFromStorage]);

  // Effect for debounced auto-saving
  useEffect(() => {
    // Skip saving on initial load to prevent overwriting restored data
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      return;
    }

    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for saving
    timeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, delay);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, saveToStorage]);

  // Save immediately when the page is hidden (no browser prompt)
  useEffect(() => {
    if (!enabled) return;

    const handlePageHide = () => {
      saveToStorage();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (user switched tab/window)
        saveToStorage();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, saveToStorage]);

  return {
    loadFromStorage,
    clearSavedData,
    hasSavedData,
    getSavedDataTimestamp,
    saveNow: saveToStorage
  };
};