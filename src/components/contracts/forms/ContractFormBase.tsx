import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Save, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { Stepper } from "@/components/ui/stepper";

export interface ContractFormStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  component: React.ComponentType<any>;
  validation?: (data: any) => boolean;
}

export interface ContractFormBaseProps {
  title: string;
  contractType: string;
  steps: ContractFormStep[];
  formData: any;
  onFormDataChange: (data: any) => void;
  onSave?: (data: any) => Promise<void>;
  onSubmit?: (data: any) => Promise<void>;
  demoData?: any;
  validationErrors?: string[];
}

export function ContractFormBase({
  title,
  contractType,
  steps,
  formData,
  onFormDataChange,
  onSave,
  onSubmit,
  demoData,
  validationErrors = []
}: ContractFormBaseProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { showUpgradeModalForModule } = useDemoAccess();

  // Initialize with demo data if provided
  useEffect(() => {
    if (demoData && Object.keys(formData).length === 0) {
      onFormDataChange(demoData);
    }
  }, [demoData, formData, onFormDataChange]);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Prepare stepper data
  const stepperSteps = steps.map((step, index) => ({
    title: step.title,
    description: step.description,
    status: (index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending') as 'completed' | 'current' | 'pending'
  }));

  const validateCurrentStep = () => {
    if (currentStepData.validation) {
      return currentStepData.validation(formData);
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {

    setIsLoading(true);
    try {
      if (onSave) {
        await onSave(formData);
        toast({
          title: "Draft Saved",
          description: "Your contract draft has been saved successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contract draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {

    // Validate all steps
    const allStepsValid = steps.every(step => !step.validation || step.validation(formData));
    if (!allStepsValid) {
      toast({
        title: "Validation Error",
        description: "Please complete all required information before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
        toast({
          title: "Contract Submitted",
          description: "Your contract has been submitted successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = currentStepData.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground">
              Complete all sections to finalize your {contractType} agreement
            </p>
          </div>
        </div>
        <Badge variant="outline">{contractType}</Badge>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Step {currentStep + 1} of {steps.length}: {currentStepData.title}
              </CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent>
          <Stepper steps={stepperSteps} orientation="horizontal" />
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Please address the following issues:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentStepData.icon className="h-5 w-5" />
            {currentStepData.title}
          </CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            data={formData}
            onChange={onFormDataChange}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  "Submitting..."
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Agreement
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}