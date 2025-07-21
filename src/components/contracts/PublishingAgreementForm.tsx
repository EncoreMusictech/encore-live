import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CalendarIcon, 
  ArrowLeft, 
  Save, 
  FileText, 
  DollarSign, 
  Users, 
  Globe,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Timer,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { InterestedPartiesTable } from "./InterestedPartiesTable";
import { ScheduleWorksTable } from "./ScheduleWorksTable";
import { AgreementTypeTerms } from "./AgreementTypeTerms";

// Agreement type enum
export type AgreementType = 
  | "administration"
  | "co_publishing" 
  | "exclusive_songwriter"
  | "catalog_acquisition";

// Validation schemas for different agreement types
const sharedCoreSchema = z.object({
  agreement_id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  counterparty_name: z.string().min(1, "Counterparty name is required"),
  status: z.string().default("draft"),
  effective_date: z.date().optional(),
  end_date: z.date().optional(),
  territory: z.array(z.string()).default([]),
  governing_law: z.string().default(""),
  delivery_requirements: z.array(z.string()).default([]),
  approvals_required: z.boolean().default(false),
  approval_conditions: z.string().optional(),
  agreement_type: z.string().optional(),
});

const administrationSchema = sharedCoreSchema.extend({
  agreement_type: z.literal("administration"),
  admin_rights: z.array(z.string()).default([]),
  admin_fee_percentage: z.number().min(0).max(100).default(0),
  admin_controlled_share: z.number().min(0).max(100).default(0),
  approval_rights: z.string().default("pre_approved"),
  tail_period_months: z.number().min(0).default(0),
  reversion_conditions: z.string().optional(),
});

const coPublishingSchema = sharedCoreSchema.extend({
  agreement_type: z.literal("co_publishing"),
  publisher_share_percentage: z.number().min(0).max(100).default(50),
  writer_share_percentage: z.number().min(0).max(100).default(100),
  sync_revenue_split: z.number().min(0).max(100).default(50),
  print_revenue_split: z.number().min(0).max(100).default(50),
  mechanical_revenue_split: z.number().min(0).max(100).default(50),
  advance_amount: z.number().min(0).default(0),
  recoupable: z.boolean().default(true),
  exclusivity: z.boolean().default(false),
  delivery_commitment: z.number().min(0).default(0),
  option_periods: z.boolean().default(false),
});

const exclusiveSongwriterSchema = sharedCoreSchema.extend({
  agreement_type: z.literal("exclusive_songwriter"),
  exclusivity_period_start: z.date().optional(),
  exclusivity_period_end: z.date().optional(),
  advance_amount: z.number().min(0).default(0),
  delivery_requirement: z.number().min(0).default(0),
  recoupable: z.boolean().default(true),
  mechanical_royalty_rate: z.number().min(0).max(100).default(75),
  sync_royalty_rate: z.number().min(0).max(100).default(50),
  print_royalty_rate: z.number().min(0).max(100).default(50),
  renewal_options: z.boolean().default(false),
  exclusivity: z.literal(true),
});

const catalogAcquisitionSchema = sharedCoreSchema.extend({
  agreement_type: z.literal("catalog_acquisition"),
  acquisition_price: z.number().min(0).default(0),
  rights_acquired: z.string().default("100_percent"),
  royalty_override_to_seller: z.number().min(0).max(100).default(0),
  acquired_work_list_url: z.string().optional(),
  perpetual_rights: z.boolean().default(false),
  reversion_clause: z.string().optional(),
  tail_period_months: z.number().min(0).default(0),
  original_publisher_participation: z.string().optional(),
});

// Dynamic schema selector
const getSchemaForType = (type: AgreementType) => {
  switch (type) {
    case "administration":
      return administrationSchema;
    case "co_publishing":
      return coPublishingSchema;
    case "exclusive_songwriter":
      return exclusiveSongwriterSchema;
    case "catalog_acquisition":
      return catalogAcquisitionSchema;
    default:
      return sharedCoreSchema;
  }
};

interface PublishingAgreementFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

type FormStep = "type" | "basic" | "terms" | "parties" | "works" | "review";

export function PublishingAgreementForm({ onCancel, onSuccess }: PublishingAgreementFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>("type");
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [agreementType, setAgreementType] = useState<AgreementType | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const { createContract } = useContracts();
  const { toast } = useToast();
  const { incrementUsage } = useDemoAccess();

  // State for form values
  const [formData, setFormData] = useState({
    title: "",
    counterparty_name: "",
    status: "draft",
    effective_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    territory: [] as string[],
    governing_law: "",
    delivery_requirements: [] as string[],
    approvals_required: false,
    approval_conditions: "",
    agreement_type: agreementType,
  });

  // Dynamic form based on agreement type
  const currentSchema = agreementType ? getSchemaForType(agreementType) : sharedCoreSchema;
  
  const form = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: formData,
    mode: "onChange",
  });

  const steps: Array<{
    id: FormStep;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    { id: "type", label: "Agreement Type", icon: Briefcase, description: "Select agreement type" },
    { id: "basic", label: "Basic Info", icon: FileText, description: "Core agreement details" },
    { id: "terms", label: "Terms", icon: DollarSign, description: "Financial & legal terms" },
    { id: "parties", label: "Parties", icon: Users, description: "Interested parties" },
    { id: "works", label: "Works", icon: Globe, description: "Schedule of works" },
    { id: "review", label: "Review", icon: CheckCircle, description: "Final review" },
  ];

  const getProgress = () => {
    const completedCount = completedSteps.size + (currentStep === "review" ? 1 : 0);
    return (completedCount / steps.length) * 100;
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleTypeSelection = (type: AgreementType) => {
    setAgreementType(type);
    setFormData(prev => ({ ...prev, agreement_type: type }));
    form.setValue("agreement_type", type);
    setCompletedSteps(prev => new Set([...prev, "type"]));
    setCurrentStep("basic");
  };

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    
    try {
      const contractData = {
        title: values.title,
        counterparty_name: values.counterparty_name,
        contract_type: "publishing" as any,
        start_date: formData.effective_date?.toISOString().split('T')[0] || null,
        end_date: formData.end_date?.toISOString().split('T')[0] || null,
        contract_status: 'draft' as any,
        territories: values.territory || [],
        contract_data: {
          agreement_type: agreementType,
          governing_law: values.governing_law,
          delivery_requirements: values.delivery_requirements,
          approvals_required: values.approvals_required,
          approval_conditions: values.approval_conditions,
          ...values, // Include all type-specific fields
        }
      };

      const newContract = await createContract(contractData);
      
      if (newContract) {
        setContractId(newContract.id);
        setCompletedSteps(prev => new Set([...prev, "basic", "terms"]));
        setCurrentStep("parties");
        toast({
          title: "Agreement Created",
          description: "Now add interested parties to complete the setup",
        });
      }
    } catch (error) {
      console.error('Error creating agreement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = () => {
    incrementUsage('contractManagement');
    toast({
      title: "Publishing Agreement Complete",
      description: "Your agreement has been created successfully",
    });
    onSuccess();
  };

  const getAgreementTypeLabel = (type: AgreementType) => {
    const labels = {
      administration: "Administration Agreement",
      co_publishing: "Co-Publishing Agreement", 
      exclusive_songwriter: "Exclusive Songwriter Agreement",
      catalog_acquisition: "Catalog Acquisition Agreement",
    };
    return labels[type];
  };

  const territoryOptions = [
    "United States", "Canada", "United Kingdom", "European Union",
    "Japan", "Australia", "Mexico", "Brazil", "Worldwide"
  ];

  const deliveryOptions = [
    "Metadata", "Sound File", "Lyrics", "Work Registration", "Lead Sheets", "Masters"
  ];

  const adminRightsOptions = [
    "Sync", "Mechanical", "Print", "Digital", "Performance", "Grand Rights"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">
              {agreementType ? getAgreementTypeLabel(agreementType) : "Publishing Agreement"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Complete all sections to create your agreement
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Timer className="h-3 w-3" />
          Draft
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(getProgress())}% complete</span>
        </div>
        <Progress value={getProgress()} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-lg transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && !isCurrent && "bg-green-100 text-green-700"
                )}>
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2",
                    isCurrent && "border-primary-foreground",
                    isCompleted && "border-green-500",
                    !isCompleted && !isCurrent && "border-muted"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-border mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === "type" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Agreement Type</CardTitle>
            <CardDescription>
              Choose the type of publishing agreement to configure the appropriate fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  type: "administration" as AgreementType,
                  title: "Administration Agreement",
                  description: "Admin rights only, no ownership transfer",
                  features: ["Admin Fee", "Controlled Share", "Approval Rights"]
                },
                {
                  type: "co_publishing" as AgreementType,
                  title: "Co-Publishing Agreement", 
                  description: "Shared ownership and revenue",
                  features: ["Publisher Share", "Revenue Splits", "Advance"]
                },
                {
                  type: "exclusive_songwriter" as AgreementType,
                  title: "Exclusive Songwriter Agreement",
                  description: "Exclusive writing services",
                  features: ["Exclusivity", "Delivery Requirements", "Royalty Rates"]
                },
                {
                  type: "catalog_acquisition" as AgreementType,
                  title: "Catalog Acquisition Agreement",
                  description: "Purchase of existing catalog",
                  features: ["Acquisition Price", "Rights Transfer", "Perpetual Rights"]
                }
              ].map((option) => (
                <Card 
                  key={option.type}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent",
                    agreementType === option.type && "ring-2 ring-primary"
                  )}
                  onClick={() => handleTypeSelection(option.type)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {option.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "basic" && agreementType && (
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core agreement details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Agreement Title *</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    placeholder={`e.g., ${getAgreementTypeLabel(agreementType)} - Artist Name`}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="counterparty">Counterparty *</Label>
                  <Input
                    id="counterparty"
                    {...form.register("counterparty_name")}
                    placeholder="Publisher, Label, or Writer name"
                  />
                  {form.formState.errors.counterparty_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.counterparty_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Effective Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.effective_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.effective_date ? format(formData.effective_date, "PPP") : "Select effective date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.effective_date}
                        onSelect={(date) => {
                          setFormData(prev => ({ ...prev, effective_date: date }));
                          form.setValue("effective_date", date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End/Reversion Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? format(formData.end_date, "PPP") : "Perpetual or select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => {
                          setFormData(prev => ({ ...prev, end_date: date }));
                          form.setValue("end_date", date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="governing_law">Governing Law</Label>
                  <Select onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, governing_law: value }));
                    form.setValue("governing_law", value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select governing law" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_york">New York</SelectItem>
                      <SelectItem value="california">California</SelectItem>
                      <SelectItem value="tennessee">Tennessee</SelectItem>
                      <SelectItem value="united_kingdom">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Territory</Label>
                  <Select onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, territory: [value] }));
                    form.setValue("territory", [value]);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select territory" />
                    </SelectTrigger>
                    <SelectContent>
                      {territoryOptions.map((territory) => (
                        <SelectItem key={territory} value={territory}>{territory}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delivery Requirements</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {deliveryOptions.map((requirement) => (
                    <div key={requirement} className="flex items-center space-x-2">
                      <Checkbox
                        id={requirement}
                        onCheckedChange={(checked) => {
                          const current = formData.delivery_requirements || [];
                          const newRequirements = checked 
                            ? [...current, requirement]
                            : current.filter(r => r !== requirement);
                          setFormData(prev => ({ ...prev, delivery_requirements: newRequirements }));
                          form.setValue("delivery_requirements", newRequirements);
                        }}
                      />
                      <Label htmlFor={requirement} className="text-sm">{requirement}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="approvals_required"
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ ...prev, approvals_required: !!checked }));
                      form.setValue("approvals_required", !!checked);
                    }}
                  />
                  <Label htmlFor="approvals_required">Approvals Required</Label>
                </div>
                {formData.approvals_required && (
                  <Textarea
                    {...form.register("approval_conditions")}
                    placeholder="Specify approval conditions (e.g., alcohol syncs, political content)"
                    className="mt-2"
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, approval_conditions: e.target.value }));
                      form.setValue("approval_conditions", e.target.value);
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Creating..." : "Create & Continue"}
            </Button>
          </div>
        </form>
      )}

      {currentStep === "terms" && agreementType && (
        <div className="space-y-6">
          <AgreementTypeTerms 
            agreementType={agreementType}
            formData={formData}
            onUpdate={(field, value) => {
              setFormData(prev => ({ ...prev, [field]: value }));
              // Use any to bypass strict typing for dynamic fields
              (form.setValue as any)(field, value);
            }}
          />
          
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
            <Button onClick={handleNext} className="gap-2">
              Next: Add Parties
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === "parties" && contractId && (
        <div className="space-y-6">
          <InterestedPartiesTable contractId={contractId} />
          
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
            <Button onClick={handleNext} className="gap-2">
              Next: Add Works
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === "works" && contractId && (
        <div className="space-y-6">
          <ScheduleWorksTable contractId={contractId} />
          
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
            <Button onClick={handleNext} className="gap-2">
              Next: Review
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === "review" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Review</CardTitle>
              <CardDescription>
                Review your {agreementType && getAgreementTypeLabel(agreementType)} details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold">Agreement Ready</h3>
                <p className="text-muted-foreground">
                  Your publishing agreement has been created with all necessary components
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
            <Button onClick={handleFinalize} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Complete Agreement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}