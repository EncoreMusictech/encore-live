import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// Tabs removed per layout update
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Search, Filter, FileText, Edit, Trash2, Settings } from 'lucide-react';
import { TemplateBuilder } from './TemplateBuilder';
// import { TemplatePreview } from './TemplatePreview'; // removed
import { CustomizeContractForm } from './CustomizeContractForm';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
interface Template {
  id: string;
  title: string;
  description: string;
  contract_type: string;
  fields: any[];
  is_public: boolean;
  template_data?: {
    content?: string;
    clauses?: Record<string, string>;
  };
}
interface TemplateLibraryProps {
  onBack: () => void;
  onUseTemplate?: (contractData: any) => void;
  selectionMode?: boolean;
  onTemplateSelect?: (template: any) => void;
}
const DEMO_TEMPLATES: Template[] = [{
  id: '1',
  title: 'Standard Recording Contract',
  description: 'Professional recording artist agreement with industry-standard terms and clauses.',
  contract_type: 'artist_recording',
  fields: [
    // Header - Required
    { id: 'agreement_title', type: 'text', label: 'Agreement Title', required: true, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },
    { id: 'governing_law', type: 'text', label: 'Governing Law', required: true, category: 'header' },
    { id: 'jurisdiction', type: 'text', label: 'Jurisdiction', required: true, category: 'header' },
    
    // Parties - Required
    { id: 'company_name', type: 'text', label: 'Company Name', required: true, category: 'parties' },
    { id: 'company_address', type: 'textarea', label: 'Company Address', required: true, category: 'parties' },
    { id: 'artist_legal_name', type: 'text', label: 'Artist Legal Name', required: true, category: 'parties' },
    { id: 'artist_stage_name', type: 'text', label: 'Artist Stage Name', required: true, category: 'parties' },
    { id: 'company_representative_name', type: 'text', label: 'Company Representative Name', required: true, category: 'parties' },
    { id: 'company_representative_title', type: 'text', label: 'Company Representative Title', required: true, category: 'parties' },
    
    // Work Details - Required
    { id: 'number_of_tracks', type: 'number', label: 'Number of Tracks', required: true, category: 'work' },
    
    // Financial Terms - Required
    { id: 'royalty_rate_percent', type: 'number', label: 'Royalty Rate (%)', required: true, category: 'financial' },
    { id: 'accounting_frequency', type: 'select', label: 'Accounting Frequency', required: true, options: ['Quarterly', 'Semi-Annual', 'Annual'], category: 'financial' },
    { id: 'invoice_due_days', type: 'number', label: 'Invoice Due Days', required: true, category: 'financial' },
    { id: 'payment_method', type: 'select', label: 'Payment Method', required: true, options: ['Direct Deposit', 'Check', 'Wire Transfer'], category: 'financial' },
    
    // Terms & Conditions - Required
    { id: 'territory', type: 'select', label: 'Territory', required: true, options: ['Worldwide', 'North America', 'Europe', 'United States'], category: 'terms' },
    { id: 'term_years', type: 'number', label: 'Term Years', required: true, category: 'terms' },
    { id: 'album_commitment', type: 'number', label: 'Album Commitment', required: false, category: 'terms' },
    { id: 'option_periods_count', type: 'number', label: 'Option Periods Count', required: true, category: 'terms' },
    { id: 're_record_restriction_years', type: 'number', label: 'Re-record Restriction (Years)', required: true, category: 'terms' },
    { id: 'union_name', type: 'text', label: 'Union Affiliation', required: true, category: 'terms' },
    
    // Signatures - Required
    { id: 'signature_block_company_enabled', type: 'checkbox', label: 'Company Signature Block', required: true, category: 'signatures' },
    { id: 'signature_block_individual_enabled', type: 'checkbox', label: 'Individual Signature Block', required: true, category: 'signatures' }
  ],
  template_data: {
    content: `Recording Agreement

This Recording Agreement ("Agreement") is made and entered into on {{effective_date}}, by and between:

{{company_name}}, located at {{company_address}} ("Company"),
and

{{artist_legal_name}}, professionally known as {{artist_stage_name}} ("Artist").

1. TERM

This Agreement shall remain in effect for {{term_years}} year(s) (or {{album_commitment}} album(s), if applicable) from the Effective Date.
During this Term, Artist shall render recording services for the production of {{number_of_tracks}} sound recordings (the "Recordings"), or more if mutually agreed.

2. GRANT OF RIGHTS

Artist grants Company the following exclusive rights:

To manufacture, distribute, advertise, sell, license, or otherwise exploit the Recordings throughout {{territory}}.

To use Artist's approved name, likeness, and biography in connection with the exploitation of the Recordings.

To own and control all rights in and to the master recordings, matrices, and phonorecords embodying the Recordings.

3. ROYALTIES

Company shall pay Artist a royalty of {{royalty_rate_percent}}% of Net Receipts from sales, streams, and equivalent revenue earned from the Recordings.

For single-sided recordings, Artist shall receive one-half of the above royalty unless the recording is a full-length work.

Digital exploitations shall be accounted for at {{royalty_rate_percent}}%, or as otherwise agreed.

4. ACCOUNTING & PAYMENT

Company shall render royalty statements and payments to Artist on a {{accounting_frequency}} basis, within {{invoice_due_days}} days after the end of each accounting period.

Company may withhold reasonable reserves for returns or defective products, to be liquidated within {{option_periods_count}} accounting period(s).

Payments shall be made by {{payment_method}}.

5. EXCLUSIVITY

During the Term, Artist shall not perform or record for any third party for the purpose of producing commercial sound recordings without Company's written consent.

Artist further agrees not to re-record the same musical selections for another company for a period of {{re_record_restriction_years}} year(s) after the Term.

6. WARRANTIES & REPRESENTATIONS

Artist represents and warrants that:

Artist has full right and authority to enter this Agreement;

Artist is not bound by any conflicting agreements;

The Recordings will not infringe the rights of any third party.

7. UNION OBLIGATIONS (if applicable)

If Artist or accompanying musicians are members of the {{union_name}}, this Agreement shall be subject to the rules and obligations of such union.

8. TERMINATION

Company may terminate this Agreement without liability if Artist breaches obligations, or if any required union/industry licenses for production are revoked.

9. OPTION TO EXTEND

Company shall have the option to extend this Agreement for an additional Term equal to the original Term by providing written notice to Artist at least {{invoice_due_days}} days prior to expiration.

10. MISCELLANEOUS

Governing Law: This Agreement shall be governed by the laws of {{governing_law}}.

Dispute Resolution: Any disputes shall be resolved in {{jurisdiction}}.

Entire Agreement: This document constitutes the entire agreement between the parties and supersedes all prior agreements.

SIGNATURES

Company/Label
By: ___________________________
Name: {{company_representative_name}}
Title: {{company_representative_title}}

Artist
Name: {{artist_legal_name}}
p/k/a {{artist_stage_name}}`
  },
  is_public: true
}, {
  id: '2',
  title: 'Music Publishing Agreement',
  description: 'AI-generated comprehensive songwriter and publisher agreement with royalty splits.',
  contract_type: 'publishing',
  fields: [
    // Header - Required
    { id: 'agreement_title', type: 'text', label: 'Agreement Title', required: true, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },
    { id: 'governing_law', type: 'text', label: 'Governing Law', required: true, category: 'header' },
    { id: 'jurisdiction', type: 'text', label: 'Jurisdiction', required: true, category: 'header' },
    
    // Parties - Required
    { id: 'writer_legal_name', type: 'text', label: 'Writer Legal Name', required: true, category: 'parties' },
    { id: 'publisher_name', type: 'text', label: 'Publisher Name', required: true, category: 'parties' },
    { id: 'publisher_address', type: 'textarea', label: 'Publisher Address', required: true, category: 'parties' },
    { id: 'pro_affiliation', type: 'select', label: 'PRO Affiliation', required: true, options: ['ASCAP', 'BMI', 'SESAC', 'GMR'], category: 'parties' },
    { id: 'ipi_cae', type: 'text', label: 'IPI/CAE Number', required: true, category: 'parties' },
    { id: 'company_representative_name', type: 'text', label: 'Company Representative Name', required: true, category: 'parties' },
    { id: 'company_representative_title', type: 'text', label: 'Company Representative Title', required: true, category: 'parties' },
    
    // Work Details - Required
    { id: 'song_titles', type: 'textarea', label: 'Song Titles (Table of Compositions)', required: true, category: 'work' },
    
    // Financial Terms - Required
    { id: 'advance_amount', type: 'number', label: 'Advance Amount ($)', required: true, category: 'financial' },
    { id: 'admin_fee_percent', type: 'number', label: 'Administration Fee (%)', required: true, category: 'financial' },
    { id: 'payment_terms', type: 'select', label: 'Payment Terms', required: true, options: ['Net 30', 'Net 45', 'Net 60'], category: 'financial' },
    { id: 'accounting_frequency', type: 'select', label: 'Accounting Frequency', required: true, options: ['Quarterly', 'Semi-Annual', 'Annual'], category: 'financial' },
    { id: 'payment_method', type: 'select', label: 'Payment Method', required: true, options: ['Direct Deposit', 'Check', 'Wire Transfer'], category: 'financial' },
    { id: 'recoupable', type: 'checkbox', label: 'Recoupable Advance', required: true, category: 'financial' },
    
    // Terms & Conditions - Required
    { id: 'territory', type: 'select', label: 'Territory', required: true, options: ['Worldwide', 'North America', 'Europe', 'United States'], category: 'terms' },
    { id: 'term_type', type: 'select', label: 'Term Type', required: true, options: ['Years', 'Life of Copyright'], category: 'terms' },
    { id: 'term_years', type: 'number', label: 'Term Years', required: true, category: 'terms' },
    { id: 'option_periods_count', type: 'number', label: 'Option Periods Count', required: true, category: 'terms' },
    
    // Signatures - Required
    { id: 'signature_block_company_enabled', type: 'checkbox', label: 'Company Signature Block', required: true, category: 'signatures' },
    { id: 'signature_block_individual_enabled', type: 'checkbox', label: 'Individual Signature Block', required: true, category: 'signatures' },
    
    // Optional Fields
    { id: 'credit_language', type: 'text', label: 'Credit Language', required: false, category: 'terms' },
    { id: 'credit_placement', type: 'text', label: 'Credit Placement', required: false, category: 'terms' }
  ],
  is_public: true
}, {
  id: '3',
  title: 'Distribution Agreement',
  description: 'AI-generated distribution contract with territory and revenue sharing terms.',
  contract_type: 'distribution',
  fields: [
    // Header - Required
    { id: 'agreement_title', type: 'text', label: 'Agreement Title', required: true, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },
    { id: 'governing_law', type: 'text', label: 'Governing Law', required: true, category: 'header' },
    { id: 'jurisdiction', type: 'text', label: 'Jurisdiction', required: true, category: 'header' },
    
    // Parties - Required
    { id: 'company_name', type: 'text', label: 'Company Name', required: true, category: 'parties' },
    { id: 'distributor_name', type: 'text', label: 'Distributor Name', required: true, category: 'parties' },
    { id: 'distributor_address', type: 'textarea', label: 'Distributor Address', required: true, category: 'parties' },
    { id: 'company_representative_name', type: 'text', label: 'Company Representative Name', required: true, category: 'parties' },
    { id: 'company_representative_title', type: 'text', label: 'Company Representative Title', required: true, category: 'parties' },
    
    // Work Details - Required
    { id: 'project_title', type: 'text', label: 'Project Title', required: true, category: 'work' },
    { id: 'isrc_list', type: 'textarea', label: 'ISRC List', required: true, category: 'work' },
    { id: 'delivery_format', type: 'select', label: 'Delivery Format', required: true, options: ['Digital Masters', 'WAV Files', 'Physical Masters'], category: 'work' },
    
    // Financial Terms - Required
    { id: 'distribution_fee_percent', type: 'number', label: 'Distribution Fee (%)', required: true, category: 'financial' },
    { id: 'payment_terms', type: 'select', label: 'Payment Terms', required: true, options: ['Net 30', 'Net 45', 'Net 60'], category: 'financial' },
    { id: 'accounting_frequency', type: 'select', label: 'Accounting Frequency', required: true, options: ['Quarterly', 'Monthly', 'Semi-Annual'], category: 'financial' },
    { id: 'payment_method', type: 'select', label: 'Payment Method', required: true, options: ['Direct Deposit', 'Check', 'Wire Transfer'], category: 'financial' },
    { id: 'late_interest_percent', type: 'number', label: 'Late Interest Rate (%)', required: true, category: 'financial' },
    
    // Terms & Conditions - Required
    { id: 'territory', type: 'select', label: 'Territory', required: true, options: ['Worldwide', 'Digital Worldwide', 'North America'], category: 'terms' },
    { id: 'term_type', type: 'select', label: 'Term Type', required: true, options: ['Years', 'Indefinite'], category: 'terms' },
    { id: 'term_years', type: 'number', label: 'Term Years', required: true, category: 'terms' },
    { id: 'media_platforms', type: 'textarea', label: 'Media Platforms', required: true, category: 'terms' },
    
    // Signatures - Required
    { id: 'signature_block_company_enabled', type: 'checkbox', label: 'Company Signature Block', required: true, category: 'signatures' },
    { id: 'signature_block_individual_enabled', type: 'checkbox', label: 'Individual Signature Block', required: true, category: 'signatures' },
    
    // Optional Fields
    { id: 'schedule_a_enabled', type: 'checkbox', label: 'Include Schedule A', required: false, category: 'schedule' }
  ],
  is_public: true
}, {
  id: '4',
  title: 'Sync Licensing Agreement',
  description: 'AI-generated synchronization license for film, TV, and digital media usage.',
  contract_type: 'sync',
  fields: [
    // Header - Required
    { id: 'agreement_title', type: 'text', label: 'Agreement Title', required: true, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },
    { id: 'governing_law', type: 'text', label: 'Governing Law', required: true, category: 'header' },
    { id: 'jurisdiction', type: 'text', label: 'Jurisdiction', required: true, category: 'header' },
    
    // Parties - Required
    { id: 'licensor_name', type: 'text', label: 'Licensor Name', required: true, category: 'parties' },
    { id: 'licensor_address', type: 'textarea', label: 'Licensor Address', required: true, category: 'parties' },
    { id: 'licensee_name', type: 'text', label: 'Licensee Name', required: true, category: 'parties' },
    { id: 'licensee_address', type: 'textarea', label: 'Licensee Address', required: true, category: 'parties' },
    { id: 'company_representative_name', type: 'text', label: 'Company Representative Name', required: true, category: 'parties' },
    { id: 'company_representative_title', type: 'text', label: 'Company Representative Title', required: true, category: 'parties' },
    
    // Work Details - Required
    { id: 'song_titles', type: 'textarea', label: 'Song Titles', required: true, category: 'work' },
    { id: 'use_description', type: 'textarea', label: 'Use Description', required: true, category: 'work' },
    { id: 'scene_duration_seconds', type: 'number', label: 'Scene Duration (Seconds)', required: true, category: 'work' },
    { id: 'project_title', type: 'text', label: 'Project Title', required: true, category: 'work' },
    
    // Financial Terms - Required
    { id: 'sync_fee_amount', type: 'number', label: 'Sync Fee Amount ($)', required: true, category: 'financial' },
    { id: 'payment_terms', type: 'select', label: 'Payment Terms', required: true, options: ['Upon Execution', 'Net 30', 'Upon Broadcast'], category: 'financial' },
    { id: 'payment_method', type: 'select', label: 'Payment Method', required: true, options: ['Check', 'Wire Transfer', 'Direct Deposit'], category: 'financial' },
    
    // Terms & Conditions - Required
    { id: 'territory', type: 'select', label: 'Territory', required: true, options: ['Worldwide', 'North America', 'United States', 'Europe'], category: 'terms' },
    { id: 'term_type', type: 'select', label: 'Term Type', required: true, options: ['Years', 'Perpetual', 'Project Duration'], category: 'terms' },
    { id: 'term_years', type: 'number', label: 'Term Years', required: true, category: 'terms' },
    { id: 'media_platforms', type: 'textarea', label: 'Media Platforms', required: true, category: 'terms' },
    { id: 'credit_language', type: 'text', label: 'Credit Language', required: true, category: 'terms' },
    { id: 'credit_placement', type: 'select', label: 'Credit Placement', required: true, options: ['End Credits', 'Opening Credits', 'Both'], category: 'terms' },
    
    // Signatures - Required
    { id: 'signature_block_company_enabled', type: 'checkbox', label: 'Company Signature Block', required: true, category: 'signatures' },
    { id: 'signature_block_individual_enabled', type: 'checkbox', label: 'Individual Signature Block', required: true, category: 'signatures' },
    
    // Optional Fields
    { id: 'option_periods_count', type: 'number', label: 'Option Periods Count', required: false, category: 'terms' },
    { id: 'schedule_a_enabled', type: 'checkbox', label: 'Include Schedule A', required: false, category: 'schedule' }
  ],
  is_public: true
}, {
  id: '5',
  title: 'Producer Agreement',
  description: 'AI-generated producer services contract with points and credit terms.',
  contract_type: 'producer',
  fields: [
    // Header - Required
    { id: 'agreement_title', type: 'text', label: 'Agreement Title', required: true, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },
    { id: 'governing_law', type: 'text', label: 'Governing Law', required: true, category: 'header' },
    { id: 'jurisdiction', type: 'text', label: 'Jurisdiction', required: true, category: 'header' },
    
    // Parties - Required
    { id: 'producer_name', type: 'text', label: 'Producer Name', required: true, category: 'parties' },
    { id: 'producer_address', type: 'textarea', label: 'Producer Address', required: true, category: 'parties' },
    { id: 'company_name', type: 'text', label: 'Company Name', required: true, category: 'parties' },
    { id: 'company_address', type: 'textarea', label: 'Company Address', required: true, category: 'parties' },
    { id: 'company_representative_name', type: 'text', label: 'Company Representative Name', required: true, category: 'parties' },
    { id: 'company_representative_title', type: 'text', label: 'Company Representative Title', required: true, category: 'parties' },
    
    // Work Details - Required
    { id: 'project_title', type: 'text', label: 'Project Title', required: true, category: 'work' },
    { id: 'number_of_tracks', type: 'number', label: 'Number of Tracks', required: true, category: 'work' },
    { id: 'genre_style', type: 'text', label: 'Genre/Style', required: true, category: 'work' },
    { id: 'delivery_format', type: 'select', label: 'Delivery Format', required: true, options: ['Pro Tools Session', 'Logic Pro X', 'Ableton Live', 'Mixed Stems'], category: 'work' },
    { id: 'commencement_date', type: 'date', label: 'Commencement Date', required: true, category: 'work' },
    { id: 'completion_date', type: 'date', label: 'Completion Date', required: true, category: 'work' },
    { id: 'delivery_date', type: 'date', label: 'Delivery Date', required: true, category: 'work' },
    
    // Financial Terms - Required
    { id: 'fixed_fee_amount', type: 'number', label: 'Fixed Fee Amount ($)', required: true, category: 'financial' },
    { id: 'producer_points_percent', type: 'number', label: 'Producer Points (%)', required: true, category: 'financial' },
    { id: 'royalty_rate_percent', type: 'number', label: 'Royalty Rate (%)', required: true, category: 'financial' },
    { id: 'payment_terms', type: 'select', label: 'Payment Terms', required: true, options: ['50% on Commencement, 50% on Delivery', 'Net 30', 'Upon Delivery'], category: 'financial' },
    { id: 'accounting_frequency', type: 'select', label: 'Accounting Frequency', required: true, options: ['Quarterly', 'Semi-Annual', 'Annual'], category: 'financial' },
    { id: 'payment_method', type: 'select', label: 'Payment Method', required: true, options: ['Direct Deposit', 'Check', 'Wire Transfer'], category: 'financial' },
    { id: 'late_interest_percent', type: 'number', label: 'Late Interest Rate (%)', required: true, category: 'financial' },
    
    // Terms & Conditions - Required
    { id: 'territory', type: 'select', label: 'Territory', required: true, options: ['Worldwide', 'North America', 'United States'], category: 'terms' },
    { id: 'term_type', type: 'select', label: 'Term Type', required: true, options: ['Project Duration', 'Years'], category: 'terms' },
    { id: 'term_years', type: 'number', label: 'Term Years', required: true, category: 'terms' },
    { id: 'exclusivity', type: 'checkbox', label: 'Exclusive Services', required: true, category: 'terms' },
    
    // Signatures - Required
    { id: 'signature_block_company_enabled', type: 'checkbox', label: 'Company Signature Block', required: true, category: 'signatures' },
    { id: 'signature_block_individual_enabled', type: 'checkbox', label: 'Individual Signature Block', required: true, category: 'signatures' },
    
    // Optional Fields
    { id: 'invoice_due_days', type: 'number', label: 'Invoice Due Days', required: false, category: 'financial' },
    { id: 'schedule_a_enabled', type: 'checkbox', label: 'Include Schedule A', required: false, category: 'schedule' }
  ],
  is_public: true
}];
const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onBack,
  onUseTemplate,
  selectionMode = false,
  onTemplateSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentView, setCurrentView] = useState<'library' | 'builder' | 'customize'>('library');
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);
  const [enhancedTemplates, setEnhancedTemplates] = useState<Record<string, any>>({});
  const {
    downloadPDF
  } = usePDFGeneration();
  useEffect(() => {
    loadTemplates();
  }, []);
  const loadTemplates = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('contract_templates').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setCustomTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    }
  };
  const filteredPublicTemplates = DEMO_TEMPLATES.filter(template => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (template.title?.toLowerCase() || '').includes(searchLower) || (template.description?.toLowerCase() || '').includes(searchLower) || (template.contract_type?.toLowerCase() || '').includes(searchLower);
    const matchesType = filterType === 'all' || template.contract_type === filterType;
    return matchesSearch && matchesType;
  });
  const filteredCustomTemplates = customTemplates.filter(template => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (template.template_name?.toLowerCase() || '').includes(searchLower) || (template.contract_type?.toLowerCase() || '').includes(searchLower);
    const matchesType = filterType === 'all' || template.contract_type === filterType;
    return matchesSearch && matchesType;
  });
  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setCurrentView('builder');
  };
  const handleUseTemplate = async (template: any) => {
    if (selectionMode && onTemplateSelect) {
      onTemplateSelect(template);
      return;
    }

    // For popular templates, ensure we have the enhanced version
    if (template.is_public && !enhancedTemplates[template.contract_type]) {
      await generateStandardizedTemplate(template.contract_type);
    }

    // Enhance the template with AI-generated fields if available
    let enhancedTemplate = template;
    if (enhancedTemplates[template.contract_type]) {
      const templateData = enhancedTemplates[template.contract_type];
      enhancedTemplate = {
        ...template,
        template_data: {
          fields: templateData.templateFields || [],
          clauses: {},
          contractContent: templateData.contractContent
        }
      };
    }
    setSelectedTemplate(enhancedTemplate);
    setCurrentView('customize');
  };
  const handleTemplateSaved = async (savedTemplate: any) => {
    console.log('Template saved callback triggered:', savedTemplate);
    // Refresh the templates list
    await loadTemplates();
    setCurrentView('library');
    setEditingTemplate(null);
    toast.success('Template saved successfully!');
  };
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const {
        error
      } = await supabase.from('contract_templates').delete().eq('id', templateId);
      if (error) throw error;
      await loadTemplates();
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };
  const handleContractSaved = (contractData: any) => {
    if (onUseTemplate) {
      onUseTemplate(contractData);
    }
    setCurrentView('library');
    setSelectedTemplate(null);
  };
  const generateStandardizedTemplate = async (contractType: string) => {
    setGeneratingTemplate(contractType);
    try {
      // For now, create a fallback template until the Edge Function is deployed
      const fallbackTemplate = {
        contractContent: generateFallbackTemplate(contractType),
        templateFields: generateFallbackFields(contractType),
        generated: true
      };

      // Store the enhanced template data
      setEnhancedTemplates(prev => ({
        ...prev,
        [contractType]: fallbackTemplate
      }));
      toast.success('Template generated successfully!');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template');
    } finally {
      setGeneratingTemplate(null);
    }
  };
  const generateFallbackTemplate = (contractType: string): string => {
    const templates = {
      artist_recording: "## HEADER\nRECORDING AGREEMENT (\"Agreement\") effective {{effective_date}}.\n\n## PARTIES\nBetween {{company_name}} (\"Company\") at {{company_address}} and {{artist_legal_name}} p/k/a {{artist_stage_name}} (\"Artist\").\n\n## WORK_DETAILS\nArtist will record {{number_of_tracks}} master recording(s) (the \"Masters\") for the project {{project_title}} in {{delivery_format}} format. ISRCs (if assigned): {{isrc_list}}.\n\n## FINANCIAL_TERMS\nRoyalties: {{royalty_rate_percent}}% of the applicable royalty base. Accounting: {{accounting_frequency}}; Payment Terms: {{payment_terms}} via {{payment_method}}. Advances/Fees: ${{advance_amount}} (recoupable: {{recoupable}}). Late Interest: {{late_interest_percent}}%.\n\n## TERMS\nTerm: {{term_type}} (years: {{term_years}}, albums: {{album_commitment}}). Territory: {{territory}}. Exclusivity applies: {{exclusivity}}. Re‑record restriction: {{re_record_restriction_years}} year(s).\nUnion: {{union_name}}. Governing Law: {{governing_law}}; Venue: {{jurisdiction}}.\n\n## SCHEDULES\nSchedule A (Track List): {{schedule_a_enabled}}.\n\n## SIGNATURES\nCompany: {{company_representative_name}}, {{company_representative_title}}\nArtist: {{artist_legal_name}}",
      publishing: "## HEADER\nPUBLISHING ADMINISTRATION AGREEMENT effective {{effective_date}}.\n\n## PARTIES\nBetween {{writer_legal_name}} (IPI/CAE: {{ipi_cae}}, PRO: {{pro_affiliation}}) and {{publisher_name}} at {{publisher_address}} (\"Administrator\").\n\n## WORK_DETAILS\nCompositions listed in Schedule A (title, ISWC, writers, publishers).\nDistribution Cycle: {{accounting_frequency}}.\n\n## FINANCIAL_TERMS\nAdministration Fee: {{admin_fee_percent}}%. Advance: ${{advance_amount}} (recoupable: {{recoupable}}). Payment Terms: {{payment_terms}} via {{payment_method}}.\n\n## TERMS\nGrant: exclusive administration in {{territory}} for {{term_type}} (years: {{term_years}}; option periods: {{option_periods_count}}). PRO writer share direct to Writer; publisher share to Administrator for accounting. Governing Law: {{governing_law}}; Venue: {{jurisdiction}}.\n\n## SCHEDULES\nSchedule A (Works Table): {{schedule_a_enabled}}.\n\n## SIGNATURES\nAdministrator: {{company_representative_name}}, {{company_representative_title}}\nWriter: {{writer_legal_name}}",
      distribution: "## HEADER\nDISTRIBUTION AGREEMENT effective {{effective_date}}.\n\n## PARTIES\nBetween {{company_name}} (\"Company/Label\") and {{distributor_name}} at {{distributor_address}} (\"Distributor\").\n\n## WORK_DETAILS\nRecordings: {{project_title}}; Formats: {{delivery_format}}; ISRCs: {{isrc_list}}.\n\n## FINANCIAL_TERMS\nDistribution Fee: {{distribution_fee_percent}}% of Gross Receipts. Accounting: {{accounting_frequency}}; Payment Terms: {{payment_terms}} via {{payment_method}}. Late Interest: {{late_interest_percent}}%.\n\n## TERMS\nTerritory: {{territory}}. Term: {{term_type}} (years: {{term_years}}). Media/Platforms: {{media_platforms}}. Title to masters remains with Company. Governing Law: {{governing_law}}; Venue: {{jurisdiction}}.\n\n## SIGNATURES\nCompany: {{company_representative_name}}, {{company_representative_title}}\nDistributor: {{company_representative_name}} (Distributor), {{company_representative_title}}",
      sync: "## HEADER\nSYNCHRONIZATION LICENSE AGREEMENT effective {{effective_date}}.\n\n## PARTIES\nLicensor: {{licensor_name}} at {{licensor_address}}. Licensee: {{licensee_name}} at {{licensee_address}}.\n\n## WORK_DETAILS\nComposition(s): Schedule A (title, ISWC, writers, publishers). Use: {{use_description}}; Scene Duration (sec): {{scene_duration_seconds}}. Production Title: {{project_title}}.\n\n## FINANCIAL_TERMS\nSync Fee: ${{sync_fee_amount}}. Payment Terms: {{payment_terms}} via {{payment_method}}.\n\n## TERMS\nTerritory: {{territory}}. Term: {{term_type}} (years: {{term_years}}; festival‑only if selected). Media/Platforms: {{media_platforms}}. Credit: {{credit_language}} (placement: {{credit_placement}}). Governing Law: {{governing_law}}; Venue: {{jurisdiction}}.\n\n## SIGNATURES\nLicensor: {{company_representative_name}}, {{company_representative_title}}\nLicensee: {{company_representative_name}}, {{company_representative_title}}",
      producer: "## HEADER\nMUSIC PRODUCTION AGREEMENT effective {{effective_date}}.\n\n## PARTIES\nProducer: {{producer_name}} at {{producer_address}}. Client: {{company_name}} at {{company_address}}.\n\n## WORK_DETAILS\nProject: {{project_title}}; Tracks: {{number_of_tracks}}; Genre: {{genre_style}}; Delivery: {{delivery_format}}.\nDates: Commence {{commencement_date}}; Complete {{completion_date}}; Delivery {{delivery_date}}.\n\n## FINANCIAL_TERMS\nFixed Fee: ${{fixed_fee_amount}}; Producer Points on Master: {{producer_points_percent}}%; Additional Royalty: {{royalty_rate_percent}}% (if any). Accounting {{accounting_frequency}}; Payment Terms {{payment_terms}} via {{payment_method}}. Late Interest {{late_interest_percent}}%.\n\n## TERMS\nWork-made-for-hire (Client owns Masters), subject to payment of Fees and Points. Indemnities and limitations standard. Governing Law: {{governing_law}}; Venue: {{jurisdiction}}.\n\n## SIGNATURES\nProducer: {{producer_name}}\nClient: {{company_representative_name}}, {{company_representative_title}}"
    };
    return templates[contractType as keyof typeof templates] || templates.artist_recording;
  };
  const generateFallbackFields = (contractType: string) => {
    const fieldSets = {
      artist_recording: [{
        id: 'effective_date',
        name: 'effective_date',
        label: 'Effective Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }, {
        id: 'label_name',
        name: 'label_name',
        label: 'Company Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'artist_name',
        name: 'artist_name',
        label: 'Artist Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'term_length',
        name: 'term_length',
        label: 'Term Length',
        type: 'select',
        required: true,
        category: 'terms',
        options: ['1 year', '2 years', '3 years', '5 years']
      }, {
        id: 'minimum_selections',
        name: 'minimum_selections',
        label: 'Minimum Selections',
        type: 'number',
        required: true,
        category: 'terms'
      }, {
        id: 'royalty_rate',
        name: 'royalty_rate',
        label: 'Royalty Rate (cents)',
        type: 'number',
        required: true,
        category: 'financial'
      }, {
        id: 'payment_month',
        name: 'payment_month',
        label: 'First Payment Month',
        type: 'select',
        required: true,
        category: 'financial',
        options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      }, {
        id: 'first_period_end',
        name: 'first_period_end',
        label: 'First Period End Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }, {
        id: 'second_payment_month',
        name: 'second_payment_month',
        label: 'Second Payment Month',
        type: 'select',
        required: true,
        category: 'financial',
        options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      }, {
        id: 'second_period_end',
        name: 'second_period_end',
        label: 'Second Period End Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }],
      publishing: [{
        id: 'effective_date',
        name: 'effective_date',
        label: 'Effective Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }, {
        id: 'publisher_name',
        name: 'publisher_name',
        label: 'Publisher Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'songwriter_name',
        name: 'songwriter_name',
        label: 'Songwriter Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'ownership_percentage',
        name: 'ownership_percentage',
        label: 'Ownership %',
        type: 'number',
        required: true,
        category: 'financial'
      }, {
        id: 'term_length',
        name: 'term_length',
        label: 'Term Length (Years)',
        type: 'number',
        required: true,
        category: 'terms'
      }, {
        id: 'territory',
        name: 'territory',
        label: 'Territory',
        type: 'select',
        required: true,
        category: 'terms',
        options: ['Worldwide', 'North America', 'Europe']
      }, {
        id: 'advance_amount',
        name: 'advance_amount',
        label: 'Advance Amount',
        type: 'number' as const,
        required: false,
        category: 'financial' as const
      }, {
        id: 'publisher_share',
        name: 'publisher_share',
        label: 'Publisher Share %',
        type: 'number',
        required: true,
        category: 'financial'
      }, {
        id: 'writer_share',
        name: 'writer_share',
        label: 'Writer Share %',
        type: 'number',
        required: true,
        category: 'financial'
      }],
      distribution: [{
        id: 'effective_date',
        name: 'effective_date',
        label: 'Effective Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }, {
        id: 'distributor_name',
        name: 'distributor_name',
        label: 'Distributor Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'artist_name',
        name: 'artist_name',
        label: 'Artist Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'territory',
        name: 'territory',
        label: 'Territory',
        type: 'select',
        required: true,
        category: 'terms',
        options: ['Worldwide', 'North America', 'Europe']
      }, {
        id: 'term_duration',
        name: 'term_duration',
        label: 'Term Duration',
        type: 'select',
        required: true,
        category: 'terms',
        options: ['1 Year', '2 Years', '3 Years']
      }, {
        id: 'distributor_percentage',
        name: 'distributor_percentage',
        label: 'Distributor %',
        type: 'number',
        required: true,
        category: 'financial'
      }, {
        id: 'artist_percentage',
        name: 'artist_percentage',
        label: 'Artist %',
        type: 'number',
        required: true,
        category: 'financial'
      }, {
        id: 'delivery_date',
        name: 'delivery_date',
        label: 'Delivery Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }],
      sync: [{
        id: 'effective_date',
        name: 'effective_date',
        label: 'Effective Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }, {
        id: 'licensor_name',
        name: 'licensor_name',
        label: 'Licensor Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'licensee_name',
        name: 'licensee_name',
        label: 'Licensee Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'composition_title',
        name: 'composition_title',
        label: 'Composition Title',
        type: 'text',
        required: true,
        category: 'terms'
      }, {
        id: 'project_title',
        name: 'project_title',
        label: 'Project Title',
        type: 'text',
        required: true,
        category: 'terms'
      }, {
        id: 'usage_type',
        name: 'usage_type',
        label: 'Usage Type',
        type: 'select',
        required: true,
        category: 'terms',
        options: ['Film', 'TV', 'Commercial', 'Web']
      }, {
        id: 'territory',
        name: 'territory',
        label: 'Territory',
        type: 'select',
        required: true,
        category: 'terms',
        options: ['Worldwide', 'North America', 'Europe']
      }, {
        id: 'duration',
        name: 'duration',
        label: 'Duration',
        type: 'select',
        required: true,
        category: 'terms',
        options: ['1 Year', '3 Years', '5 Years', 'Perpetual']
      }, {
        id: 'sync_fee',
        name: 'sync_fee',
        label: 'Sync Fee',
        type: 'number' as const,
        required: true,
        category: 'financial' as const
      }, {
        id: 'start_date',
        name: 'start_date',
        label: 'Start Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }, {
        id: 'end_date',
        name: 'end_date',
        label: 'End Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }],
      producer: [{
        id: 'effective_date',
        name: 'effective_date',
        label: 'Effective Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }, {
        id: 'artist_name',
        name: 'artist_name',
        label: 'Artist Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'producer_name',
        name: 'producer_name',
        label: 'Producer Name',
        type: 'text',
        required: true,
        category: 'parties'
      }, {
        id: 'track_count',
        name: 'track_count',
        label: 'Number of Tracks',
        type: 'number',
        required: true,
        category: 'terms'
      }, {
        id: 'project_title',
        name: 'project_title',
        label: 'Project Title',
        type: 'text',
        required: true,
        category: 'terms'
      }, {
        id: 'producer_fee',
        name: 'producer_fee',
        label: 'Producer Fee',
        type: 'number' as const,
        required: true,
        category: 'financial' as const
      }, {
        id: 'royalty_points',
        name: 'royalty_points',
        label: 'Royalty Points',
        type: 'number',
        required: false,
        category: 'financial'
      }, {
        id: 'delivery_date',
        name: 'delivery_date',
        label: 'Delivery Date',
        type: 'date',
        required: true,
        category: 'schedule'
      }]
    };
    return fieldSets[contractType as keyof typeof fieldSets] || fieldSets.artist_recording;
  };
  const downloadTemplatePDF = async (template: Template) => {
    if (!enhancedTemplates[template.contract_type]) {
      // Generate the template first
      await generateStandardizedTemplate(template.contract_type);
      return;
    }
    try {
      const enhancedTemplate = enhancedTemplates[template.contract_type];

      // Create properly formatted HTML content for PDF conversion
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; max-width: 800px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #333; margin-bottom: 10px;">${template.title}</h1>
            <p style="color: #666; font-size: 14px;">Professional Music Industry Agreement Template</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin-top: 0; color: #444;">Template Fields Available:</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
              ${enhancedTemplate.templateFields.map((field: any) => `<div style="background: white; padding: 8px 12px; border-radius: 4px; font-size: 12px;">
                  <strong>${field.label}</strong><br>
                  <span style="color: #666;">\{{${field.name}}}</span>
                </div>`).join('')}
            </div>
          </div>
          
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">
            ${enhancedTemplate.contractContent.replace(/\{\{(\w+)\}\}/g, '<span style="background: #fff3cd; padding: 2px 4px; border-radius: 3px; font-weight: bold;">{{$1}}</span>')}
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 12px; color: #666;">
            <p><strong>Note:</strong> This is a template with placeholder fields marked as {{field_name}}. 
            Use the "Use" button to customize this template with actual values.</p>
          </div>
        </div>
      `;

      // Use the existing PDF generation hook to create a proper PDF
      await downloadPDF(htmlContent, `${template.title.replace(/\s+/g, '_')}_Template`);
      toast.success('PDF template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };
  if (currentView === 'builder') {
    return <TemplateBuilder onBack={() => {
      setCurrentView('library');
      setEditingTemplate(null);
    }} contractType={editingTemplate?.contract_type} existingTemplate={editingTemplate} onTemplateSaved={handleTemplateSaved} />;
  }

  // Preview view removed per new flow

  if (currentView === 'customize') {
    return <CustomizeContractForm template={selectedTemplate!} onBack={() => {
      setCurrentView('library');
      setSelectedTemplate(null);
    }} onSave={handleContractSaved} />;
  }
  return <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-2xl font-bold">Contract Templates</h1>
            <p className="text-muted-foreground">
              {selectionMode ? "Select a template to use" : "Choose from public templates or create your own"}
            </p>
          </div>
        </div>
        {!selectionMode && <Button onClick={() => setCurrentView('builder')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>}
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="artist_recording">Artist Recording</SelectItem>
              <SelectItem value="publishing">Publishing</SelectItem>
              <SelectItem value="distribution">Distribution</SelectItem>
              <SelectItem value="sync">Sync Licensing</SelectItem>
              <SelectItem value="producer">Producer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates with proper scrolling */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full px-6">
          <div className="py-6 space-y-10">
            {/* Your Templates at the top */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Your Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {filteredCustomTemplates.map(template => <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.template_name || 'Untitled Template'}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Custom {template.contract_type?.replace('_', ' ') || 'contract'} template
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Custom
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {!selectionMode && <>
                            <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" aria-label="Delete template" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete template?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the template and any unsaved work based on it.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteTemplate(template.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>}
                        <Button size="sm" onClick={() => handleUseTemplate(template)} className="gap-2">
                          <Settings className="h-4 w-4" />
                          {selectionMode ? 'Select' : 'Use'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>

              {filteredCustomTemplates.length === 0 && <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {customTemplates.length === 0 ? "You haven't created any templates yet." : "No custom templates found matching your criteria."}
                  </p>
                  {!selectionMode && <Button onClick={() => setCurrentView('builder')} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Template
                    </Button>}
                </div>}
            </section>

            {/* Popular Templates below */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Popular Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {filteredPublicTemplates.map(template => <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {template.contract_type?.replace('_', ' ') || 'Contract'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {!selectionMode && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => downloadTemplatePDF(template)} disabled={generatingTemplate === template.contract_type} className="gap-2">
                              <FileText className="h-4 w-4" />
                              {generatingTemplate === template.contract_type ? 'Generating...' : 'PDF'}
                            </Button>
                          </>
                        )}
                        <Button size="sm" onClick={() => handleUseTemplate(template)} className="gap-2">
                          <Settings className="h-4 w-4" />
                          {selectionMode ? 'Select' : 'Use'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>

              {filteredPublicTemplates.length === 0 && <div className="text-center py-12">
                  <p className="text-muted-foreground">No public templates found matching your criteria.</p>
                </div>}
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>;
};
export default TemplateLibrary;