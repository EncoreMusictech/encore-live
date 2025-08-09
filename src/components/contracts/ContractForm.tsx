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
import { CalendarIcon, ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PublishingForm } from "./forms/PublishingForm";
import { ArtistForm } from "./forms/ArtistForm";
import { ProducerForm } from "./forms/ProducerForm";
import { SyncForm } from "./forms/SyncForm";
import { DistributionForm } from "./forms/DistributionForm";
import { useAuth } from "@/hooks/useAuth";
import { useDemoAccess } from "@/hooks/useDemoAccess";

const baseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  counterparty_name: z.string().min(1, "Counterparty name is required"),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  notes: z.string().optional(),
});

interface ContractFormProps {
  contractType: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ContractForm({ contractType, onCancel, onSuccess }: ContractFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [contractData, setContractData] = useState({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAccess, incrementUsage, showUpgradeModalForModule, isDemo } = useDemoAccess();

  const form = useForm<z.infer<typeof baseSchema>>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      title: "",
      counterparty_name: "",
      notes: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof baseSchema>) => {
    setIsLoading(true);
    
    // Demo gating: only 1 submission in demo
    if (!canAccess('contractManagement')) {
      showUpgradeModalForModule('contractManagement');
      toast({ title: 'Demo limit reached', description: 'Sign up to create more contracts.' });
      setIsLoading(false);
      return;
    }
    try {
      const { error } = await supabase
        .from('contracts')
        .insert({
          title: values.title,
          counterparty_name: values.counterparty_name,
          contract_type: contractType as any,
          start_date: startDate?.toISOString().split('T')[0] || null,
          end_date: endDate?.toISOString().split('T')[0] || null,
          notes: values.notes || null,
          contract_data: contractData,
          user_id: user?.id,
        });

      if (error) {
        console.error('Error creating contract:', error);
        toast({
          title: "Error",
          description: "Failed to create contract",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Contract created successfully",
      });

      if (isDemo) {
        incrementUsage('contractManagement');
        showUpgradeModalForModule('contractManagement');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFormTitle = (type: string) => {
    switch (type) {
      case 'publishing':
        return 'Publishing Agreement';
      case 'artist':
        return 'Artist Agreement';
      case 'producer':
        return 'Producer Agreement';
      case 'sync':
        return 'Sync License';
      case 'distribution':
        return 'Distribution Agreement';
      default:
        return 'Contract';
    }
  };

  const renderSpecificForm = () => {
    switch (contractType) {
      case 'publishing':
        return <PublishingForm data={contractData} onChange={setContractData} />;
      case 'artist':
        return <ArtistForm data={contractData} onChange={setContractData} />;
      case 'producer':
        return <ProducerForm data={contractData} onChange={setContractData} />;
      case 'sync':
        return <SyncForm data={contractData} onChange={setContractData} />;
      case 'distribution':
        return <DistributionForm data={contractData} onChange={setContractData} />;
      default:
        return null;
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

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Essential contract details and parties involved
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
                      className="pointer-events-auto"
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
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
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

        {/* Contract-Specific Form */}
        {renderSpecificForm()}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? "Creating..." : "Create Contract"}
          </Button>
        </div>
      </form>
    </div>
  );
}