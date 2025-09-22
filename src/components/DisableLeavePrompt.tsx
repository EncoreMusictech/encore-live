import { useEffect } from 'react';

export function DisableLeavePrompt() {
  useEffect(() => {
    // Remove any existing onbeforeunload handler
    try {
      (window as any).onbeforeunload = null;
      Object.defineProperty(window, 'onbeforeunload', {
        configurable: true,
        get() { return null; },
        set() { /* Block setting beforeunload handlers */ },
      });
    } catch {
      // Ignore if not allowed
    }

    // Monkeypatch addEventListener to block beforeunload registrations
    const originalAddEventListener = window.addEventListener.bind(window);
    const originalRemoveEventListener = window.removeEventListener.bind(window);

    const patchedAddEventListener: typeof window.addEventListener = ((type: any, listener: any, options?: any) => {
      if (type === 'beforeunload') {
        // Silently block
        // console.warn('Blocked beforeunload listener', listener);
        return;
      }
      return originalAddEventListener(type, listener as any, options as any);
    }) as any;

    const patchedRemoveEventListener: typeof window.removeEventListener = ((type: any, listener: any, options?: any) => {
      if (type === 'beforeunload') {
        // Nothing to remove since we never added
        return;
      }
      return originalRemoveEventListener(type, listener as any, options as any);
    }) as any;

    (window as any).addEventListener = patchedAddEventListener as any;
    (window as any).removeEventListener = patchedRemoveEventListener as any;

    return () => {
      // Restore originals on unmount (HMR safety)
      (window as any).addEventListener = originalAddEventListener as any;
      (window as any).removeEventListener = originalRemoveEventListener as any;
    };
  }, []);

  return null;
}
