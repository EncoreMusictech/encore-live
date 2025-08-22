import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface ContractField {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  category: string;
}

interface CustomizeContractFormProps {
  template: {
    id: string;
    title: string;
    contract_type: string;
    template_data?: {
      fields: ContractField[];
      clauses?: Record<string, string>;
    };
  };
  onBack: () => void;
  onSave?: (contractData: any) => void;
}

export const CustomizeContractForm: React.FC<CustomizeContractFormProps> = ({
  template,
  onBack,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  // Single-view form; preview removed per updated UX
  const fields = template.template_data?.fields || [];

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSave = async () => {
    // Validate required fields (robust to non-string values)
    const missingFields = fields
      .filter(field => {
        if (!field.required) return false;
        const val = formData[field.id];
        if (val === undefined || val === null) return true;
        if (typeof val === "string") return val.trim() === "";
        return false;
      })
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    // Ensure user is authenticated for RLS-enabled insert
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to save contracts.",
        variant: "destructive",
      });
      return;
    }

    // Map UI types to DB enum values
    const mappedType = (
      template.contract_type === 'artist_recording'
        ? 'artist'
        : (template.contract_type === 'licensing' ? 'sync' : template.contract_type)
    ) as 'publishing' | 'artist' | 'producer' | 'sync' | 'distribution';

    const title = (formData.contract_title && String(formData.contract_title).trim()) || template.title || 'Untitled Contract';
    const counterparty = (formData.counterparty_name && String(formData.counterparty_name).trim()) || 'Unknown Counterparty';

    const insertData = {
      user_id: userData.user.id,
      title,
      counterparty_name: counterparty,
      contract_type: mappedType,
      contract_status: 'draft' as const,
      template_id: template.id,
      contract_data: formData,
      recipient_email: formData.recipient_email || null,
      start_date: formData.start_date || formData.effective_date || null,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
    };

    const { data: inserted, error } = await supabase
      .from('contracts')
      .insert(insertData)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error saving contract:', error);
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Contract saved', description: 'Saved to My Contracts.' });

    if (onSave) {
      onSave(inserted ?? insertData);
    }
  };

  const renderFieldInput = (field: ContractField) => {
    const value = formData[field.id] || '';
    
    switch (field.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(v) => handleFieldChange(field.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ContractField[]>);

  const generatePreviewText = () => {
    const clauses = template.template_data?.clauses || {};
    return fields.map((field) => {
      const clause = clauses[field.id] || `${field.label}: {{${field.id}}}`;
      return clause.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
        const val = formData[key];
        if (val !== undefined && val !== "") return String(val);
        return `[${field.label}]`;
      });
    }).join("\n\n");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Customize Contract
          </Button>
          <div>
            <h1 className="text-xl font-bold">{template.title}</h1>
            <p className="text-sm text-muted-foreground">
              Fill in the specific details for your contract. Required fields are marked in the template.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2"></div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Form inputs */}
            <div className="space-y-6">
              {/* Contract Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Publishing Administration Agreement Details</CardTitle>
                  <p className="text-sm text-muted-foreground">Complete contract information for the Publishing Administration Agreement</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Contract Info */}
                  <div>
                    <h4 className="text-md font-semibold mb-3">Basic Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Effective Date <span className="text-destructive">*</span></Label>
                        <Input
                          type="date"
                          value={formData.effective_date || ''}
                          onChange={(e) => handleFieldChange('effective_date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contract Title</Label>
                        <Input
                          value={formData.contract_title || template.title}
                          onChange={(e) => handleFieldChange('contract_title', e.target.value)}
                          placeholder="Publishing Administration Agreement"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Writer Information */}
                  <div>
                    <h4 className="text-md font-semibold mb-3">Writer Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Writer Legal Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={formData.writer_legal_name || ''}
                          onChange={(e) => handleFieldChange('writer_legal_name', e.target.value)}
                          placeholder="Legal name of writer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IPI/CAE Number</Label>
                        <Input
                          value={formData.ipi_cae || ''}
                          onChange={(e) => handleFieldChange('ipi_cae', e.target.value)}
                          placeholder="IPI or CAE number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PRO Affiliation</Label>
                        <Select value={formData.pro_affiliation || ''} onValueChange={(v) => handleFieldChange('pro_affiliation', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select PRO" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASCAP">ASCAP</SelectItem>
                            <SelectItem value="BMI">BMI</SelectItem>
                            <SelectItem value="SESAC">SESAC</SelectItem>
                            <SelectItem value="GMR">GMR</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Writer Address</Label>
                        <Textarea
                          value={formData.company_address || ''}
                          onChange={(e) => handleFieldChange('company_address', e.target.value)}
                          placeholder="Writer's address"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Publisher/Administrator Information */}
                  <div>
                    <h4 className="text-md font-semibold mb-3">Publisher/Administrator Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Publisher Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={formData.publisher_name || ''}
                          onChange={(e) => handleFieldChange('publisher_name', e.target.value)}
                          placeholder="Publisher/Administrator name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Publisher Address</Label>
                        <Textarea
                          value={formData.publisher_address || ''}
                          onChange={(e) => handleFieldChange('publisher_address', e.target.value)}
                          placeholder="Publisher's address"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Representative Name</Label>
                        <Input
                          value={formData.company_representative_name || ''}
                          onChange={(e) => handleFieldChange('company_representative_name', e.target.value)}
                          placeholder="Representative name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Representative Title</Label>
                        <Input
                          value={formData.company_representative_title || ''}
                          onChange={(e) => handleFieldChange('company_representative_title', e.target.value)}
                          placeholder="Representative title"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Agreement Terms */}
                  <div>
                    <h4 className="text-md font-semibold mb-3">Agreement Terms</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Term (Years) <span className="text-destructive">*</span></Label>
                        <Input
                          type="number"
                          value={formData.term_years || ''}
                          onChange={(e) => handleFieldChange('term_years', e.target.value)}
                          placeholder="Number of years"
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Option Periods</Label>
                        <Input
                          type="number"
                          value={formData.option_periods_count || ''}
                          onChange={(e) => handleFieldChange('option_periods_count', e.target.value)}
                          placeholder="Number of option periods"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Territory</Label>
                        <Select value={formData.territory || ''} onValueChange={(v) => handleFieldChange('territory', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select territory" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Worldwide">Worldwide</SelectItem>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="North America">North America</SelectItem>
                            <SelectItem value="Europe">Europe</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Financial Terms */}
                  <div>
                    <h4 className="text-md font-semibold mb-3">Financial Terms</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Advance Amount ($)</Label>
                        <Input
                          type="number"
                          value={formData.advance_amount || ''}
                          onChange={(e) => handleFieldChange('advance_amount', e.target.value)}
                          placeholder="0"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Administration Fee (%)</Label>
                        <Input
                          type="number"
                          value={formData.admin_fee_percent || ''}
                          onChange={(e) => handleFieldChange('admin_fee_percent', e.target.value)}
                          placeholder="15"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={formData.payment_method || ''} onValueChange={(v) => handleFieldChange('payment_method', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                            <SelectItem value="ACH">ACH</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Accounting Frequency</Label>
                        <Select value={formData.accounting_frequency || ''} onValueChange={(v) => handleFieldChange('accounting_frequency', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                            <SelectItem value="Semi-annually">Semi-annually</SelectItem>
                            <SelectItem value="Annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Invoice Due Days</Label>
                        <Input
                          type="number"
                          value={formData.invoice_due_days || ''}
                          onChange={(e) => handleFieldChange('invoice_due_days', e.target.value)}
                          placeholder="90"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Legal Terms */}
                  <div>
                    <h4 className="text-md font-semibold mb-3">Legal Terms</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Governing Law</Label>
                        <Select value={formData.governing_law || ''} onValueChange={(v) => handleFieldChange('governing_law', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select governing law" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New York">New York</SelectItem>
                            <SelectItem value="California">California</SelectItem>
                            <SelectItem value="Tennessee">Tennessee</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Jurisdiction</Label>
                        <Input
                          value={formData.jurisdiction || ''}
                          onChange={(e) => handleFieldChange('jurisdiction', e.target.value)}
                          placeholder="e.g., courts of New York"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-md font-semibold mb-3">Contact & Delivery</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Recipient Email</Label>
                        <Input
                          type="email"
                          value={formData.recipient_email || ''}
                          onChange={(e) => handleFieldChange('recipient_email', e.target.value)}
                          placeholder="Email address for sending contract"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={formData.notes || ''}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                          placeholder="Additional notes or instructions..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Fields</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fill in the specific details for your contract. Required fields are marked in the template.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(groupedFields).map(([category, categoryFields]) => (
                    <div key={category}>
                      <h4 className="text-lg font-semibold mb-4 capitalize">
                        {category.replace('_', ' ')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryFields.map(field => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {renderFieldInput(field)}
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-6" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right: Live preview and actions */}
            <div className="space-y-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Contract Details</CardTitle>
                  <p className="text-sm text-muted-foreground">Live preview updates as you type</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-[520px] rounded-md border p-4">
                    <pre className="text-sm whitespace-pre-wrap">{generatePreviewText()}</pre>
                  </ScrollArea>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                    <Button variant="outline" onClick={() => toast({ title: 'Email sent', description: 'Send Email flow coming soon' })}>
                      Send Email
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: 'DocuSign', description: 'Send via DocuSign coming soon' })}>
                      Send via DocuSign
                    </Button>
                    <Button onClick={handleSave}>
                      Save Contract
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
