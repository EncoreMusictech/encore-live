import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Music, Disc, Truck, FileText, Save, Eye } from "lucide-react";

// Import sub-components
import { ArtistAgreementFormBasicInfo } from "./forms/ArtistAgreementFormBasicInfo";
import { ArtistAgreementFormTerms } from "./forms/ArtistAgreementFormTerms";
import { ArtistAgreementFormAdditionalTerms } from "./forms/ArtistAgreementFormAdditionalTerms";
import { ArtistAgreementFormParties } from "./forms/ArtistAgreementFormParties";
import { ArtistAgreementFormWorks } from "./forms/ArtistAgreementFormWorks";
import { ArtistAgreementFormReview } from "./forms/ArtistAgreementFormReview";

export interface ArtistAgreementFormData {
  // Basic Info
  artistName: string;
  legalName: string;
  stageName: string;
  agreementType: string;
  effectiveDate: string;
  expirationDate: string;
  territory: string;
  
  // Terms
  recordingCommitment: string;
  advanceAmount: string;
  royaltyRate: string;
  mechanicalRate: string;
  performanceRoyalty: string;
  
  // Additional Terms
  exclusivity: boolean;
  keyPersonClause: string;
  leavingMemberClause: string;
  touringSplit: string;
  merchandisingSplit: string;
  
  // Parties
  artistAddress: string;
  artistPhone: string;
  artistEmail: string;
  labelName: string;
  labelAddress: string;
  labelContact: string;
  
  // Works
  selectedWorks: any[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  status: string;
}

const defaultFormData: ArtistAgreementFormData = {
  artistName: "",
  legalName: "",
  stageName: "",
  agreementType: "recording",
  effectiveDate: "",
  expirationDate: "",
  territory: "worldwide",
  
  recordingCommitment: "",
  advanceAmount: "",
  royaltyRate: "",
  mechanicalRate: "",
  performanceRoyalty: "",
  
  exclusivity: true,
  keyPersonClause: "",
  leavingMemberClause: "",
  touringSplit: "",
  merchandisingSplit: "",
  
  artistAddress: "",
  artistPhone: "",
  artistEmail: "",
  labelName: "",
  labelAddress: "",
  labelContact: "",
  
  selectedWorks: [],
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "draft"
};

const steps = [
  { id: "basic", title: "Basic Info", icon: Music, description: "Artist and agreement details" },
  { id: "terms", title: "Terms", icon: FileText, description: "Recording and financial terms" },
  { id: "additional", title: "Additional", icon: Disc, description: "Additional clauses and terms" },
  { id: "parties", title: "Parties", icon: Truck, description: "Contact information" },
  { id: "works", title: "Works", icon: Music, description: "Select recording works" },
  { id: "review", title: "Review", icon: Eye, description: "Review and finalize" }
];

export const ArtistAgreementForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ArtistAgreementFormData>(defaultFormData);
  const [isLoading, setIsLoading] = useState(false);

  const updateFormData = (updates: Partial<ArtistAgreementFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }));
  };

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Basic Info
        return !!(formData.artistName && formData.legalName && formData.agreementType);
      case 1: // Terms
        return !!(formData.recordingCommitment && formData.royaltyRate);
      case 2: // Additional Terms
        return true; // Optional fields
      case 3: // Parties
        return !!(formData.artistEmail && formData.labelName);
      case 4: // Works
        return formData.selectedWorks.length > 0;
      case 5: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement save to database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Agreement Saved",
        description: "Artist agreement has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save the agreement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement submit to database
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast({
        title: "Agreement Submitted",
        description: "Artist agreement has been submitted for review.",
      });
      
      navigate("/contract-management");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit the agreement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ArtistAgreementFormBasicInfo
            data={formData}
            onChange={updateFormData}
          />
        );
      case 1:
        return (
          <ArtistAgreementFormTerms
            data={formData}
            onChange={updateFormData}
          />
        );
      case 2:
        return (
          <ArtistAgreementFormAdditionalTerms
            data={formData}
            onChange={updateFormData}
          />
        );
      case 3:
        return (
          <ArtistAgreementFormParties
            data={formData}
            onChange={updateFormData}
          />
        );
      case 4:
        return (
          <ArtistAgreementFormWorks
            data={formData}
            onChange={updateFormData}
          />
        );
      case 5:
        return (
          <ArtistAgreementFormReview
            data={formData}
            onChange={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/contract-management")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contracts
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Artist Agreement</h1>
          <p className="text-muted-foreground">
            Create a comprehensive recording or publishing agreement
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant="outline">{formData.status}</Badge>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </CardTitle>
              <CardDescription>
                {steps[currentStep].description}
              </CardDescription>
            </div>
            <Badge variant="secondary">{Math.round(progress)}% Complete</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center text-xs ${
                    index <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      index <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className="hidden md:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !validateStep(currentStep)}
                >
                  Submit Agreement
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};