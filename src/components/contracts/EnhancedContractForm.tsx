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
import { CalendarIcon, ArrowLeft, Save, Upload, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { useDemoAccess } from "@/hooks/useDemoAccess";
import { InterestedPartiesTable } from "./InterestedPartiesTable";
import { ScheduleWorksTable } from "./ScheduleWorksTable";

const enhancedContractSchema = z.object({
  title: z.string().min(1, "Title is required"),
  counterparty_name: z.string().min(1, "Counterparty name is required"),
  original_publisher: z.string().optional(),
  administrator: z.string().optional(),
  territories: z.array(z.string()).default([]),
  distribution_cycle: z.string().default("quarterly"),
  statement_delivery: z.string().default("combined"),
  advance_amount: z.number().default(0),
  commission_percentage: z.number().default(0),
  rate_reduction_percentage: z.number().default(0),
  rate_reduction_amount: z.number().default(0),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_address: z.string().optional(),
  notes: z.string().optional(),
});

interface EnhancedContractFormProps {
  contractType: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EnhancedContractForm({ contractType, onCancel, onSuccess }: EnhancedContractFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState("basic");
  const [contractId, setContractId] = useState<string | null>(null);
  const { createContract } = useContracts();
  const { toast } = useToast();
  const { incrementUsage } = useDemoAccess();

  const form = useForm<z.infer<typeof enhancedContractSchema>>({
    resolver: zodResolver(enhancedContractSchema),
    defaultValues: {
      title: "",
      counterparty_name: "",
      territories: [],
      distribution_cycle: "quarterly",
      statement_delivery: "combined",
      advance_amount: 0,
      commission_percentage: 0,
      rate_reduction_percentage: 0,
      rate_reduction_amount: 0,
    },
  });

  const handleSubmit = async (values: z.infer<typeof enhancedContractSchema>) => {
    setIsLoading(true);
    
    try {
      const contractData = {
        title: values.title,
        counterparty_name: values.counterparty_name,
        contract_type: contractType as any,
        start_date: startDate?.toISOString().split('T')[0] || null,
        end_date: endDate?.toISOString().split('T')[0] || null,
        contract_status: 'draft' as any,
        original_publisher: values.original_publisher || null,
        administrator: values.administrator || null,
        territories: values.territories || [],
        distribution_cycle: values.distribution_cycle,
        statement_delivery: values.statement_delivery,
        advance_amount: values.advance_amount,
        commission_percentage: values.commission_percentage,
        rate_reduction_percentage: values.rate_reduction_percentage,
        rate_reduction_amount: values.rate_reduction_amount,
        contact_name: values.contact_name || null,
        contact_phone: values.contact_phone || null,
        contact_address: values.contact_address || null,
        notes: values.notes || null,
      };

      const newContract = await createContract(contractData);
      
      if (newContract) {
        setContractId(newContract.id);
        setActiveTab("parties");
        toast({
          title: "Contract Created",
          description: "Now add interested parties to complete the setup",
        });
      }
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = () => {
    // Increment demo usage when contract is finalized
    incrementUsage('contractManagement');
    
    toast({
      title: "Contract Setup Complete",
      description: "Your contract has been created with all parties and works",
    });
    onSuccess();
  };

  const territoryOptions = [
    "United States", "Canada", "United Kingdom", "European Union", 
    "Japan", "Australia", "Mexico", "Brazil", "Worldwide"
  ];

  const getFormTitle = (type: string) => {
    switch (type) {
      case 'publishing':
        return 'Publishing Agreement Setup';
      case 'artist':
        return 'Artist Agreement Setup';
      case 'producer':
        return 'Producer Agreement Setup';
      case 'sync':
        return 'Sync License Setup';
      case 'distribution':
        return 'Distribution Agreement Setup';
      default:
        return 'Contract Setup';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{getFormTitle(contractType)}</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="parties" disabled={!contractId} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Interested Parties
          </TabsTrigger>
          <TabsTrigger value="works" disabled={!contractId} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Schedule of Works
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Agreement Information */}
            <Card>
              <CardHeader>
                <CardTitle>Agreement Information</CardTitle>
                <CardDescription>
                  Define contract scope, ownership, and financial terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Contract Title</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="e.g., Publishing Deal - Artist Name"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="counterparty">Counterparty</Label>
                    <Input
                      id="counterparty"
                      {...form.register("counterparty_name")}
                      placeholder="Label, Publisher, or Artist name"
                    />
                    {form.formState.errors.counterparty_name && (
                      <p className="text-sm text-red-500">{form.formState.errors.counterparty_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="original_publisher">Original Publisher</Label>
                    <Input
                      id="original_publisher"
                      {...form.register("original_publisher")}
                      placeholder="Original publishing entity"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="administrator">Administrator</Label>
                    <Input
                      id="administrator"
                      {...form.register("administrator")}
                      placeholder="Contract administrator"
                    />
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distribution_cycle">Distribution Cycle</Label>
                    <Select onValueChange={(value) => form.setValue("distribution_cycle", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cycle" />
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
                    <Label htmlFor="statement_delivery">Statement Delivery</Label>
                    <Select onValueChange={(value) => form.setValue("statement_delivery", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery method" />
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

            {/* Financial Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Terms</CardTitle>
                <CardDescription>
                  Advance, commission, and rate configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advance_amount">Advance Amount ($)</Label>
                    <Input
                      id="advance_amount"
                      type="number"
                      {...form.register("advance_amount", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="commission_percentage">Commission (%)</Label>
                    <Input
                      id="commission_percentage"
                      type="number"
                      {...form.register("commission_percentage", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate_reduction_percentage">Rate Reduction (%)</Label>
                    <Input
                      id="rate_reduction_percentage"
                      type="number"
                      {...form.register("rate_reduction_percentage", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rate_reduction_amount">Rate Reduction ($)</Label>
                    <Input
                      id="rate_reduction_amount"
                      type="number"
                      {...form.register("rate_reduction_amount", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Primary contact details for contract communications
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
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      {...form.register("contact_phone")}
                      placeholder="Phone number"
                    />
                  </div>
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

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? "Creating..." : "Create Contract & Add Parties"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="parties">
          {contractId && (
            <div className="space-y-6">
              <InterestedPartiesTable contractId={contractId} />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                  Back
                </Button>
                <Button onClick={() => setActiveTab("works")} className="gap-2">
                  Continue to Works
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="works">
          {contractId && (
            <div className="space-y-6">
              <ScheduleWorksTable contractId={contractId} />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setActiveTab("parties")}>
                  Back
                </Button>
                <Button onClick={handleFinalize} className="gap-2">
                  <Save className="h-4 w-4" />
                  Complete Contract Setup
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}