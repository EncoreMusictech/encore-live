import { Crown, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

export const SubscriptionBadge = () => {
  const { user } = useAuth();
  const { subscribed, subscription_tier, openCustomerPortal } = useSubscription();

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href="/auth" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Sign In
        </a>
      </Button>
    );
  }

  if (!subscribed) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href="/pricing" className="flex items-center gap-2">
          <Crown className="w-4 h-4" />
          Upgrade
        </a>
      </Button>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className="cursor-pointer bg-gradient-primary/10 border-primary/20 text-primary hover:bg-gradient-primary/20"
      onClick={openCustomerPortal}
    >
      <Crown className="w-3 h-3 mr-1" />
      {subscription_tier || 'Pro'}
    </Badge>
  );
};