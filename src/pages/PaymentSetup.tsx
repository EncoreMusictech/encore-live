import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PaymentSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wasCanceled = searchParams.get('canceled') === 'true';

  // Auto-redirect to Stripe checkout on mount
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // If canceled, show retry option instead of auto-redirecting
    if (wasCanceled) {
      setLoading(false);
      return;
    }

    const redirectToStripe = async () => {
      try {
        // First check if payment already collected
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

        // Redirect to Stripe checkout
        const { data, error: checkoutError } = await supabase.functions.invoke('create-setup-checkout', {
          method: 'POST'
        });

        if (checkoutError) throw checkoutError;
        if (!data?.url) throw new Error('No checkout URL returned');

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } catch (err: any) {
        console.error('Error redirecting to Stripe:', err);
        setError(err.message || 'Failed to start payment setup');
        setLoading(false);
      }
    };

    redirectToStripe();
  }, [user, navigate, wasCanceled]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: checkoutError } = await supabase.functions.invoke('create-setup-checkout', {
        method: 'POST'
      });

      if (checkoutError) throw checkoutError;
      if (!data?.url) throw new Error('No checkout URL returned');

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Error creating checkout:', err);
      setError(err.message || 'Failed to start payment setup');
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Show loading while redirecting to Stripe
  if (loading && !wasCanceled && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">Setting Up Payment</CardTitle>
            <CardDescription className="text-base">
              Redirecting you to secure payment setup...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show retry UI if canceled or error
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">Payment Setup</CardTitle>
          </div>
          <CardDescription className="text-base">
            Complete payment setup to access your dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {wasCanceled && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment setup was canceled. Please complete payment setup to continue.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleRetry}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Continue to Payment Setup
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You won't be charged until you subscribe to a plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSetup;
