import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  validateEmail, 
  validatePassword, 
  sanitizeInput, 
  clientRateLimit, 
  logSecurityEvent 
} from '@/lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    // Rate limiting for sign up attempts
    const clientIp = 'signup-attempt'; // In a real app, you'd get the actual IP
    if (!clientRateLimit(clientIp, 5, 900000)) { // 5 attempts per 15 minutes
      const rateLimitError = { message: "Too many sign up attempts. Please try again later." };
      logSecurityEvent('signup_rate_limit_exceeded', { email: sanitizeInput(email) });
      toast({
        title: "Sign up failed",
        description: rateLimitError.message,
        variant: "destructive",
      });
      return { error: rateLimitError };
    }

    // Input validation and sanitization
    if (!email?.trim() || !password?.trim()) {
      const validationError = { message: "Email and password are required" };
      logSecurityEvent('signup_missing_credentials', {});
      toast({
        title: "Sign up failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase(), 320);
    
    // Enhanced email validation
    if (!validateEmail(sanitizedEmail)) {
      const validationError = { message: "Please enter a valid email address" };
      logSecurityEvent('signup_invalid_email', { email: sanitizedEmail });
      toast({
        title: "Sign up failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const validationError = { message: passwordValidation.errors.join(', ') };
      logSecurityEvent('signup_weak_password', { email: sanitizedEmail });
      toast({
        title: "Sign up failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      // Enhanced error handling with security logging
      let errorMessage = error.message;
      logSecurityEvent('signup_failed', { 
        email: sanitizedEmail, 
        error: error.message,
        timestamp: Date.now()
      });
      
      if (error.message.includes('already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.message.includes('invalid')) {
        errorMessage = "Please check your email and password and try again.";
      } else if (error.message.includes('rate')) {
        errorMessage = "Too many requests. Please try again later.";
      } else {
        // Don't expose internal errors
        errorMessage = "Sign up failed. Please try again.";
      }
      
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      logSecurityEvent('signup_success', { email: sanitizedEmail });
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Rate limiting for sign in attempts
    const clientIp = 'signin-attempt'; // In a real app, you'd get the actual IP
    if (!clientRateLimit(clientIp, 10, 900000)) { // 10 attempts per 15 minutes
      const rateLimitError = { message: "Too many sign in attempts. Please try again later." };
      logSecurityEvent('signin_rate_limit_exceeded', { email: sanitizeInput(email) });
      toast({
        title: "Sign in failed",
        description: rateLimitError.message,
        variant: "destructive",
      });
      return { error: rateLimitError };
    }

    // Input validation and sanitization
    if (!email?.trim() || !password?.trim()) {
      const validationError = { message: "Email and password are required" };
      logSecurityEvent('signin_missing_credentials', {});
      toast({
        title: "Sign in failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase(), 320);
    
    if (!validateEmail(sanitizedEmail)) {
      const validationError = { message: "Please enter a valid email address" };
      logSecurityEvent('signin_invalid_email', { email: sanitizedEmail });
      toast({
        title: "Sign in failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      // Enhanced error handling with security logging
      logSecurityEvent('signin_failed', { 
        email: sanitizedEmail, 
        error: error.message,
        timestamp: Date.now()
      });
      
      let errorMessage = "Invalid email or password";
      if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link before signing in.";
      } else if (error.message.includes('Too many requests')) {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password";
      }
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      logSecurityEvent('signin_success', { email: sanitizedEmail });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};