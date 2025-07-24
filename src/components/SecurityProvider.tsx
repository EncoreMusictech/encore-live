import React, { useEffect, useRef } from 'react';
import { securityMonitor } from '@/lib/securityMonitor';
import { logSecurityEvent } from '@/lib/security';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    
    // Initialize comprehensive security monitoring
    const initialize = async () => {
      try {
        // Enhanced DOM monitoring for suspicious elements
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Check for suspicious iframe injections
                if (element.tagName === 'IFRAME') {
                  const src = element.getAttribute('src');
                  if (src && !src.startsWith(window.location.origin)) {
                    logSecurityEvent('suspicious_iframe_injection', {
                      src,
                      timestamp: Date.now(),
                      userAgent: navigator.userAgent
                    });
                    element.remove();
                  }
                }
                
                // Check for suspicious script injections
                if (element.tagName === 'SCRIPT') {
                  const src = element.getAttribute('src');
                  if (src && !src.startsWith(window.location.origin) && !src.includes('supabase.co')) {
                    logSecurityEvent('suspicious_script_injection', {
                      src,
                      timestamp: Date.now(),
                      userAgent: navigator.userAgent
                    });
                    element.remove();
                  }
                }
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Enhanced navigation monitoring
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
          logSecurityEvent('navigation_change', {
            path: args[2] as string || window.location.pathname,
            timestamp: Date.now()
          });
          return originalPushState.apply(this, args);
        };

        history.replaceState = function(...args) {
          logSecurityEvent('navigation_change', {
            path: args[2] as string || window.location.pathname,
            timestamp: Date.now()
          });
          return originalReplaceState.apply(this, args);
        };

        // Enhanced click tracking for suspicious patterns
        document.addEventListener('click', (event) => {
          const target = event.target as HTMLElement;
          
          // Track rapid clicking patterns (potential bot behavior)
          logSecurityEvent('user_interaction', {
            type: 'click',
            elementType: target.tagName,
            timestamp: Date.now(),
            coordinates: { x: event.clientX, y: event.clientY }
          });
        });

        // Enhanced keyboard monitoring for injection attempts
        document.addEventListener('keydown', (event) => {
          // Monitor for potential XSS attempts via form inputs
          if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            const suspiciousPatterns = [
              /<script/i,
              /javascript:/i,
              /on\w+\s*=/i,
              /eval\s*\(/i,
              /document\.cookie/i
            ];

            const value = event.target.value + event.key;
            suspiciousPatterns.forEach(pattern => {
              if (pattern.test(value)) {
                logSecurityEvent('potential_xss_attempt', {
                  pattern: pattern.toString(),
                  inputType: (event.target as HTMLInputElement).type,
                  timestamp: Date.now()
                });
              }
            });
          }
        });

        // Enhanced clipboard monitoring
        document.addEventListener('paste', (event) => {
          const clipboardData = event.clipboardData?.getData('text') || '';
          const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /data:text\/html/i,
            /vbscript:/i
          ];

          suspiciousPatterns.forEach(pattern => {
            if (pattern.test(clipboardData)) {
              logSecurityEvent('suspicious_paste_content', {
                pattern: pattern.toString(),
                contentLength: clipboardData.length,
                timestamp: Date.now()
              });
              event.preventDefault();
            }
          });
        });

        // Enhanced window focus monitoring for tab nabbing attacks
        let lastFocusTime = Date.now();
        window.addEventListener('focus', () => {
          const now = Date.now();
          const timeAway = now - lastFocusTime;
          
          // If user was away for more than 30 seconds, log it
          if (timeAway > 30000) {
            logSecurityEvent('extended_tab_away', {
              timeAway,
              timestamp: now
            });
          }
          lastFocusTime = now;
        });

        window.addEventListener('blur', () => {
          lastFocusTime = Date.now();
        });

        // Enhanced console access monitoring
        const originalConsole = { ...console };
        const consoleAccessPattern = /console\.(log|warn|error|debug)/;
        
        Object.keys(originalConsole).forEach(method => {
          if (typeof originalConsole[method as keyof Console] === 'function') {
            (console as any)[method] = function(...args: any[]) {
              // Track potential debugging attempts
              const stackTrace = new Error().stack || '';
              if (!stackTrace.includes('SecurityProvider') && !stackTrace.includes('securityMonitor')) {
                logSecurityEvent('console_access', {
                  method,
                  timestamp: Date.now(),
                  argsCount: args.length
                });
              }
              return (originalConsole as any)[method].apply(this, args);
            };
          }
        });

        isInitialized.current = true;
        
        logSecurityEvent('security_provider_initialized', {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });

      } catch (error) {
        console.error('Failed to initialize security provider:', error);
        logSecurityEvent('security_initialization_failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        });
      }
    };

    initialize();

    // Cleanup function
    return () => {
      // Restore original console methods
      Object.assign(console, console);
    };
  }, []);

  return <>{children}</>;
};