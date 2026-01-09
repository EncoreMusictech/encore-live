import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/payment-setup');
      return;
    }

    const confirmPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('confirm-payment-setup', {
          body: { sessionId }
        });

        if (error) throw error;

        setStatus('success');
        toast({
          title: "Payment Method Added",
          description: "Your account is now fully set up. Redirecting to dashboard...",
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error: any) {
        console.error('Error confirming payment:', error);
        setStatus('error');
        toast({
          title: "Error",
          description: error.message || "Failed to confirm payment setup. Please try again.",
          variant: "destructive"
        });

        // Redirect to payment setup on error
        setTimeout(() => {
          navigate('/payment-setup');
        }, 3000);
      }
    };

    confirmPayment();
  }, [user, navigate, searchParams, toast]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto animate-fade-in">
        <CardHeader className="text-center pb-6">
          {status === 'confirming' && (
            <>
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">Confirming Payment Setup</CardTitle>
              <CardDescription className="text-base">
                Please wait while we confirm your payment method...
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                Setup Complete!
              </CardTitle>
              <CardDescription className="text-base">
                Your payment method has been added successfully. Redirecting to your dashboard...
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <CardTitle className="text-2xl font-bold text-destructive">
                Setup Failed
              </CardTitle>
              <CardDescription className="text-base">
                There was an issue confirming your payment. Redirecting back to setup...
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {status === 'success' && (
            <div className="flex justify-center">
              <div className="animate-pulse text-sm text-muted-foreground">
                Redirecting to dashboard...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
