// Early, global patch to suppress native "Leave site?" dialogs
// Runs on module import before the app mounts
(() => {
  try {
    // Clear any property-based handler and block future assignments
    (window as any).onbeforeunload = null;
    Object.defineProperty(window, 'onbeforeunload', {
      configurable: true,
      get() { return null; },
      set() { /* Block assignments to onbeforeunload */ }
    });
  } catch {}

  try {
    // Capturing listener that prevents the native prompt and stops other handlers
    window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
      try { e.stopImmediatePropagation(); } catch {}
      e.preventDefault();
      try { delete (e as any).returnValue; } catch {}
    }, { capture: true });
  } catch {}

  try {
    // Block future registrations of beforeunload on window
    const originalAdd = window.addEventListener.bind(window);
    (window as any).addEventListener = ((type: any, listener: any, options?: any) => {
      if (type === 'beforeunload') {
        // Silently ignore
        return;
      }
      return originalAdd(type, listener as any, options as any);
    }) as any;
  } catch {}
})();
