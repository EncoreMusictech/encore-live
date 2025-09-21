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

  // Handle browser navigation attempts
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, enabled]);

  // Handle programmatic navigation
  const handleNavigationAttempt = useCallback(async (callback: () => void) => {
    if (!hasUnsavedChanges) {
      callback();
      return;
    }

    setIsNavigating(true);

    // Show save prompt
    const shouldSave = window.confirm(
      'You have unsaved changes. Would you like to save before leaving?'
    );

    if (shouldSave && onSaveBeforeLeave) {
      try {
        await onSaveBeforeLeave();
        toast({
          title: "Changes Saved",
          description: "Your changes have been saved successfully.",
        });
        callback();
      } catch (error) {
        console.error('Error saving before navigation:', error);
        toast({
          title: "Save Failed",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      const proceedAnyway = window.confirm(
        'Are you sure you want to leave without saving?'
      );
      if (proceedAnyway) {
        callback();
      }
    }

    setIsNavigating(false);
  }, [hasUnsavedChanges, onSaveBeforeLeave]);

  return {
    isNavigating,
    handleNavigationAttempt
  };
};