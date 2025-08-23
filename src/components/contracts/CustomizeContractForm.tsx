import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Send, FileText, Paperclip } from 'lucide-react';
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
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    to: '',
    subject: `${template.title || 'Contract'} for Review`,
    body: `Please find the attached ${template.title || 'contract'} for your review and signature.\n\nBest regards,`,
    isGeneratingPDF: false,
    isSendingEmail: false
  });
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
      return contractContent.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key) => {
        // Handle nested object keys like song_titles.title
        const keys = key.split('.');
        let val = formData;
        for (const k of keys) {
          val = val?.[k];
        }
        if (val !== undefined && val !== null && String(val) !== "") return String(val);
        return `[${key.replace(/_/g, ' ').replace(/\./g, ' ').toUpperCase()}]`;
      });
    }
    
     // Handle sync licensing agreement specifically
    if (String(template.contract_type) === 'sync' || template.title?.toLowerCase().includes('sync')) {
      return `Synchronization License Agreement

This Synchronization License Agreement ("Agreement") is made and entered into as of ${formData.effective_date || '[EFFECTIVE DATE]'}, by and between:

${formData.licensor_name || '[LICENSOR NAME]'}, located at ${formData.licensor_address || '[LICENSOR ADDRESS]'} ("Licensor"),
and

${formData.licensee_name || '[LICENSEE NAME]'}, located at ${formData.licensee_address || '[LICENSEE ADDRESS]'} ("Licensee").

1. GRANT OF RIGHTS

Licensor grants to Licensee a non-exclusive license to synchronize the musical composition(s) listed in Schedule A with the audiovisual production:

Production Title: ${formData.project_title || '[PROJECT TITLE]'}

Producer/Company: ${formData.licensee_name || '[LICENSEE NAME]'}

Type of Use: ${formData.media_platforms || '[MEDIA PLATFORMS]'}

Scene/Use Description: ${formData.use_description || '[USE DESCRIPTION]'}

Duration/Timing: ${formData.scene_duration_seconds || '[SCENE DURATION]'} seconds

The license is granted for the use of the composition in timed relation with the Production only.

2. TERRITORY

The rights granted herein are valid for the following territory: ${formData.territory || '[TERRITORY]'}.

3. TERM

The rights granted herein shall endure for: ${formData.term_type || '[TERM TYPE]'} ${formData.term_years ? `(${formData.term_years} year(s))` : '([TERM YEARS] year(s))'}.

4. MEDIA & USAGE

The license includes the right to distribute and exploit the Production containing the Composition in the following media: ${formData.media_platforms || '[MEDIA PLATFORMS]'}.

Any uses beyond those listed shall require a separate written agreement.

5. FEE

As consideration for the license granted herein, Licensee agrees to pay Licensor the following fee:

Synchronization Fee: $${formData.sync_fee_amount || '[SYNC FEE AMOUNT]'}

Payment Terms: ${formData.payment_terms || '[PAYMENT TERMS]'}

Payment Method: ${formData.payment_method || '[PAYMENT METHOD]'}

6. CREDITS

Licensee shall accord credit as follows (if applicable):

"${formData.song_titles?.title || '[SONG TITLE]'}" written by ${formData.song_titles?.writer_names || '[WRITER NAMES]'}, published by ${formData.song_titles?.publisher_names || '[PUBLISHER NAMES]'}, used by permission.

Placement: ${formData.credit_placement || '[CREDIT PLACEMENT]'}

7. WARRANTIES & REPRESENTATIONS

Licensor represents and warrants that:

Licensor has the full right and authority to grant this license;

The Composition does not infringe the rights of any third party.

Licensee represents and warrants that:

The Production does not contain material that unlawfully infringes on third-party rights;

The Composition shall be used only as authorized under this Agreement.

8. INDEMNITY

Each party agrees to indemnify and hold harmless the other from claims, damages, or expenses arising from its breach of this Agreement.

9. TERMINATION

If Licensee fails to pay the Fee or breaches this Agreement, Licensor may terminate the license immediately, whereupon all rights granted shall revert to Licensor.

10. MISCELLANEOUS

Governing Law: This Agreement shall be governed by the laws of ${formData.governing_law || '[GOVERNING LAW]'}.

Jurisdiction: Disputes shall be resolved in ${formData.jurisdiction || '[JURISDICTION]'}.

Entire Agreement: This document contains the entire agreement between the parties.

Notices: All notices shall be delivered to the parties at the addresses listed above.

SIGNATURES

Licensor
By: ___________________________
Name: ${formData.company_representative_name || '[REPRESENTATIVE NAME]'}
Title: ${formData.company_representative_title || '[REPRESENTATIVE TITLE]'}
Date: _________________________

Licensee
By: ___________________________
Name: ${formData.company_representative_name || '[REPRESENTATIVE NAME]'}
Title: ${formData.company_representative_title || '[REPRESENTATIVE TITLE]'}
Date: _________________________

EXHIBIT A – LICENSED WORK DETAILS

Song Title: ${formData.song_titles?.title || '[SONG TITLE]'}

ISWC: ${formData.song_titles?.iswc || '[ISWC]'}

Writers: ${formData.song_titles?.writer_names || '[WRITER NAMES]'}

Publishers: ${formData.song_titles?.publisher_names || '[PUBLISHER NAMES]'}

Use Description: ${formData.use_description || '[USE DESCRIPTION]'}

Term: ${formData.term_years || '[TERM YEARS]'} years

Territory: ${formData.territory || '[TERRITORY]'}

Media: ${formData.media_platforms || '[MEDIA PLATFORMS]'}

Fee: $${formData.sync_fee_amount || '[SYNC FEE AMOUNT]'}`;
    }

    // Handle producer agreement specifically
    if (String(template.contract_type) === 'producer' || template.title?.toLowerCase().includes('producer')) {
      return `Music Production Agreement

This Production Agreement ("Agreement") is made effective as of ${formData.effective_date || '[EFFECTIVE DATE]'}, by and between:

${formData.producer_name || '[PRODUCER NAME]'}, with a primary address at ${formData.producer_address || '[PRODUCER ADDRESS]'} ("Producer"), and

${formData.company_name || '[COMPANY NAME]'}, with a primary address at ${formData.company_address || '[COMPANY ADDRESS]'} ("Client").

Producer and Client may be referred to individually as a "Party" and collectively as the "Parties."

RECITALS

WHEREAS, Client wishes to engage Producer to render music production services;
WHEREAS, Producer has the skills and expertise to provide such services;
NOW, THEREFORE, in consideration of the mutual promises herein, the Parties agree as follows:

1. DEFINITIONS

Production Services: The services Producer shall provide under this Agreement, including recording, mixing, mastering, arranging, or other services as agreed.

Project: The production of a completed recording (track(s)/album) as described in Schedule A.

Work: The finished recordings delivered by Producer.

Commencement Date: ${formData.commencement_date || '[COMMENCEMENT DATE]'}.

Completion Date: ${formData.completion_date || '[COMPLETION DATE]'}.

Fees: Payment due to Producer as described in Section 4.

2. ENGAGEMENT

Producer agrees to provide Production Services for the Project beginning on the Commencement Date and concluding on the Completion Date, and Client agrees to compensate Producer as set forth herein.

3. SPECIFICATIONS

The Project shall consist of:

Number of Songs/Tracks: ${formData.number_of_tracks || '[NUMBER OF TRACKS]'}

Genre/Style: ${formData.genre_style || '[GENRE/STYLE]'}

Delivery Format: ${formData.delivery_format || '[DELIVERY FORMAT]'}

4. FEES & PAYMENT

A. Fixed Fee: Client shall pay Producer $${formData.fixed_fee_amount || '[FIXED FEE AMOUNT]'} for all Production Services.
B. Payment Terms:

   Deposit: $${formData.advance_amount || '[ADVANCE AMOUNT]'} due upon signing.

   Balance: payable on or before ${formData.delivery_date || '[DELIVERY DATE]'}.
C. Expenses: Client shall reimburse Producer for pre-approved out-of-pocket expenses.
D. Late Payments: Overdue amounts shall accrue interest at ${formData.late_interest_percent || '[LATE INTEREST PERCENT]'}% per annum.
E. Royalties / Points: In addition to Fees, Producer shall also be entitled to ${formData.producer_points_percent || '[PRODUCER POINTS PERCENT]'}% of Net Receipts from exploitation of the Work, and/or ${formData.royalty_rate_percent || '[ROYALTY RATE PERCENT]'}% royalties if applicable.

Payments shall be made by ${formData.payment_method || '[PAYMENT METHOD]'}.

5. OWNERSHIP & RIGHTS

Unless otherwise agreed in writing:

The Work shall be deemed a "work-made-for-hire" for Client.

Client shall own all rights, title, and interest in the Work, including copyright.

Producer shall retain customary credit as "Producer" on the Work.

6. WARRANTIES & REPRESENTATIONS

Producer warrants the Work shall be original and not infringe third-party rights.

Client warrants it has authority to enter this Agreement and to exploit the Work.

7. LIMITATION OF LIABILITY

Except in cases of gross negligence or willful misconduct, Producer's liability shall not exceed the Fees paid under this Agreement. Neither Party shall be liable for indirect or consequential damages.

8. INDEMNITY

Each Party agrees to indemnify and hold harmless the other against losses, damages, or claims arising from a breach of this Agreement.

9. TERMINATION

This Agreement may be terminated:

By either Party for material breach not cured within ${formData.invoice_due_days || '[INVOICE DUE DAYS]'} days after notice;

By Producer if Client fails to pay Fees due within ${formData.invoice_due_days || '[INVOICE DUE DAYS]'} days;

By Client if Producer fails to deliver the Work as specified.

Upon termination, Client shall pay Producer for all services rendered up to termination.

10. GENERAL PROVISIONS

Governing Law: This Agreement shall be governed by the laws of ${formData.governing_law || '[GOVERNING LAW]'}.

Jurisdiction: Disputes shall be resolved in ${formData.jurisdiction || '[JURISDICTION]'}.

Notices: Notices shall be sent to the Parties' addresses above.

Entire Agreement: This document constitutes the full agreement between the Parties.

Amendments: Any modifications must be in writing and signed by both Parties.

Force Majeure: Neither Party shall be liable for failure to perform due to causes beyond their control.

SIGNATURES

Producer
Name: ${formData.producer_name || '[PRODUCER NAME]'}
Signature: _________________________
Date: ____________________________

Client/Artist/Label
Name: ${formData.company_representative_name || '[COMPANY REPRESENTATIVE NAME]'}
Title: ${formData.company_representative_title || '[COMPANY REPRESENTATIVE TITLE]'}
Signature: _________________________
Date: ____________________________

SCHEDULE A – PROJECT DETAILS

Project Title: ${formData.project_title || '[PROJECT TITLE]'}

Number of Tracks: ${formData.number_of_tracks || '[NUMBER OF TRACKS]'}

Delivery Date: ${formData.delivery_date || '[DELIVERY DATE]'}

Notes/Additional Specifications: ________________________`;
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

  const handleGeneratePDF = async () => {
    setEmailFormData(prev => ({ ...prev, isGeneratingPDF: true }));
    
    try {
      const contractContent = generatePreviewText();
      const contractData = {
        title: template.title || 'Contract',
        content: contractContent,
        formData
      };

      const { data, error } = await supabase.functions.invoke('generate-agreement-pdf', {
        body: contractData
      });

      if (error) throw error;
      
      return data.pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setEmailFormData(prev => ({ ...prev, isGeneratingPDF: false }));
    }
  };

  const handleSendEmail = async () => {
    console.log('handleSendEmail called with:', { 
      to: emailFormData.to, 
      subject: emailFormData.subject,
      templateTitle: template.title 
    });

    if (!emailFormData.to.trim()) {
      console.log('Email validation failed: no recipient');
      toast({
        title: 'Error',
        description: 'Please enter a recipient email address.',
        variant: 'destructive'
      });
      return;
    }

    console.log('Setting isSendingEmail to true');
    setEmailFormData(prev => ({ ...prev, isSendingEmail: true }));

    try {
      console.log('Generating contract content...');
      // Generate the contract content
      const contractContent = generatePreviewText();
      console.log('Contract content generated:', contractContent.substring(0, 100) + '...');

      console.log('Calling send-contract-email edge function...');
      // Send email with contract content
      const { data, error } = await supabase.functions.invoke('send-contract-email', {
        body: {
          to: emailFormData.to,
          recipientName: emailFormData.to.split('@')[0], // Use part before @ as name
          contractTitle: template.title || 'Contract',
          contractContent: contractContent,
          senderMessage: emailFormData.body || undefined
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Email sent successfully');
      toast({
        title: 'Email Sent',
        description: `Contract successfully sent to ${emailFormData.to}`,
      });

      setEmailDialogOpen(false);
      setEmailFormData(prev => ({
        ...prev,
        to: '',
        subject: `${template.title || 'Contract'} for Review`,
        body: `Please find the attached ${template.title || 'contract'} for your review and signature.\n\nBest regards,`
      }));

    } catch (error) {
      console.error('Error in handleSendEmail:', error);
      toast({
        title: 'Error',
        description: `Failed to send email: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      console.log('Setting isSendingEmail to false');
      setEmailFormData(prev => ({ ...prev, isSendingEmail: false }));
    }
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
                  <CardTitle>
                    {template.contract_type === 'publishing' ? 'Publishing Administration Agreement Details' : 
                     template.contract_type === 'distribution' ? 'Distribution Agreement Details' : 
                     template.contract_type === 'sync' ? 'Synchronization License Agreement Details' : 
                     template.contract_type === 'producer' ? 'Music Production Agreement Details' : 'Recording Agreement Details'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {template.contract_type === 'publishing' 
                      ? 'Complete details for the Publishing Administration Agreement' 
                      : template.contract_type === 'distribution'
                      ? 'Complete details for the Distribution Agreement'
                      : template.contract_type === 'sync'
                      ? 'Complete details for the Synchronization License Agreement'
                      : template.contract_type === 'producer'
                      ? 'Complete details for the Music Production Agreement'
                      : 'Complete details for the Standard Recording Contract'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {template.contract_type === 'publishing' ? (
                    <>
...
                    </>
                   ) : template.contract_type === 'distribution' ? (
                    <>
                      {/* Basic Contract Info */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Basic Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Agreement Title</Label>
                            <Input
                              value={formData.agreement_title || "Distribution Agreement"}
                              onChange={(e) => handleFieldChange('agreement_title', e.target.value)}
                              placeholder="Distribution Agreement"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Effective Date *</Label>
                            <Input
                              type="date"
                              value={formData.effective_date || ''}
                              onChange={(e) => handleFieldChange('effective_date', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Company Information */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Company Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Company Name *</Label>
                            <Input
                              value={formData.company_name || ''}
                              onChange={(e) => handleFieldChange('company_name', e.target.value)}
                              placeholder="Company/Label name"
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
                            <Label>Company Representative Name *</Label>
                            <Input
                              value={formData.company_representative_name || ''}
                              onChange={(e) => handleFieldChange('company_representative_name', e.target.value)}
                              placeholder="Representative's full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Representative Title *</Label>
                            <Input
                              value={formData.company_representative_title || ''}
                              onChange={(e) => handleFieldChange('company_representative_title', e.target.value)}
                              placeholder="President, CEO, etc."
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Distributor Information */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Distributor Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Distributor Name *</Label>
                            <Input
                              value={formData.distributor_name || ''}
                              onChange={(e) => handleFieldChange('distributor_name', e.target.value)}
                              placeholder="Distribution company name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Distributor Address *</Label>
                            <Textarea
                              value={formData.distributor_address || ''}
                              onChange={(e) => handleFieldChange('distributor_address', e.target.value)}
                              placeholder="Full distributor address"
                              rows={2}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Distribution Terms */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Distribution Terms</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Term (Years) *</Label>
                            <Input
                              type="number"
                              value={formData.term_years || ''}
                              onChange={(e) => handleFieldChange('term_years', e.target.value)}
                              placeholder="3"
                              min="1"
                              max="10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Album Commitment</Label>
                            <Input
                              type="number"
                              value={formData.album_commitment || ''}  
                              onChange={(e) => handleFieldChange('album_commitment', e.target.value)}
                              placeholder="1"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Territory *</Label>
                            <Select value={formData.territory || ''} onValueChange={(v) => handleFieldChange('territory', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select territory" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Worldwide">Worldwide</SelectItem>
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="North America">North America</SelectItem>
                                <SelectItem value="Europe">Europe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Financial Terms */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Financial Terms</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Distribution Fee (%) *</Label>
                            <Input
                              type="number"
                              value={formData.distribution_fee_percent || ''}
                              onChange={(e) => handleFieldChange('distribution_fee_percent', e.target.value)}
                              placeholder="15"
                              min="0"
                              max="50"
                              step="0.5"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fixed Fee Amount ($)</Label>
                            <Input
                              type="number"
                              value={formData.fixed_fee_amount || ''}
                              onChange={(e) => handleFieldChange('fixed_fee_amount', e.target.value)}
                              placeholder="10000"
                              min="0"
                              step="1000"
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Advance Amount ($)</Label>
                            <Input
                              type="number"
                              value={formData.advance_amount || ''}
                              onChange={(e) => handleFieldChange('advance_amount', e.target.value)}
                              placeholder="25000"
                              min="0"
                              step="1000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Royalty Rate (%)</Label>
                            <Input
                              type="number"
                              value={formData.royalty_rate_percent || ''}
                              onChange={(e) => handleFieldChange('royalty_rate_percent', e.target.value)}
                              placeholder="50"
                              min="0"
                              max="100"
                              step="0.5"
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Accounting Frequency *</Label>
                            <Select value={formData.accounting_frequency || ''} onValueChange={(v) => handleFieldChange('accounting_frequency', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                                <SelectItem value="Annual">Annual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Invoice Due Days *</Label>
                            <Input
                              type="number"
                              value={formData.invoice_due_days || ''}
                              onChange={(e) => handleFieldChange('invoice_due_days', e.target.value)}
                              placeholder="45"
                              min="15"
                              max="90"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Payment Method *</Label>
                            <Select value={formData.payment_method || ''} onValueChange={(v) => handleFieldChange('payment_method', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                                <SelectItem value="Check">Check</SelectItem>
                                <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Delivery Requirements */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Delivery Requirements</h4>
                        <div className="space-y-2">
                          <Label>Delivery Format *</Label>
                          <Select value={formData.delivery_format || ''} onValueChange={(v) => handleFieldChange('delivery_format', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="24-bit/96kHz WAV">24-bit/96kHz WAV</SelectItem>
                              <SelectItem value="24-bit/48kHz WAV">24-bit/48kHz WAV</SelectItem>
                              <SelectItem value="16-bit/44.1kHz WAV">16-bit/44.1kHz WAV</SelectItem>
                              <SelectItem value="Digital Distribution Format">Digital Distribution Format</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* Legal Terms */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Legal Terms</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Governing Law *</Label>
                            <Input
                              value={formData.governing_law || ''}
                              onChange={(e) => handleFieldChange('governing_law', e.target.value)}
                              placeholder="State of California"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Jurisdiction *</Label>
                            <Input
                              value={formData.jurisdiction || ''}
                              onChange={(e) => handleFieldChange('jurisdiction', e.target.value)}
                              placeholder="Los Angeles, CA"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Schedule A - Recordings */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Schedule A - Recordings</h4>
                        <div className="space-y-2">
                          <Label>Recording Details *</Label>
                          <Textarea
                            value={formData.recording_details || ''}
                            onChange={(e) => handleFieldChange('recording_details', e.target.value)}
                            placeholder="Format: Title | Artist | Album/Project | Catalog Number | Format | Release Date&#10;Example: &#10;Song Title | Artist Name | Album Name | CAT001 | Digital/Physical | 2024-01-15&#10;Another Song | Artist Name | Single Release | CAT002 | Digital Only | 2024-02-01"
                            rows={4}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter each recording on a new line using the format: Title | Artist | Album/Project | Catalog Number | Format | Release Date
                          </p>
                        </div>
                      </div>
                    </>
                   ) : template.contract_type === 'sync' ? (
                    <>
                      {/* Basic Contract Info */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Basic Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Agreement Title</Label>
                            <Input
                              value={formData.agreement_title || "Synchronization License Agreement"}
                              onChange={(e) => handleFieldChange('agreement_title', e.target.value)}
                              placeholder="Synchronization License Agreement"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Effective Date *</Label>
                            <Input
                              type="date"
                              value={formData.effective_date || ''}
                              onChange={(e) => handleFieldChange('effective_date', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Licensor Information */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Licensor Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Licensor Name *</Label>
                            <Input
                              value={formData.licensor_name || ''}
                              onChange={(e) => handleFieldChange('licensor_name', e.target.value)}
                              placeholder="Rights holder/publisher name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Licensor Address *</Label>
                            <Textarea
                              value={formData.licensor_address || ''}
                              onChange={(e) => handleFieldChange('licensor_address', e.target.value)}
                              placeholder="Full licensor address"
                              rows={2}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Representative Name *</Label>
                            <Input
                              value={formData.company_representative_name || ''}
                              onChange={(e) => handleFieldChange('company_representative_name', e.target.value)}
                              placeholder="Representative's full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Representative Title *</Label>
                            <Input
                              value={formData.company_representative_title || ''}
                              onChange={(e) => handleFieldChange('company_representative_title', e.target.value)}
                              placeholder="President, Music Supervisor, etc."
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Licensee Information */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Licensee Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Licensee Name *</Label>
                            <Input
                              value={formData.licensee_name || ''}
                              onChange={(e) => handleFieldChange('licensee_name', e.target.value)}
                              placeholder="Production company/client name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Licensee Address *</Label>
                            <Textarea
                              value={formData.licensee_address || ''}
                              onChange={(e) => handleFieldChange('licensee_address', e.target.value)}
                              placeholder="Full licensee address"
                              rows={2}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Production Details */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Production Details</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Project Title *</Label>
                            <Input
                              value={formData.project_title || ''}
                              onChange={(e) => handleFieldChange('project_title', e.target.value)}
                              placeholder="Film, TV show, commercial title"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Media Platforms *</Label>
                            <Select value={formData.media_platforms || ''} onValueChange={(v) => handleFieldChange('media_platforms', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select media type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Film/Theatrical">Film/Theatrical</SelectItem>
                                <SelectItem value="Television">Television</SelectItem>
                                <SelectItem value="Streaming/Digital">Streaming/Digital</SelectItem>
                                <SelectItem value="Commercial/Advertising">Commercial/Advertising</SelectItem>
                                <SelectItem value="Web/Online">Web/Online</SelectItem>
                                <SelectItem value="All Media">All Media</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Scene Duration (Seconds) *</Label>
                            <Input
                              type="number"
                              value={formData.scene_duration_seconds || ''}
                              onChange={(e) => handleFieldChange('scene_duration_seconds', e.target.value)}
                              placeholder="30"
                              min="1"
                              max="600"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Territory *</Label>
                            <Select value={formData.territory || ''} onValueChange={(v) => handleFieldChange('territory', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select territory" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Worldwide">Worldwide</SelectItem>
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="North America">North America</SelectItem>
                                <SelectItem value="Europe">Europe</SelectItem>
                                <SelectItem value="Festival Only">Festival Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Use Description *</Label>
                          <Textarea
                            value={formData.use_description || ''}
                            onChange={(e) => handleFieldChange('use_description', e.target.value)}
                            placeholder="Describe how the music will be used in the scene (background, featured, instrumental, etc.)"
                            rows={3}
                            required
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Term & Usage Rights */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Term & Usage Rights</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Term Type *</Label>
                            <Select value={formData.term_type || ''} onValueChange={(v) => handleFieldChange('term_type', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select term type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Perpetual">Perpetual</SelectItem>
                                <SelectItem value="Fixed Term">Fixed Term</SelectItem>
                                <SelectItem value="Festival Only">Festival Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Term (Years)</Label>
                            <Input
                              type="number"
                              value={formData.term_years || ''}
                              onChange={(e) => handleFieldChange('term_years', e.target.value)}
                              placeholder="5"
                              min="1"
                              max="25"
                              disabled={formData.term_type === 'Perpetual' || formData.term_type === 'Festival Only'}
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
                            <Label>Sync Fee Amount ($) *</Label>
                            <Input
                              type="number"
                              value={formData.sync_fee_amount || ''}
                              onChange={(e) => handleFieldChange('sync_fee_amount', e.target.value)}
                              placeholder="5000"
                              min="0"
                              step="100"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Payment Terms *</Label>
                            <Select value={formData.payment_terms || ''} onValueChange={(v) => handleFieldChange('payment_terms', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment terms" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Net 30">Net 30</SelectItem>
                                <SelectItem value="Net 45">Net 45</SelectItem>
                                <SelectItem value="Upon Execution">Upon Execution</SelectItem>
                                <SelectItem value="50% Upon Execution, 50% Upon Delivery">50% Upon Execution, 50% Upon Delivery</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Method *</Label>
                          <Select value={formData.payment_method || ''} onValueChange={(v) => handleFieldChange('payment_method', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                              <SelectItem value="Check">Check</SelectItem>
                              <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* Song Details */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Licensed Work Details</h4>
                        <div className="space-y-2">
                          <Label>Song Title *</Label>
                          <Input
                            value={formData.song_titles?.title || ''}
                            onChange={(e) => handleFieldChange('song_titles', {...formData.song_titles, title: e.target.value})}
                            placeholder="Song title"
                            required
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>ISWC</Label>
                            <Input
                              value={formData.song_titles?.iswc || ''}
                              onChange={(e) => handleFieldChange('song_titles', {...formData.song_titles, iswc: e.target.value})}
                              placeholder="T-123456789-1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Writer Names *</Label>
                            <Input
                              value={formData.song_titles?.writer_names || ''}
                              onChange={(e) => handleFieldChange('song_titles', {...formData.song_titles, writer_names: e.target.value})}
                              placeholder="John Doe, Jane Smith"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Publisher Names *</Label>
                            <Input
                              value={formData.song_titles?.publisher_names || ''}
                              onChange={(e) => handleFieldChange('song_titles', {...formData.song_titles, publisher_names: e.target.value})}
                              placeholder="ABC Music Publishing"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Credit Placement *</Label>
                            <Select value={formData.credit_placement || ''} onValueChange={(v) => handleFieldChange('credit_placement', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select credit placement" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="End Credits">End Credits</SelectItem>
                                <SelectItem value="Opening Credits">Opening Credits</SelectItem>
                                <SelectItem value="On Screen">On Screen</SelectItem>
                                <SelectItem value="No Credit Required">No Credit Required</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Legal Terms */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Legal Terms</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Governing Law *</Label>
                            <Input
                              value={formData.governing_law || ''}
                              onChange={(e) => handleFieldChange('governing_law', e.target.value)}
                              placeholder="State of California"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Jurisdiction *</Label>
                            <Input
                              value={formData.jurisdiction || ''}
                              onChange={(e) => handleFieldChange('jurisdiction', e.target.value)}
                              placeholder="Los Angeles, CA"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </>
                   ) : template.contract_type === 'producer' ? (
                    <>
                      {/* Basic Contract Info */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Basic Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Agreement Title</Label>
                            <Input
                              value={formData.agreement_title || "Music Production Agreement"}
                              onChange={(e) => handleFieldChange('agreement_title', e.target.value)}
                              placeholder="Music Production Agreement"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Effective Date *</Label>
                            <Input
                              type="date"
                              value={formData.effective_date || ''}
                              onChange={(e) => handleFieldChange('effective_date', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Commencement Date *</Label>
                            <Input
                              type="date"
                              value={formData.commencement_date || ''}
                              onChange={(e) => handleFieldChange('commencement_date', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Completion Date *</Label>
                            <Input
                              type="date"
                              value={formData.completion_date || ''}
                              onChange={(e) => handleFieldChange('completion_date', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Producer Information */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Producer Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Producer Name *</Label>
                            <Input
                              value={formData.producer_name || ''}
                              onChange={(e) => handleFieldChange('producer_name', e.target.value)}
                              placeholder="Producer's legal name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Producer Address *</Label>
                            <Textarea
                              value={formData.producer_address || ''}
                              onChange={(e) => handleFieldChange('producer_address', e.target.value)}
                              placeholder="Full producer address"
                              rows={2}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Client Information */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Client Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Company Name *</Label>
                            <Input
                              value={formData.company_name || ''}
                              onChange={(e) => handleFieldChange('company_name', e.target.value)}
                              placeholder="Client/Label/Artist name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Company Address *</Label>
                            <Textarea
                              value={formData.company_address || ''}
                              onChange={(e) => handleFieldChange('company_address', e.target.value)}
                              placeholder="Full client address"
                              rows={2}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Representative Name *</Label>
                            <Input
                              value={formData.company_representative_name || ''}
                              onChange={(e) => handleFieldChange('company_representative_name', e.target.value)}
                              placeholder="Representative's full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Representative Title *</Label>
                            <Input
                              value={formData.company_representative_title || ''}
                              onChange={(e) => handleFieldChange('company_representative_title', e.target.value)}
                              placeholder="Artist, Manager, A&R, etc."
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Project Specifications */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Project Specifications</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Project Title *</Label>
                            <Input
                              value={formData.project_title || ''}
                              onChange={(e) => handleFieldChange('project_title', e.target.value)}
                              placeholder="Album, EP, or project name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Number of Tracks *</Label>
                            <Input
                              type="number"
                              value={formData.number_of_tracks || ''}
                              onChange={(e) => handleFieldChange('number_of_tracks', e.target.value)}
                              placeholder="10"
                              min="1"
                              max="50"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Genre/Style *</Label>
                            <Input
                              value={formData.genre_style || ''}
                              onChange={(e) => handleFieldChange('genre_style', e.target.value)}
                              placeholder="Hip-Hop, Pop, R&B, etc."
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Delivery Format *</Label>
                            <Select value={formData.delivery_format || ''} onValueChange={(v) => handleFieldChange('delivery_format', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="24-bit/96kHz WAV">24-bit/96kHz WAV</SelectItem>
                                <SelectItem value="24-bit/48kHz WAV">24-bit/48kHz WAV</SelectItem>
                                <SelectItem value="16-bit/44.1kHz WAV">16-bit/44.1kHz WAV</SelectItem>
                                <SelectItem value="Mixed and Mastered">Mixed and Mastered</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Delivery Date *</Label>
                          <Input
                            type="date"
                            value={formData.delivery_date || ''}
                            onChange={(e) => handleFieldChange('delivery_date', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Financial Terms */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Financial Terms</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Fixed Fee Amount ($) *</Label>
                            <Input
                              type="number"
                              value={formData.fixed_fee_amount || ''}
                              onChange={(e) => handleFieldChange('fixed_fee_amount', e.target.value)}
                              placeholder="5000"
                              min="0"
                              step="100"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Advance Amount ($) *</Label>
                            <Input
                              type="number"
                              value={formData.advance_amount || ''}
                              onChange={(e) => handleFieldChange('advance_amount', e.target.value)}
                              placeholder="2500"
                              min="0"
                              step="100"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Producer Points (%)</Label>
                            <Input
                              type="number"
                              value={formData.producer_points_percent || ''}
                              onChange={(e) => handleFieldChange('producer_points_percent', e.target.value)}
                              placeholder="3"
                              min="0"
                              max="10"
                              step="0.5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Royalty Rate (%)</Label>
                            <Input
                              type="number"
                              value={formData.royalty_rate_percent || ''}
                              onChange={(e) => handleFieldChange('royalty_rate_percent', e.target.value)}
                              placeholder="2"
                              min="0"
                              max="10"
                              step="0.5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Late Interest (%)</Label>
                            <Input
                              type="number"
                              value={formData.late_interest_percent || ''}
                              onChange={(e) => handleFieldChange('late_interest_percent', e.target.value)}
                              placeholder="1.5"
                              min="0"
                              max="5"
                              step="0.25"
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Invoice Due Days *</Label>
                            <Input
                              type="number"
                              value={formData.invoice_due_days || ''}
                              onChange={(e) => handleFieldChange('invoice_due_days', e.target.value)}
                              placeholder="30"
                              min="15"
                              max="90"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Payment Method *</Label>
                            <Select value={formData.payment_method || ''} onValueChange={(v) => handleFieldChange('payment_method', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                                <SelectItem value="Check">Check</SelectItem>
                                <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Legal Terms */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Legal Terms</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Governing Law *</Label>
                            <Input
                              value={formData.governing_law || ''}
                              onChange={(e) => handleFieldChange('governing_law', e.target.value)}
                              placeholder="State of California"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Jurisdiction *</Label>
                            <Input
                              value={formData.jurisdiction || ''}
                              onChange={(e) => handleFieldChange('jurisdiction', e.target.value)}
                              placeholder="Los Angeles, CA"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </>
                   ) : (
                     <>
                       {/* Original recording agreement form content - keep existing code */}
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
                               value={formData.company_name || ''}
                               onChange={(e) => handleFieldChange('company_name', e.target.value)}
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
                             <Label>Album Commitment</Label>
                             <Input
                               type="number"
                               value={formData.album_commitment || ''}
                               onChange={(e) => handleFieldChange('album_commitment', e.target.value)}
                               placeholder="1"
                               min="1"
                               max="5"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label>Number of Tracks</Label>
                             <Input
                               type="number"
                               value={formData.number_of_tracks || ''}
                               onChange={(e) => handleFieldChange('number_of_tracks', e.target.value)}
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
                             <Label>Royalty Rate (%)</Label>
                             <Input
                               type="number"
                               value={formData.royalty_rate_percent || ''}
                               onChange={(e) => handleFieldChange('royalty_rate_percent', e.target.value)}
                               placeholder="15"
                               min="0"
                               max="100"
                               step="0.1"
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
                              <Label>Invoice Due Days</Label>
                              <Input
                                type="number"
                                value={formData.invoice_due_days || ''}
                                onChange={(e) => handleFieldChange('invoice_due_days', e.target.value)}
                                placeholder="45"
                                min="15"
                                max="90"
                              />
                            </div>
                           <div className="space-y-2">
                             <Label>Payment Method</Label>
                             <Select value={formData.payment_method || ''} onValueChange={(v) => handleFieldChange('payment_method', v)}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select payment method" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                                 <SelectItem value="check">Check</SelectItem>
                                 <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                        </div>
                         <div className="grid md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label>Option Periods Count</Label>
                             <Input
                               type="number"
                               value={formData.option_periods_count || ''}
                               onChange={(e) => handleFieldChange('option_periods_count', e.target.value)}
                               placeholder="2"
                               min="1"
                               max="5"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label>Re-record Restriction (Years)</Label>
                             <Input
                               type="number"
                               value={formData.re_record_restriction_years || ''}
                               onChange={(e) => handleFieldChange('re_record_restriction_years', e.target.value)}
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
                    </>
                  )}
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
                  <ScrollArea className="h-[520px] rounded-md border p-4 bg-muted/10">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold mb-2">
                          {template.contract_type === 'publishing' ? 'Publishing Administration Agreement' : 
                           template.contract_type === 'distribution' ? 'Distribution Agreement' : 
                           template.contract_type === 'sync' ? 'Synchronization License Agreement' : 
                           template.contract_type === 'producer' ? 'Music Production Agreement' : 'Recording Agreement'}
                        </h3>
                        <div className="h-px bg-border mb-4"></div>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{generatePreviewText()}</pre>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                    <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
                      <Send className="h-4 w-4 mr-2" />
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

      {/* Email Dialog */}
      <Dialog 
        open={emailDialogOpen} 
        onOpenChange={setEmailDialogOpen}
        modal={true}
      >
        <DialogContent className="sm:max-w-[600px] z-[60]" style={{zIndex: 60}}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Contract via Email
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to send the contract via email with a PDF attachment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">To *</Label>
              <Input
                id="email-to"
                type="email"
                placeholder="recipient@example.com"
                value={emailFormData.to}
                onChange={(e) => setEmailFormData(prev => ({ ...prev, to: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject *</Label>
              <Input
                id="email-subject"
                placeholder="Contract for Review"
                value={emailFormData.subject}
                onChange={(e) => setEmailFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                placeholder="Please find the attached contract for your review and signature..."
                value={emailFormData.body}
                onChange={(e) => setEmailFormData(prev => ({ ...prev, body: e.target.value }))}
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Attachment</p>
                <p className="text-xs text-muted-foreground">
                  {template.title || 'Contract'}.pdf (Generated automatically)
                </p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
                disabled={emailFormData.isSendingEmail || emailFormData.isGeneratingPDF}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailFormData.isSendingEmail || emailFormData.isGeneratingPDF || !emailFormData.to.trim()}
              >
                {emailFormData.isGeneratingPDF 
                  ? 'Generating PDF...' 
                  : emailFormData.isSendingEmail 
                    ? 'Sending...' 
                    : 'Send Email'
                }
                {!emailFormData.isGeneratingPDF && !emailFormData.isSendingEmail && (
                  <Send className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
