// Early, global patch to suppress native "Leave site?" dialogs
// Runs on module import before the app mounts
(() => {
  try {
    // Clear any property-based handler and block future assignments
    (window as any).onbeforeunload = null;
    Object.defineProperty(window, 'onbeforeunload', {
      configurable: false,
      get() { return null; },
      set() { /* Block assignments to onbeforeunload */ }
    });
  } catch {}

  try {
    // Capturing listener that suppresses other handlers without triggering the prompt
    window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
      try { e.stopImmediatePropagation(); } catch {}
      // DO NOT call preventDefault or set returnValue here.
    }, { capture: true });
  } catch {}

  try {
    // Block future registrations of beforeunload on any EventTarget (window, etc.)
    const originalProtoAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type: any, listener: any, options?: any) {
      if (type === 'beforeunload') {
        // Silently ignore registration attempts
        return;
      }
      return originalProtoAdd.call(this, type, listener, options);
    };
  } catch {}
})();
