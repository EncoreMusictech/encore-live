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
  description: 'AI-generated professional recording artist agreement with industry-standard terms.',
  contract_type: 'artist_recording',
  fields: [],
  is_public: true
}, {
  id: '2',
  title: 'Music Publishing Agreement',
  description: 'AI-generated comprehensive songwriter and publisher agreement with royalty splits.',
  contract_type: 'publishing',
  fields: [],
  is_public: true
}, {
  id: '3',
  title: 'Distribution Agreement',
  description: 'AI-generated distribution contract with territory and revenue sharing terms.',
  contract_type: 'distribution',
  fields: [],
  is_public: true
}, {
  id: '4',
  title: 'Sync Licensing Agreement',
  description: 'AI-generated synchronization license for film, TV, and digital media usage.',
  contract_type: 'sync',
  fields: [],
  is_public: true
}, {
  id: '5',
  title: 'Producer Agreement',
  description: 'AI-generated producer services contract with points and credit terms.',
  contract_type: 'producer',
  fields: [],
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
      artist_recording: `
ARTIST RECORDING CONTRACT

1. AGREEMENT made as of {{effective_date}}, between {{label_name}} (herein called "the Company") and {{artist_name}} (herein called "the Artist") for the tendering of personal services in connection with the production of Commercial Sound Records.

2. This agreement shall remain in effect for a period of {{term_length}} from the date hereof, and during that period you will, at mutually convenient times, come to and perform at the Company's recording studios for the purpose of recording {{minimum_selections}} selections or more than this number if the Company so desires.

In consideration of this Agreement and without further payment than as herein provided for yourself, you grant to the Company, its associates, subsidiaries and nominees (1) the right to manufacture, advertise, sell, lease, license or otherwise use or dispose of in any or all fields of use, throughout the world, or to refrain therefrom, throughout the world or any part thereof, records embodying the performances to be recorded hereunder, upon such terms and conditions as the Company may approve; (2) the right to use your name and photograph if desired, in connection with the exploitation of said records; and (3) all rights in and to the matrices and records, and the use and control thereof, upon which are reproduced the performances to be recorded hereunder.

3. The Company will pay you for the rights granted herein and the services to be rendered hereunder by you a royalty of {{royalty_rate}} cents for each double-faced record manufactured and sold throughout the world by the Company or its associates or subsidiaries, on both faces of which are embodied any of the selections recorded hereunder. In case of records manufactured and sold by the Company on only one face of which is embodied a selection recorded hereunder, the amount of royalty shall be one-half of the amount set forth above, excepting in cases where the recording shall be of full length on one side (in such case as a Compact Disk).

4. Payment of accrued royalties shall be made semi-annually on the first day of {{payment_month}} for the period ending {{first_period_end}}, and on the first day of {{second_payment_month}} for the period ending {{second_period_end}} of each year. The Company, however, shall have the right to deduct from the amount of any statements, or accounts of royalties due, the amount of royalties previously paid to you or records subsequently returned, either as defective or on exchange proposition.

5. You agree that during the period of this Agreement you will not perform for any other person, firm or corporation, for the purpose of producing commercial sound records, that after the expiration of this Agreement you will not record for anyone else any of the musical selections recorded hereunder, and that in the event of a breach of this covenant, the Company shall be entitled to an injunction to enforce same, in addition to any other remedies available to it.

6. The Artist hereby warrants that he has no oral or written obligations contracts, or agreements of whatever nature entered into prior to the signing of this agreement which are now in force and binding and which would in any way interfere with carrying out this agreement to its full intent and purpose.

7. If any instrumental musicians whose services are engaged hereunder are members of the American Federation of Musicians, the following provision shall be deemed to be a part of this agreement: "As the musicians engaged under the stipulations of this contract are members of the American Federation of Musicians, nothing in this contract shall ever be construed as to interfere with any obligation which they owe to the American Federation of Musicians as members thereof."

8. It is mutually understood and agreed that in the event the license issued to the Company by the American Federation of Musicians, and pursuant to which the Company engages the services of Federation members as instrumental musicians, should be revoked or terminated, with or without cause, and in the event you or any of the members of the Musical Organization are members of the Federation, the Company may, at its option, terminate and cancel this agreement without liability to you.

9. The Company shall have the privilege and option to extend this Agreement from the date of its expiration for a period equal to the terms of this Agreement by giving to you notice in writing of its exercise of such option and its election to continue. Such notice shall be given to you personally or be mailed to your last known address not less than ten days prior to the expiration of this Agreement. Upon the giving of such notice this Agreement shall be continued and extended for such further period upon the same terms as those above set forth.

ACCEPTED AND AGREED TO:

Company: {{label_name}}

Artist: {{artist_name}}
      `,
      publishing: `
MUSIC PUBLISHING AGREEMENT

This Publishing Agreement ("Agreement") is entered into on {{effective_date}} between {{publisher_name}} ("Publisher") and {{songwriter_name}} ("Songwriter").

1. GRANT OF RIGHTS
Songwriter hereby grants to Publisher {{ownership_percentage}}% of all rights in the musical compositions listed in Schedule A.

2. TERM
This Agreement shall commence on {{effective_date}} and continue for {{term_length}} years.

3. TERRITORY
The territory of this Agreement is {{territory}}.

4. ADVANCE
Publisher shall pay Songwriter an advance of $\{{advance_amount}} upon execution.

5. ROYALTY SPLITS
Publisher shall receive {{publisher_share}}% and Songwriter shall receive {{writer_share}}% of all income.

6. ADMINISTRATION
Publisher shall administer the compositions and collect all income on behalf of both parties.

7. STATEMENTS
Publisher shall provide quarterly statements and payments to Songwriter.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Publisher: {{publisher_name}}
Songwriter: {{songwriter_name}}
      `,
      distribution: `
DISTRIBUTION AGREEMENT

This Distribution Agreement ("Agreement") is entered into on {{effective_date}} between {{distributor_name}} ("Distributor") and {{artist_name}} ("Artist").

1. DISTRIBUTION RIGHTS
Artist grants Distributor the exclusive right to distribute the recordings in {{territory}}.

2. TERM
This Agreement shall be effective for {{term_duration}}.

3. REVENUE SPLIT
Distributor shall retain {{distributor_percentage}}% and Artist shall receive {{artist_percentage}}% of net receipts.

4. DELIVERY
Artist shall deliver masters and all required materials by {{delivery_date}}.

5. MARKETING
Distributor agrees to use reasonable efforts to market and promote the recordings.

6. STATEMENTS
Distributor shall provide monthly statements and payments.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Distributor: {{distributor_name}}
Artist: {{artist_name}}
      `,
      sync: `
SYNCHRONIZATION LICENSE

This Synchronization License ("License") is granted on {{effective_date}} between {{licensor_name}} ("Licensor") and {{licensee_name}} ("Licensee").

1. COMPOSITION
Licensor grants rights to the musical composition "{{composition_title}}" for use in {{project_title}}.

2. USAGE
Licensed for {{usage_type}} in {{territory}} for {{duration}}.

3. FEE
Licensee shall pay a synchronization fee of $\{{sync_fee}}.

4. TERM
This license is effective from {{start_date}} to {{end_date}}.

5. RESTRICTIONS
Usage is limited to the specific project and territory described herein.

6. CREDITS
Licensee shall provide appropriate music credits.

IN WITNESS WHEREOF, the parties have executed this License.

Licensor: {{licensor_name}}
Licensee: {{licensee_name}}
      `,
      producer: `
PRODUCER AGREEMENT

This Producer Agreement ("Agreement") is entered into on {{effective_date}} between {{artist_name}} ("Artist") and {{producer_name}} ("Producer").

1. SERVICES
Producer agrees to produce {{track_count}} tracks for Artist's project "{{project_title}}".

2. FEE
Artist shall pay Producer $\{{producer_fee}} plus \{{royalty_points}} points on net sales.

3. DELIVERY
Producer shall deliver completed masters by {{delivery_date}}.

4. CREDITS
Producer shall receive producer credit on all recordings and related materials.

5. OWNERSHIP
Producer assigns all rights to the master recordings to Artist, retaining producer royalties.

6. WARRANTIES
Producer warrants the originality of all musical contributions.

IN WITNESS WHEREOF, the parties have executed this Agreement.

Artist: {{artist_name}}
Producer: {{producer_name}}
      `
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
                        {!selectionMode && <Button variant="outline" size="sm" onClick={() => downloadTemplatePDF(template)} disabled={generatingTemplate === template.contract_type} className="gap-2">
                            <FileText className="h-4 w-4" />
                            {generatingTemplate === template.contract_type ? 'Generating...' : 'PDF'}
                          </Button>}
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