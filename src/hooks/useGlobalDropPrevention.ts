import { useEffect } from 'react';

/**
 * Prevents the browser from navigating/refreshing when files are
 * dragged and dropped outside of designated upload zones.
 */
export function useGlobalDropPrevention() {
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      // Only prevent if the drop target isn't inside a designated drop zone
      const target = e.target as HTMLElement;
      if (!target?.closest?.('[data-dropzone]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);
}
