import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Music, FileText, TrendingUp, Users, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface InvitedUserWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  companyName?: string;
  role?: string;
}

const InvitedUserWelcomeModal = ({ open, onClose, companyName, role }: InvitedUserWelcomeModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const isClient = role === 'client';
  const displayRole = role === 'admin' ? 'Administrator' : role === 'user' ? 'Team Member' : 'Client';

  const steps = [
    {
      title: `Welcome to ${companyName || 'ENCORE'}! 🎵`,
      subtitle: `You've been added as ${displayRole === 'Client' ? 'a' : 'an'} ${displayRole}`,
      icon: Sparkles,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-10 w-10 text-primary" />
          </div>
          <p className="text-muted-foreground">
            {isClient
              ? `You now have access to your personalized portal where you can view your works, contracts, royalties, and more.`
              : `You now have access to powerful tools for managing music copyrights, contracts, royalties, and more as part of the ${companyName || 'ENCORE'} team.`}
          </p>
          {companyName && (
            <Badge variant="secondary" className="text-sm">
              <Shield className="h-3 w-3 mr-1" />
              {companyName}
            </Badge>
          )}
        </div>
      ),
    },
    {
      title: 'What You Can Access',
      subtitle: 'Explore your available features',
      icon: CheckCircle,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isClient ? (
            <>
              <FeatureCard icon={FileText} color="blue" title="Your Contracts" description="View your agreements" />
              <FeatureCard icon={TrendingUp} color="green" title="Royalty Statements" description="Track your earnings" />
              <FeatureCard icon={Music} color="purple" title="Your Works" description="See your registered catalog" />
              <FeatureCard icon={Users} color="orange" title="Sync Opportunities" description="Track licensing deals" />
            </>
          ) : (
            <>
              <FeatureCard icon={FileText} color="blue" title="Manage Contracts" description="Create and track agreements" />
              <FeatureCard icon={TrendingUp} color="green" title="Track Royalties" description="Process and monitor earnings" />
              <FeatureCard icon={Music} color="purple" title="Copyright Management" description="Register and protect works" />
              <FeatureCard icon={Users} color="orange" title="Sync Licensing" description="Manage licensing deals" />
            </>
          )}
        </div>
      ),
    },
    {
      title: "You're All Set! 🚀",
      subtitle: isClient ? 'Ready to explore your portal' : 'Ready to explore your dashboard',
      icon: CheckCircle,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <p className="text-muted-foreground">
            Your account is fully set up. Click "Get Started" to begin exploring
            {isClient ? ' your client portal' : ' your dashboard'} and all the features available to you.
          </p>
          <Badge variant="secondary" className="animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            Welcome aboard!
          </Badge>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    try {
      setCompleting(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, onboarding_complete: true });
      if (error) throw error;
      toast({
        title: `Welcome to ${companyName || 'ENCORE'}!`,
        description: 'Your account setup is complete.',
      });
      onClose();
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({ title: 'Setup Complete', description: 'Welcome!' });
      onClose();
    } finally {
      setCompleting(false);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-lg blur-xl animate-pulse" />
          <div className="relative bg-background rounded-lg p-8">
            {/* Progress */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index <= currentStep ? 'bg-primary animate-pulse' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <currentStepData.icon className="h-8 w-8 text-primary animate-pulse" />
                <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              </div>
              <p className="text-muted-foreground text-lg">{currentStepData.subtitle}</p>
            </div>

            {/* Content */}
            <div className="mb-8 animate-fade-in">{currentStepData.content}</div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              {currentStep > 0 && (
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="min-w-[120px]">
                  Previous
                </Button>
              )}
              <Button onClick={handleNext} disabled={completing} size="lg" className="min-w-[160px] animate-pulse shadow-lg">
                {completing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent mr-2" />
                    Setting up...
                  </>
                ) : isLastStep ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Started!
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function FeatureCard({ icon: Icon, color, title, description }: { icon: any; color: string; title: string; description: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export default InvitedUserWelcomeModal;
