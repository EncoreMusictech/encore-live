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
      content?: string;
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
    // Use standardized contract content if available
    const contractContent = template.template_data?.content;
    if (contractContent) {
      return contractContent.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
        const val = formData[key];
        if (val !== undefined && val !== "") return String(val);
        return `[${key.replace(/_/g, ' ').toUpperCase()}]`;
      });
    }
    
    // Fallback to field-based generation
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
                  <CardTitle>Recording Agreement Details</CardTitle>
                  <p className="text-sm text-muted-foreground">Complete details for the Standard Recording Contract</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Contract Info */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Basic Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contract Title</Label>
                        <Input
                          value={formData.contract_title || "Recording Agreement"}
                          onChange={(e) => handleFieldChange('contract_title', e.target.value)}
                          placeholder="Recording Agreement"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Effective Date</Label>
                        <Input
                          type="date"
                          value={formData.effective_date || ''}
                          onChange={(e) => handleFieldChange('effective_date', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Company/Label Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Company/Label Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company/Label Name *</Label>
                        <Input
                          value={formData.company_label_name || ''}
                          onChange={(e) => handleFieldChange('company_label_name', e.target.value)}
                          placeholder="Label or company name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company Address *</Label>
                        <Textarea
                          value={formData.company_address || ''}
                          onChange={(e) => handleFieldChange('company_address', e.target.value)}
                          placeholder="Full company address"
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Representative Name</Label>
                        <Input
                          value={formData.company_representative_name || ''}
                          onChange={(e) => handleFieldChange('company_representative_name', e.target.value)}
                          placeholder="Representative's full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Representative Title</Label>
                        <Input
                          value={formData.company_representative_title || ''}
                          onChange={(e) => handleFieldChange('company_representative_title', e.target.value)}
                          placeholder="President, A&R Director, etc."
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Artist Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Artist Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Artist Legal Name *</Label>
                        <Input
                          value={formData.artist_legal_name || ''}
                          onChange={(e) => handleFieldChange('artist_legal_name', e.target.value)}
                          placeholder="Full legal name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Artist Stage Name</Label>
                        <Input
                          value={formData.artist_stage_name || ''}
                          onChange={(e) => handleFieldChange('artist_stage_name', e.target.value)}
                          placeholder="Professional/stage name"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Agreement Terms */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Agreement Terms</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Term (Years)</Label>
                        <Input
                          type="number"
                          value={formData.term_years || ''}
                          onChange={(e) => handleFieldChange('term_years', e.target.value)}
                          placeholder="2"
                          min="1"
                          max="10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Term (Months)</Label>
                        <Input
                          type="number"
                          value={formData.term_months || ''}
                          onChange={(e) => handleFieldChange('term_months', e.target.value)}
                          placeholder="24"
                          min="1"
                          max="120"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Number of Selections</Label>
                        <Input
                          type="number"
                          value={formData.number_of_selections || ''}
                          onChange={(e) => handleFieldChange('number_of_selections', e.target.value)}
                          placeholder="12"
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Territory</Label>
                        <Select value={formData.territory || ''} onValueChange={(v) => handleFieldChange('territory', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select territory" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="worldwide">Worldwide</SelectItem>
                            <SelectItem value="united_states">United States</SelectItem>
                            <SelectItem value="north_america">North America</SelectItem>
                            <SelectItem value="specific_territories">Specific Territories</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Option to Extend (Days Notice)</Label>
                        <Input
                          type="number"
                          value={formData.option_notice_days || ''}
                          onChange={(e) => handleFieldChange('option_notice_days', e.target.value)}
                          placeholder="90"
                          min="30"
                          max="365"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Financial Terms */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Financial Terms</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Royalty Amount/Percentage</Label>
                        <Input
                          value={formData.royalty_amount_percentage || ''}
                          onChange={(e) => handleFieldChange('royalty_amount_percentage', e.target.value)}
                          placeholder="15% or $2.50 per unit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Digital Royalty %</Label>
                        <Input
                          value={formData.digital_royalty_percentage || ''}
                          onChange={(e) => handleFieldChange('digital_royalty_percentage', e.target.value)}
                          placeholder="50% of net receipts"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Accounting Frequency</Label>
                        <Select value={formData.accounting_frequency || ''} onValueChange={(v) => handleFieldChange('accounting_frequency', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Days After Period</Label>
                        <Input
                          type="number"
                          value={formData.payment_days || ''}
                          onChange={(e) => handleFieldChange('payment_days', e.target.value)}
                          placeholder="45"
                          min="30"
                          max="120"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Reserve Periods</Label>
                        <Input
                          type="number"
                          value={formData.reserve_periods || ''}
                          onChange={(e) => handleFieldChange('reserve_periods', e.target.value)}
                          placeholder="4"
                          min="1"
                          max="8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Re-recording Restriction (Years)</Label>
                        <Input
                          type="number"
                          value={formData.rerecording_restriction_years || ''}
                          onChange={(e) => handleFieldChange('rerecording_restriction_years', e.target.value)}
                          placeholder="5"
                          min="2"
                          max="10"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Union & Legal Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Union & Legal Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Union Name (if applicable)</Label>
                        <Input
                          value={formData.union_name || ''}
                          onChange={(e) => handleFieldChange('union_name', e.target.value)}
                          placeholder="AFM, SAG-AFTRA, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Governing Law</Label>
                        <Select value={formData.governing_law || ''} onValueChange={(v) => handleFieldChange('governing_law', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select jurisdiction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="california">California</SelectItem>
                            <SelectItem value="new_york">New York</SelectItem>
                            <SelectItem value="nashville">Tennessee (Nashville)</SelectItem>
                            <SelectItem value="federal">Federal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jurisdiction</Label>
                        <Input
                          value={formData.jurisdiction || ''}
                          onChange={(e) => handleFieldChange('jurisdiction', e.target.value)}
                          placeholder="Los Angeles County, CA"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Recipient Email</Label>
                        <Input
                          type="email"
                          value={formData.recipient_email || ''}
                          onChange={(e) => handleFieldChange('recipient_email', e.target.value)}
                          placeholder="artist@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Notes */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Additional Information</h4>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes || ''}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        placeholder="Additional notes, special terms, or instructions..."
                        rows={3}
                      />
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
