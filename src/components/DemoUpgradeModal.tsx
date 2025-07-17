import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { useDemoAccess } from "@/hooks/useDemoAccess";

const DemoUpgradeModal = () => {
  const { showUpgradeModal, setShowUpgradeModal, upgradeMessage } = useDemoAccess();

  const benefits = [
    "Unlimited access to all modules",
    "Advanced analytics and reporting", 
    "Bulk processing capabilities",
    "Priority customer support",
    "API access for integrations",
    "Custom contract templates"
  ];

  const handleSignUp = () => {
    window.location.href = "/auth";
  };

  const handleViewPricing = () => {
    window.location.href = "/pricing";
  };

  return (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <DialogTitle className="text-2xl font-bold">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Upgrade to Pro
            </span>
          </DialogTitle>
          
          <DialogDescription className="text-base">
            {upgradeMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-music-purple" />
              <span className="font-semibold">Unlock Full Access</span>
            </div>
            
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-music-purple flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleSignUp}
              className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
            >
              Sign Up Now - Free Trial
            </Button>
            
            <Button 
              onClick={handleViewPricing}
              variant="outline"
              className="w-full border-music-purple text-music-purple hover:bg-music-purple hover:text-primary-foreground"
            >
              View Pricing Plans
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="bg-music-purple/10 text-music-purple">
              <Crown className="w-3 h-3 mr-1" />
              30-day free trial included
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoUpgradeModal;