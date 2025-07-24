import React, { useState, useEffect } from 'react';
import { sanitizeInput, validateSQLInput, logSecurityEvent, generateCSRFToken } from '@/lib/security';

interface SecureFormProps {
  onSubmit: (data: Record<string, any>) => void;
  children: React.ReactNode;
  validateOnSubmit?: boolean;
  maxInputLength?: number;
  className?: string;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  onSubmit,
  children,
  validateOnSubmit = true,
  maxInputLength = 1000,
  className = ''
}) => {
  const [csrfToken] = useState(generateCSRFToken());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    
    // Validate and sanitize all form data
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        const sanitizedValue = sanitizeInput(value, maxInputLength);
        
        if (validateOnSubmit && !validateSQLInput(sanitizedValue)) {
          logSecurityEvent('form_sql_injection_attempt', { 
            field: key, 
            value: sanitizedValue.substring(0, 50) + '...',
            timestamp: Date.now()
          });
          return; // Block submission
        }
        
        data[key] = sanitizedValue;
      } else {
        data[key] = value;
      }
    }
    
    // Add CSRF token for validation
    data._csrf = csrfToken;
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <input type="hidden" name="_csrf" value={csrfToken} />
      {children}
    </form>
  );
};

// Secure input component with built-in validation
interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validateSQL?: boolean;
  logSuspiciousActivity?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  validateSQL = true,
  logSuspiciousActivity = true,
  onChange,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (validateSQL && !validateSQLInput(value)) {
      if (logSuspiciousActivity) {
        logSecurityEvent('input_sql_injection_attempt', { 
          field: props.name || 'unknown',
          value: value.substring(0, 50) + '...',
          timestamp: Date.now()
        });
      }
      return; // Block the input
    }
    
    const sanitizedValue = sanitizeInput(value, props.maxLength || 1000);
    e.target.value = sanitizedValue;
    
    onChange?.(e);
  };

  return <input {...props} onChange={handleChange} />;
};

// Secure textarea component
interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  validateSQL?: boolean;
  logSuspiciousActivity?: boolean;
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  validateSQL = true,
  logSuspiciousActivity = true,
  onChange,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (validateSQL && !validateSQLInput(value)) {
      if (logSuspiciousActivity) {
        logSecurityEvent('textarea_sql_injection_attempt', { 
          field: props.name || 'unknown',
          value: value.substring(0, 50) + '...',
          timestamp: Date.now()
        });
      }
      return; // Block the input
    }
    
    const sanitizedValue = sanitizeInput(value, props.maxLength || 5000);
    e.target.value = sanitizedValue;
    
    onChange?.(e);
  };

  return <textarea {...props} onChange={handleChange} />;
};