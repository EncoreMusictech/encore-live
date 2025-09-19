import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Music, FileText, TrendingUp, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const steps = [
    {
      title: "Welcome to Encore Music! 🎵",
      subtitle: "Your comprehensive music industry management platform",
      icon: Sparkles,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <Music className="h-10 w-10 text-primary" />
          </div>
          <p className="text-muted-foreground">
            You now have access to powerful tools for managing your music copyrights, 
            contracts, royalties, and more. Let's get you started!
          </p>
        </div>
      )
    },
    {
      title: "What You Can Do",
      subtitle: "Explore your new capabilities",
      icon: CheckCircle,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Manage Contracts</h4>
                <p className="text-sm text-muted-foreground">Create and track agreements</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Track Royalties</h4>
                <p className="text-sm text-muted-foreground">Monitor your earnings</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Music className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Copyright Management</h4>
                <p className="text-sm text-muted-foreground">Protect your works</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">Sync Licensing</h4>
                <p className="text-sm text-muted-foreground">Expand opportunities</p>
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      title: "You're All Set! 🚀",
      subtitle: "Ready to explore your dashboard",
      icon: CheckCircle,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <p className="text-muted-foreground">
            Your account is now fully set up. Click "Get Started" to begin exploring 
            your dashboard and all the powerful features available to you.
          </p>
          <Badge variant="secondary" className="animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            Welcome aboard!
          </Badge>
        </div>
      )
    }
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

      // Mark onboarding as complete
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          onboarding_complete: true
        });

      if (error) throw error;

      toast({
        title: "Welcome to Encore Music!",
        description: "Your account setup is complete. Let's get started!",
      });

      onClose();

    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Setup Complete",
        description: "Welcome to Encore Music!",
      });
      onClose();
    } finally {
      setCompleting(false);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl"
      >
        <div className="relative">
          {/* Pulsating glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-lg blur-xl animate-pulse" />
          
          <div className="relative bg-background rounded-lg p-8">
            {/* Progress indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index <= currentStep 
                        ? 'bg-primary animate-pulse' 
                        : 'bg-muted'
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
            <div className="mb-8 animate-fade-in">
              {currentStepData.content}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              {currentStep > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="min-w-[120px]"
                >
                  Previous
                </Button>
              )}
              
              <Button 
                onClick={handleNext}
                disabled={completing}
                size="lg"
                className="min-w-[160px] animate-pulse shadow-lg"
              >
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

export default WelcomeModal;