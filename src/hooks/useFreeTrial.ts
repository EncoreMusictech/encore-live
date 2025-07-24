import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FreeTrialData {
  hasActiveTrial: boolean;
  trialInfo: {
    trial_type: string;
    trial_identifier: string;
    trial_modules: string[];
    trial_end_date: string;
  } | null;
}

export const useFreeTrial = () => {
  const [trialData, setTrialData] = useState<FreeTrialData>({
    hasActiveTrial: false,
    trialInfo: null,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const checkTrialStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking trial status:', error);
        return;
      }

      setTrialData({
        hasActiveTrial: data.has_active_trial || false,
        trialInfo: data.trial_info || null,
      });
    } catch (error) {
      console.error('Error checking trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startFreeTrial = async (trialType: 'module' | 'bundle' | 'custom', trialIdentifier: string, trialModules: string[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start your free trial",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('start-free-trial', {
        body: { 
          trialType, 
          trialIdentifier, 
          trialModules 
        }
      });

      if (error) {
        console.error('Error starting free trial:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to start free trial",
          variant: "destructive",
        });
        return false;
      }

      if (data.success) {
        toast({
          title: "Free Trial Started! 🎉",
          description: data.message || "Your 14-day free trial has begun",
        });
        
        // Refresh trial status
        await checkTrialStatus();
        return true;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to start free trial",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error starting free trial:', error);
      toast({
        title: "Error",
        description: "Failed to start free trial",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createTrialCheckout = async (trialType: 'module' | 'bundle', trialIdentifier: string, trialModules: string[], billingInterval: 'month' | 'year' = 'month') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          productType: trialType, 
          productId: trialIdentifier, 
          billingInterval,
          trialModules 
        }
      });

      if (error) {
        console.error('Error creating trial checkout:', error);
        toast({
          title: "Error",
          description: "Failed to create checkout session",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Starting Free Trial",
          description: "Complete your signup in the new tab to start your 14-day free trial",
        });
      }
    } catch (error) {
      console.error('Error creating trial checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasModuleAccess = (moduleId: string): boolean => {
    if (!trialData.hasActiveTrial || !trialData.trialInfo) return false;
    return trialData.trialInfo.trial_modules.includes(moduleId);
  };

  const getTrialDaysRemaining = (): number => {
    if (!trialData.hasActiveTrial || !trialData.trialInfo) return 0;
    
    const endDate = new Date(trialData.trialInfo.trial_end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  useEffect(() => {
    if (user) {
      checkTrialStatus();
    } else {
      setTrialData({
        hasActiveTrial: false,
        trialInfo: null,
      });
    }
  }, [user]);

  return {
    ...trialData,
    loading,
    startFreeTrial,
    createTrialCheckout,
    checkTrialStatus,
    hasModuleAccess,
    getTrialDaysRemaining,
  };
};