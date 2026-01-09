import { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { CRMSidebar } from "./CRMSidebar";
import { CRMHeader } from "./CRMHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

export function CRMLayout() {
  const { user } = useAuth();
  const { subscribed, subscription_tier, loading: subscriptionLoading } = useSubscription();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const { canAccess: canAccessDemo } = useDemoAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean | null>(null);

  // Scroll to top when route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Check if user has access to CRM
  const adminEmails = ['info@encoremusic.tech', 'support@encoremusic.tech'];
  const isDemoAccount = user?.email === 'demo@encoremusic.tech';
  const isAdministrator = adminEmails.includes(user?.email?.toLowerCase() || '') || isAdmin;
  const hasPaidAccess = isAdministrator || subscribed || canAccessDemo;

  // Check payment status for non-admin, non-demo, non-subscribed users
  useEffect(() => {
    // Skip payment check for admins, demo accounts, or users with active subscriptions
    if (!user || isAdministrator || isDemoAccount || subscribed) {
      setPaymentVerified(true);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('payment_method_collected')
          .eq('id', user.id)
          .single();

        // Allow access if payment method is collected OR if they have any existing access
        if (!profile?.payment_method_collected && !hasPaidAccess) {
          navigate('/payment-setup');
          return;
        }
        setPaymentVerified(true);
      } catch (error) {
        console.error('Error checking payment status:', error);
        setPaymentVerified(true); // Allow access on error to not block users
      }
    };

    checkPaymentStatus();
  }, [user, isAdministrator, isDemoAccount, subscribed, hasPaidAccess, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access the CRM.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (subscriptionLoading || rolesLoading || paymentVerified === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading your CRM...</div>
      </div>
    );
  }

  if (!hasPaidAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-primary rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Subscription Required</h1>
            <p className="text-muted-foreground mb-6">
              Access to the CRM is restricted to paid subscribers. Upgrade your account to unlock powerful music industry tools.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/pricing">View Pricing Plans</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CRMSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <CRMHeader />
          <main ref={mainRef} className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}