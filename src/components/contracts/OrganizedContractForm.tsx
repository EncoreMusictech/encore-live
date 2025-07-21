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
  Timer
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { useDemoAccess } from "@/hooks/useDemoAccess";

// Enhanced validation schema with progressive steps
const contractSchemas = {
  basic: z.object({
    title: z.string().min(1, "Title is required"),
    counterparty_name: z.string().min(1, "Counterparty name is required"),
    contract_type: z.string().min(1, "Contract type is required"),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
  }),
  
  financial: z.object({
    advance_amount: z.number().min(0, "Advance must be positive").default(0),
    commission_percentage: z.number().min(0).max(100, "Commission must be 0-100%").default(0),
    rate_reduction_percentage: z.number().min(0).max(100, "Rate reduction must be 0-100%").default(0),
    currency: z.string().default("USD"),
    payment_schedule: z.string().default("quarterly"),
  }),
  
  terms: z.object({
    territories: z.array(z.string()).default([]),
    exclusive_rights: z.boolean().default(false),
    distribution_cycle: z.string().default("quarterly"),
    statement_delivery: z.string().default("combined"),
    renewal_option: z.boolean().default(false),
  }),
  
  contact: z.object({
    contact_name: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
    contact_address: z.string().optional(),
    notes: z.string().optional(),
  }),
};

const fullSchema = contractSchemas.basic
  .merge(contractSchemas.financial)
  .merge(contractSchemas.terms)
  .merge(contractSchemas.contact);

interface OrganizedContractFormProps {
  contractType: string;
  onCancel: () => void;
  onSuccess: () => void;
}

type FormStep = "basic" | "financial" | "terms" | "contact" | "review";

export function OrganizedContractForm({ contractType, onCancel, onSuccess }: OrganizedContractFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>("basic");
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { createContract } = useContracts();
  const { toast } = useToast();
  const { incrementUsage } = useDemoAccess();

  const form = useForm<z.infer<typeof fullSchema>>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      title: "",
      counterparty_name: "",
      contract_type: contractType,
      advance_amount: 0,
      commission_percentage: 0,
      rate_reduction_percentage: 0,
      currency: "USD",
      payment_schedule: "quarterly",
      territories: [],
      exclusive_rights: false,
      distribution_cycle: "quarterly",
      statement_delivery: "combined",
      renewal_option: false,
    },
    mode: "onChange",
  });

  const steps: Array<{
    id: FormStep;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    { id: "basic", label: "Basic Info", icon: FileText, description: "Contract fundamentals" },
    { id: "financial", label: "Financial", icon: DollarSign, description: "Money terms" },
    { id: "terms", label: "Terms", icon: Globe, description: "Rights & territories" },
    { id: "contact", label: "Contact", icon: Users, description: "Communication details" },
    { id: "review", label: "Review", icon: CheckCircle, description: "Final review" },
  ];

  const getStepValidation = (step: FormStep) => {
    const values = form.getValues();
    switch (step) {
      case "basic":
        return contractSchemas.basic.safeParse({ 
          ...values, 
          start_date: startDate, 
          end_date: endDate 
        });
      case "financial":
        return contractSchemas.financial.safeParse(values);
      case "terms":
        return contractSchemas.terms.safeParse(values);
      case "contact":
        return contractSchemas.contact.safeParse(values);
      default:
        return { success: true };
    }
  };

  const isStepValid = (step: FormStep) => {
    if (step === "review") return true;
    return getStepValidation(step).success;
  };

  const getProgress = () => {
    const validSteps = steps.filter(step => 
      step.id === "review" || isStepValid(step.id)
    ).length;
    return (validSteps / steps.length) * 100;
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      if (isStepValid(currentStep)) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setCurrentStep(steps[currentIndex + 1].id);
      } else {
        toast({
          title: "Validation Error",
          description: "Please complete all required fields before proceeding",
          variant: "destructive",
        });
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleStepClick = (step: FormStep) => {
    const stepIndex = steps.findIndex(s => s.id === step);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    // Allow going back to any step, or forward if all previous steps are valid
    if (stepIndex <= currentIndex || 
        steps.slice(0, stepIndex).every(s => s.id === "review" || isStepValid(s.id))) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async (values: z.infer<typeof fullSchema>) => {
    setIsLoading(true);
    
    try {
      const contractData = {
        title: values.title,
        counterparty_name: values.counterparty_name,
        contract_type: contractType as any,
        start_date: startDate?.toISOString().split('T')[0] || null,
        end_date: endDate?.toISOString().split('T')[0] || null,
        contract_status: 'draft' as any,
        advance_amount: values.advance_amount,
        commission_percentage: values.commission_percentage,
        rate_reduction_percentage: values.rate_reduction_percentage,
        territories: values.territories,
        distribution_cycle: values.distribution_cycle,
        statement_delivery: values.statement_delivery,
        contact_name: values.contact_name || null,
        contact_phone: values.contact_phone || null,
        contact_address: values.contact_address || null,
        notes: values.notes || null,
        contract_data: {
          currency: values.currency,
          payment_schedule: values.payment_schedule,
          exclusive_rights: values.exclusive_rights,
          renewal_option: values.renewal_option,
          contact_email: values.contact_email,
        }
      };

      await createContract(contractData);
      incrementUsage('contractManagement');
      
      toast({
        title: "Contract Created",
        description: "Your contract has been successfully created",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: "Failed to create contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      publishing: "Publishing Agreement",
      artist: "Artist Agreement", 
      producer: "Producer Agreement",
      sync: "Sync License",
      distribution: "Distribution Agreement",
    };
    return labels[type] || "Contract";
  };

  const territoryOptions = [
    "United States", "Canada", "United Kingdom", "European Union",
    "Japan", "Australia", "Mexico", "Brazil", "Worldwide"
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
            <h3 className="text-lg font-semibold">{getContractTypeLabel(contractType)}</h3>
            <p className="text-sm text-muted-foreground">
              Complete all sections to create your contract
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
            const isValid = isStepValid(step.id);
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isValid && step.id !== currentStep && !isCompleted}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-lg transition-colors",
                    isCurrent && "bg-primary text-primary-foreground",
                    isCompleted && !isCurrent && "bg-green-100 text-green-700",
                    !isValid && !isCurrent && !isCompleted && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2",
                    isCurrent && "border-primary-foreground",
                    isCompleted && "border-green-500",
                    !isValid && !isCurrent && "border-muted"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : !isValid && step.id !== currentStep ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-border mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Step Content */}
        {currentStep === "basic" && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential contract details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Contract Title *</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    placeholder="e.g., Publishing Deal - Artist Name"
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
                    placeholder="Label, Publisher, or Artist name"
                  />
                  {form.formState.errors.counterparty_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.counterparty_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {endDate && startDate && endDate <= startDate && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    End date must be after start date
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === "financial" && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Terms</CardTitle>
              <CardDescription>
                Advance, commission, and payment configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="advance_amount">Advance Amount</Label>
                  <Input
                    id="advance_amount"
                    type="number"
                    min="0"
                    {...form.register("advance_amount", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="commission_percentage">Commission (%)</Label>
                  <Input
                    id="commission_percentage"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register("commission_percentage", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={form.watch("currency")} 
                    onValueChange={(value) => form.setValue("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_schedule">Payment Schedule</Label>
                  <Select 
                    value={form.watch("payment_schedule")} 
                    onValueChange={(value) => form.setValue("payment_schedule", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate_reduction_percentage">Rate Reduction (%)</Label>
                  <Input
                    id="rate_reduction_percentage"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register("rate_reduction_percentage", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "terms" && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Terms</CardTitle>
              <CardDescription>
                Rights, territories, and operational terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Territories</Label>
                <Select 
                  value={form.watch("territories")?.[0] || ""} 
                  onValueChange={(value) => form.setValue("territories", [value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select territory" />
                  </SelectTrigger>
                  <SelectContent>
                    {territoryOptions.map(territory => (
                      <SelectItem key={territory} value={territory}>
                        {territory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Distribution Cycle</Label>
                  <Select 
                    value={form.watch("distribution_cycle")} 
                    onValueChange={(value) => form.setValue("distribution_cycle", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statement Delivery</Label>
                  <Select 
                    value={form.watch("statement_delivery")} 
                    onValueChange={(value) => form.setValue("statement_delivery", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="combined">Combined</SelectItem>
                      <SelectItem value="separate">Separate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "contact" && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Communication details and additional notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    {...form.register("contact_name")}
                    placeholder="Primary contact person"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    {...form.register("contact_email")}
                    placeholder="contact@company.com"
                  />
                  {form.formState.errors.contact_email && (
                    <p className="text-sm text-destructive">{form.formState.errors.contact_email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  {...form.register("contact_phone")}
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_address">Contact Address</Label>
                <Textarea
                  id="contact_address"
                  {...form.register("contact_address")}
                  placeholder="Full address"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Additional notes or comments..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "review" && (
          <Card>
            <CardHeader>
              <CardTitle>Review Contract</CardTitle>
              <CardDescription>
                Review all details before creating the contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary sections */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Basic Information</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Title:</strong> {form.watch("title")}</p>
                    <p><strong>Counterparty:</strong> {form.watch("counterparty_name")}</p>
                    <p><strong>Type:</strong> {getContractTypeLabel(contractType)}</p>
                    {startDate && <p><strong>Start:</strong> {format(startDate, "PPP")}</p>}
                    {endDate && <p><strong>End:</strong> {format(endDate, "PPP")}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Financial Terms</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Advance:</strong> {form.watch("currency")} {form.watch("advance_amount")?.toLocaleString()}</p>
                    <p><strong>Commission:</strong> {form.watch("commission_percentage")}%</p>
                    <p><strong>Payment:</strong> {form.watch("payment_schedule")}</p>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ready to create contract. You'll be able to add interested parties and works after creation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === "basic" ? onCancel : handlePrevious}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === "basic" ? "Cancel" : "Previous"}
          </Button>
          
          {currentStep === "review" ? (
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Creating..." : "Create Contract"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}