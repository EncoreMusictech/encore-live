import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    // Input validation
    if (!email?.trim() || !password?.trim()) {
      const validationError = { message: "Email and password are required" };
      toast({
        title: "Sign up failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const validationError = { message: "Please enter a valid email address" };
      toast({
        title: "Sign up failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    // Password strength validation
    if (password.length < 8) {
      const validationError = { message: "Password must be at least 8 characters long" };
      toast({
        title: "Sign up failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), // Normalize email
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      // Enhanced error handling
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.message.includes('invalid')) {
        errorMessage = "Please check your email and password and try again.";
      }
      
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Input validation
    if (!email?.trim() || !password?.trim()) {
      const validationError = { message: "Email and password are required" };
      toast({
        title: "Sign in failed",
        description: validationError.message,
        variant: "destructive",
      });
      return { error: validationError };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), // Normalize email
      password,
    });

    if (error) {
      // Enhanced error handling - don't expose specific error details
      let errorMessage = "Invalid email or password";
      if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and click the confirmation link before signing in.";
      } else if (error.message.includes('Too many requests')) {
        errorMessage = "Too many failed attempts. Please try again later.";
      }
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
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