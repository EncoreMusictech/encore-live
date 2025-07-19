import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContractExecutionData {
  contract_execution_status?: 'draft' | 'sent' | 'signed' | 'executed' | 'expired';
  contract_sent_date?: Date;
  contract_signed_date?: Date;
  contract_executed_date?: Date;
  contract_expiry_date?: Date;
  signatory_name?: string;
  signatory_title?: string;
}

interface ContractExecutionFormProps {
  contractData?: ContractExecutionData;
  onContractChange: (data: ContractExecutionData) => void;
}

const executionStatuses = [
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'sent', label: 'Sent for Signature', color: 'default' },
  { value: 'signed', label: 'Signed', color: 'default' },
  { value: 'executed', label: 'Fully Executed', color: 'default' },
  { value: 'expired', label: 'Expired', color: 'destructive' },
];

export const ContractExecutionForm = ({ contractData, onContractChange }: ContractExecutionFormProps) => {
  const form = useForm({
    defaultValues: {
      contract_execution_status: contractData?.contract_execution_status || 'draft',
      contract_sent_date: contractData?.contract_sent_date || undefined,
      contract_signed_date: contractData?.contract_signed_date || undefined,
      contract_executed_date: contractData?.contract_executed_date || undefined,
      contract_expiry_date: contractData?.contract_expiry_date || undefined,
      signatory_name: contractData?.signatory_name || "",
      signatory_title: contractData?.signatory_title || "",
    },
    mode: "onChange"
  });

  const handleFormChange = (data: any) => {
    onContractChange({
      ...data,
      contract_sent_date: data.contract_sent_date,
      contract_signed_date: data.contract_signed_date,
      contract_executed_date: data.contract_executed_date,
      contract_expiry_date: data.contract_expiry_date,
    });
  };

  const currentStatus = form.watch('contract_execution_status');
  const statusConfig = executionStatuses.find(s => s.value === currentStatus);

  const DateField = ({ name, label, minDate }: { name: string; label: string; minDate?: Date }) => (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={minDate ? (date) => date < minDate : undefined}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Execution Tracking
          </CardTitle>
          <Badge variant={statusConfig?.color as any}>
            {statusConfig?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={form.handleSubmit(handleFormChange)} className="space-y-6">
            
            {/* Contract Status */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground border-b pb-2">Contract Status</h4>
              
              <FormField
                control={form.control}
                name="contract_execution_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Execution Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select execution status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {executionStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timeline Dates */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground border-b pb-2">Timeline</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <DateField name="contract_sent_date" label="Date Sent" />
                <DateField name="contract_expiry_date" label="Expiry Date" />
                <DateField name="contract_signed_date" label="Date Signed" />
                <DateField name="contract_executed_date" label="Date Executed" />
              </div>
            </div>

            {/* Signatory Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground border-b pb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Signatory Information
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="signatory_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signatory Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name of signatory" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signatory_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signatory Title</FormLabel>
                      <FormControl>
                        <Input placeholder="President, Manager, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
};