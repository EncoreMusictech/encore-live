import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send, Mail, FileSignature, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { samplePDFs } from "./SamplePDFData";

interface ContractCustomizationProps {
  template: any;
  onBack: () => void;
  onSuccess: () => void;
}

const customizationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  counterparty_name: z.string().min(1, "Counterparty name is required"),
  recipient_email: z.string().email("Valid email required"),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  notes: z.string().optional(),
});

export function ContractCustomization({ template, onBack, onSuccess }: ContractCustomizationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [contractContent, setContractContent] = useState("");
  const [customFields, setCustomFields] = useState<{[key: string]: string}>({});
  const [showSendOptions, setShowSendOptions] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof customizationSchema>>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      title: template.template_name || "",
      counterparty_name: "",
      recipient_email: "",
      notes: "",
    },
  });

  useEffect(() => {
    loadTemplateContent();
  }, [template]);

  const loadTemplateContent = () => {
    const sampleData = samplePDFs.find(pdf => pdf.contractType === template.contract_type);
    if (sampleData) {
      setContractContent(sampleData.content);
      extractBracketedFields(sampleData.content);
    }
  };

  const extractBracketedFields = (content: string) => {
    const bracketedFields = content.match(/\[([^\]]+)\]/g) || [];
    const fields: {[key: string]: string} = {};
    
    bracketedFields.forEach(field => {
      const fieldName = field.replace(/[\[\]]/g, '');
      if (!fields[fieldName]) {
        fields[fieldName] = "";
      }
    });
    
    setCustomFields(fields);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setCustomFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const generateFinalContract = () => {
    let finalContent = contractContent;
    
    Object.entries(customFields).forEach(([fieldName, value]) => {
      const regex = new RegExp(`\\[${fieldName}\\]`, 'g');
      finalContent = finalContent.replace(regex, value || `[${fieldName}]`);
    });
    
    return finalContent;
  };

  const logContractChange = async (contractId: string, changeType: string, description: string, fieldName?: string, oldValue?: string, newValue?: string) => {
    try {
      await supabase
        .from('contract_change_logs')
        .insert({
          contract_id: contractId,
          user_id: 'placeholder-user-id', // This will be replaced with actual auth
          change_type: changeType,
          field_name: fieldName,
          old_value: oldValue,
          new_value: newValue,
          description: description
        });
    } catch (error) {
      console.error('Error logging change:', error);
    }
  };

  const handleSaveContract = async (values: z.infer<typeof customizationSchema>) => {
    setIsLoading(true);
    
    try {
      const finalContent = generateFinalContract();
      
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          title: values.title,
          counterparty_name: values.counterparty_name,
          contract_type: template.contract_type,
          start_date: values.start_date?.toISOString().split('T')[0] || null,
          end_date: values.end_date?.toISOString().split('T')[0] || null,
          notes: values.notes || null,
          recipient_email: values.recipient_email,
          contract_data: {
            template_id: template.id,
            custom_fields: customFields,
            final_content: finalContent
          },
          template_id: template.id,
          signature_status: 'draft',
          user_id: 'placeholder-user-id', // This will be replaced with actual auth
        })
        .select()
        .single();

      if (error) throw error;

      // Log contract creation
      await logContractChange(
        contract.id, 
        'contract_created', 
        `Contract created from template: ${template.template_name}`
      );

      toast({
        title: "Contract Saved",
        description: "Contract has been saved as draft successfully.",
      });
      
      setShowSendOptions(true);
    } catch (error) {
      console.error('Error saving contract:', error);
      toast({
        title: "Error",
        description: "Failed to save contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendForSignature = async (method: 'docusign' | 'email') => {
    setIsLoading(true);
    
    try {
      const formValues = form.getValues();
      
      if (method === 'docusign') {
        // DocuSign integration
        const { data, error } = await supabase.functions.invoke('docusign-send', {
          body: {
            contract_content: generateFinalContract(),
            recipient_email: formValues.recipient_email,
            recipient_name: formValues.counterparty_name,
            subject: formValues.title
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Sent via DocuSign",
          description: "Contract has been sent for signature via DocuSign.",
        });
      } else {
        // Email integration
        const { data, error } = await supabase.functions.invoke('send-contract-email', {
          body: {
            to: formValues.recipient_email,
            recipientName: formValues.counterparty_name,
            contractTitle: formValues.title,
            contractContent: generateFinalContract(),
            senderMessage: formValues.notes || "Please review and sign the attached contract."
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Sent via Email",
          description: "Contract has been sent to recipient's email.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error sending contract:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldLabel = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getFieldType = (fieldName: string) => {
    const lowerField = fieldName.toLowerCase();
    if (lowerField.includes('date')) return 'date';
    if (lowerField.includes('amount') || lowerField.includes('fee') || lowerField.includes('percentage')) return 'number';
    if (lowerField.includes('email')) return 'email';
    return 'text';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold">Customize Contract</h3>
          <p className="text-sm text-muted-foreground">{template.template_name}</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSaveContract)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>
              Basic information about this contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="Enter contract title"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="counterparty">Counterparty Name</Label>
                <Input
                  id="counterparty"
                  {...form.register("counterparty_name")}
                  placeholder="Name of the other party"
                />
                {form.formState.errors.counterparty_name && (
                  <p className="text-sm text-red-500">{form.formState.errors.counterparty_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_email">Recipient Email</Label>
              <Input
                id="recipient_email"
                type="email"
                {...form.register("recipient_email")}
                placeholder="Email address for sending contract"
              />
              {form.formState.errors.recipient_email && (
                <p className="text-sm text-red-500">{form.formState.errors.recipient_email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Additional notes or instructions..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Template Fields
            </CardTitle>
            <CardDescription>
              Fill in the specific details for your contract. Required fields are marked in the template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(customFields).map(([fieldName, value]) => (
                <div key={fieldName} className="space-y-2">
                  <Label htmlFor={fieldName}>
                    {getFieldLabel(fieldName)}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {fieldName}
                    </Badge>
                  </Label>
                  <Input
                    id={fieldName}
                    type={getFieldType(fieldName)}
                    value={value}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    placeholder={`Enter ${getFieldLabel(fieldName).toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contract Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Preview</CardTitle>
            <CardDescription>
              Preview of your customized contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-4 rounded-lg max-h-[400px] overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {generateFinalContract()}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          
          {!showSendOptions ? (
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Contract"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FileSignature className="h-4 w-4" />
                    DocuSign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send via DocuSign</DialogTitle>
                    <DialogDescription>
                      Send this contract for electronic signature via DocuSign
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The contract will be sent to <strong>{form.getValues('recipient_email')}</strong> for signature.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSendOptions(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSendForSignature('docusign')}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Send for Signature
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send via Email</DialogTitle>
                    <DialogDescription>
                      Send this contract directly to the recipient's email
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The contract will be sent to <strong>{form.getValues('recipient_email')}</strong> as a PDF attachment.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSendOptions(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSendForSignature('email')}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}