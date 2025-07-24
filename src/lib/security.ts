// Security utilities for the application

export const sanitizeInput = (input: string, maxLength: number = 200): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove dangerous characters and scripts
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim();
  
  return sanitized.substring(0, maxLength);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /(.)\1{2,}/g, // repeated characters
    /123456/g,   // sequential numbers
    /password/gi, // common words
    /qwerty/gi,
    /admin/gi
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains weak patterns');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (!data || data.length <= visibleChars) return '***';
  return data.substring(0, visibleChars) + '*'.repeat(Math.max(0, data.length - visibleChars));
};

export const sanitizeLogData = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitiveFields = [
    'password', 'token', 'key', 'secret', 'email', 'phone', 'ssn', 
    'credit_card', 'auth', 'jwt', 'session', 'api_key', 'private',
    'access_token', 'refresh_token', 'bearer', 'authorization'
  ];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = maskSensitiveData(String(sanitized[key]));
    }
    
    // Deep sanitization for nested objects
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });
  
  return sanitized;
};

export const generateCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://plxsenykjisqutxcvjeg.supabase.co https://api.spotify.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; ');
};

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': generateCSPHeader(),
};

// Rate limiting for client-side operations
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export const clientRateLimit = (
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
};

// Clear expired rate limit entries periodically
export const cleanupRateLimit = (): void => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
};

// CSRF token validation helper
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Input validation for SQL injection prevention
export const validateSQLInput = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(-{2}|\/\*|\*\/)/g, // SQL comments
    /(\b(OR|AND)\b.*?[=<>])/gi, // Basic SQL injection patterns
    /(;|\||&)/g // Command injection
  ];
  
  return !sqlPatterns.some(pattern => pattern.test(input));
};

// File upload validation
export const validateFileUpload = (file: File, allowedTypes: string[] = [], maxSize: number = 10485760): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  if (file.size > maxSize) {
    errors.push(`File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`);
  }
  
  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
  const fileName = file.name.toLowerCase();
  
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    errors.push('File type is not allowed for security reasons');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Content validation for rich text editors
export const sanitizeRichText = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Secure session management helpers
export const isSessionValid = (timestamp: number, maxAge: number = 3600000): boolean => {
  return Date.now() - timestamp < maxAge;
};

export const logSecurityEvent = (event: string, details: any = {}): void => {
  console.warn(`[SECURITY] ${event}:`, sanitizeLogData(details));
  
  // In production, send to security monitoring service
  // Example: sendToSecurityService({ event, details: sanitizeLogData(details), timestamp: Date.now() });
};