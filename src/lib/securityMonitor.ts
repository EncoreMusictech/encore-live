import { supabase } from '@/integrations/supabase/client';

interface SecurityMonitor {
  trackFailedAttempt: (type: string, identifier: string) => Promise<void>;
  checkSuspiciousActivity: (type: string, identifier: string) => Promise<boolean>;
  logSecurityEvent: (event: string, details: any) => Promise<void>;
}

class SecurityMonitorService implements SecurityMonitor {
  private readonly maxAttempts = {
    login: 5,
    signup: 3,
    password_reset: 3
  };

  private readonly timeWindows = {
    login: 15 * 60 * 1000, // 15 minutes
    signup: 60 * 60 * 1000, // 1 hour
    password_reset: 60 * 60 * 1000 // 1 hour
  };

  async trackFailedAttempt(type: string, identifier: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_action_type: type,
        p_max_attempts: this.maxAttempts[type as keyof typeof this.maxAttempts] || 5,
        p_window_minutes: Math.floor((this.timeWindows[type as keyof typeof this.timeWindows] || 900000) / 60000),
        p_block_minutes: 60
      });

      if (error) {
        console.error('Failed to track rate limit:', error);
      }
    } catch (error) {
      console.error('Error tracking failed attempt:', error);
    }
  }

  async checkSuspiciousActivity(type: string, identifier: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_action_type: type,
        p_max_attempts: this.maxAttempts[type as keyof typeof this.maxAttempts] || 5,
        p_window_minutes: Math.floor((this.timeWindows[type as keyof typeof this.timeWindows] || 900000) / 60000),
        p_block_minutes: 60
      });

      if (error) {
        console.error('Failed to check rate limit:', error);
        return false; // Allow on error to prevent blocking legitimate users
      }

      return data === true;
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      return true; // Allow on error
    }
  }

  async logSecurityEvent(event: string, details: any): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: event,
        p_event_data: details,
        p_severity: this.getSeverityLevel(event)
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  private getSeverityLevel(event: string): string {
    const criticalEvents = [
      'sql_injection_attempt',
      'privilege_escalation_attempt',
      'data_exfiltration_attempt'
    ];

    const highEvents = [
      'signin_rate_limit_exceeded',
      'signup_rate_limit_exceeded',
      'unauthorized_access_attempt'
    ];

    const mediumEvents = [
      'signin_failed',
      'signup_failed',
      'invalid_input_detected'
    ];

    if (criticalEvents.some(e => event.includes(e))) return 'critical';
    if (highEvents.some(e => event.includes(e))) return 'high';
    if (mediumEvents.some(e => event.includes(e))) return 'medium';
    return 'low';
  }
}

export const securityMonitor = new SecurityMonitorService();

// Enhanced session management
export class SecureSessionManager {
  private static readonly SESSION_KEY = 'encore_session_data';
  private static readonly MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours

  static setSessionData(data: any): void {
    try {
      const sessionData = {
        data,
        timestamp: Date.now(),
        fingerprint: this.generateFingerprint()
      };
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to set session data:', error);
    }
  }

  static getSessionData(): any {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (!stored) return null;

      const sessionData = JSON.parse(stored);
      const now = Date.now();

      // Check if session is expired
      if (now - sessionData.timestamp > this.MAX_SESSION_AGE) {
        this.clearSession();
        return null;
      }

      // Check fingerprint for session hijacking detection
      if (sessionData.fingerprint !== this.generateFingerprint()) {
        securityMonitor.logSecurityEvent('session_hijacking_detected', {
          storedFingerprint: sessionData.fingerprint,
          currentFingerprint: this.generateFingerprint()
        });
        this.clearSession();
        return null;
      }

      return sessionData.data;
    } catch (error) {
      console.error('Failed to get session data:', error);
      return null;
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  private static generateFingerprint(): string {
    // Generate a basic browser fingerprint for session validation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Encore Security Check', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }
}

// Content Security Policy helper - simplified to avoid meta tag limitations
export const enforceCSP = (): void => {
  // Note: frame-ancestors directive is ignored in meta tags, so we skip CSP meta injection
  // CSP should be handled at the server/hosting level for full effectiveness
  console.log('[SECURITY] CSP enforcement would be better handled via HTTP headers');
};

// Initialize security monitoring
export const initializeSecurity = (): void => {
  // Set up CSP
  enforceCSP();

  // Set up global error handling for security events
  window.addEventListener('error', (event) => {
    securityMonitor.logSecurityEvent('javascript_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Set up unhandled promise rejection tracking
  window.addEventListener('unhandledrejection', (event) => {
    securityMonitor.logSecurityEvent('unhandled_promise_rejection', {
      reason: event.reason?.toString() || 'Unknown'
    });
  });

  // Monitor for suspicious iframe creation
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.tagName === 'IFRAME' || element.tagName === 'SCRIPT') {
            securityMonitor.logSecurityEvent('suspicious_element_created', {
              tagName: element.tagName,
              src: element.getAttribute('src'),
              innerHTML: element.innerHTML.substring(0, 100)
            });
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};