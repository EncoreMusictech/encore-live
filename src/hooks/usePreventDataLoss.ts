import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface PreventDataLossOptions {
  hasUnsavedChanges: boolean;
  onSaveBeforeLeave?: () => Promise<void>;
  enabled?: boolean;
}

/**
 * Hook to prevent accidental data loss when navigating away from forms
 * Shows warnings and provides save opportunities
 */
export const usePreventDataLoss = ({
  hasUnsavedChanges,
  onSaveBeforeLeave,
  enabled = true
}: PreventDataLossOptions) => {
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle browser navigation attempts without showing native prompts
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      // Attempt a best-effort save, but NEVER trigger the native prompt
      if (hasUnsavedChanges && onSaveBeforeLeave) {
        try {
          onSaveBeforeLeave();
        } catch (e) {
          // ignore
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasUnsavedChanges, onSaveBeforeLeave]);

  // Handle programmatic navigation without blocking prompts
  const handleNavigationAttempt = useCallback(async (callback: () => void) => {
    if (!hasUnsavedChanges) {
      callback();
      return;
    }

    setIsNavigating(true);

    try {
      if (onSaveBeforeLeave) {
        await onSaveBeforeLeave();
        toast({
          title: "Changes Saved",
          description: "Your changes have been saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving before navigation:', error);
      toast({
        title: "Save Failed",
        description: "Navigating without saving.",
        variant: "destructive",
      });
    } finally {
      callback();
      setIsNavigating(false);
    }
  }, [hasUnsavedChanges, onSaveBeforeLeave]);

  return {
    isNavigating,
    handleNavigationAttempt
  };
};