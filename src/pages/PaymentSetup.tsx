import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PaymentSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const wasCanceled = searchParams.get('canceled') === 'true';

  // Check if user already has payment method collected
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('payment_method_collected, terms_accepted')
          .eq('id', user.id)
          .single();

        // If terms not accepted, go to terms first
        if (!profile?.terms_accepted) {
          navigate('/terms');
          return;
        }

        // If payment already collected, go to dashboard
        if (profile?.payment_method_collected) {
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkPaymentStatus();
  }, [user, navigate]);

  const handleSetupPayment = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-setup-checkout', {
        method: 'POST'
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Error creating setup checkout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start payment setup. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (!user || checkingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">Payment Setup</CardTitle>
          </div>
          <CardDescription className="text-base">
            Add a payment method to complete your account setup
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {wasCanceled && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment setup was canceled. Please complete payment setup to access your dashboard.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Secure Payment</p>
                <p className="text-xs text-muted-foreground">
                  Your payment information is securely processed by Stripe. We never store your card details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">No Charge Today</p>
                <p className="text-xs text-muted-foreground">
                  We're just collecting your payment method. You won't be charged until you subscribe to a plan.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSetupPayment}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent mr-2" />
                Redirecting to Stripe...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment Method
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By adding a payment method, you agree to our billing terms and conditions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSetup;
