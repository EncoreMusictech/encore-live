
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Search, Filter, Eye, FileText, Edit, Trash2, Settings } from 'lucide-react';
import { TemplateBuilder } from './TemplateBuilder';
import { TemplatePreview } from './TemplatePreview';
import { CustomizeContractForm } from './CustomizeContractForm';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
}

const DEMO_TEMPLATES: Template[] = [
  {
    id: '1',
    title: 'Standard Recording Contract',
    description: 'A basic contract for recording artists.',
    contract_type: 'artist_recording',
    fields: [],
    is_public: true,
  },
  {
    id: '2',
    title: 'Music Publishing Agreement',
    description: 'Agreement between a songwriter and a music publisher.',
    contract_type: 'publishing',
    fields: [],
    is_public: true,
  },
  {
    id: '3',
    title: 'Distribution Agreement',
    description: 'Contract for distributing music through various channels.',
    contract_type: 'distribution',
    fields: [],
    is_public: true,
  },
  {
    id: '4',
    title: 'Licensing Agreement',
    description: 'Agreement for licensing music for film, TV, or other media.',
    contract_type: 'licensing',
    fields: [],
    is_public: true,
  },
];

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onBack, onUseTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentView, setCurrentView] = useState<'library' | 'builder' | 'preview' | 'customize'>('library');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const filteredPublicTemplates = DEMO_TEMPLATES.filter(template => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (template.title?.toLowerCase() || '').includes(searchLower) ||
      (template.description?.toLowerCase() || '').includes(searchLower) ||
      (template.contract_type?.toLowerCase() || '').includes(searchLower);
    
    const matchesType = filterType === 'all' || template.contract_type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredCustomTemplates = customTemplates.filter(template => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (template.template_name?.toLowerCase() || '').includes(searchLower) ||
      (template.contract_type?.toLowerCase() || '').includes(searchLower);
    
    const matchesType = filterType === 'all' || template.contract_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleEditTemplate = (template: any) => {
    setEditingTemplate({
      id: template.id,
      template_name: template.template_name,
      contract_type: template.contract_type,
      template_data: template.template_data
    });
    setCurrentView('builder');
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
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
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', templateId);

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

  if (currentView === 'builder') {
    return (
      <TemplateBuilder
        onBack={() => {
          setCurrentView('library');
          setEditingTemplate(null);
        }}
        contractType={editingTemplate?.contract_type}
        existingTemplate={editingTemplate}
        onTemplateSaved={handleTemplateSaved}
      />
    );
  }

  if (currentView === 'preview') {
    return (
      <TemplatePreview
        contractType={previewTemplate?.contract_type || ''}
        onBack={() => setCurrentView('library')}
        onUse={() => handleUseTemplate(previewTemplate!)}
      />
    );
  }

  if (currentView === 'customize') {
    return (
      <CustomizeContractForm
        template={selectedTemplate!}
        onBack={() => {
          setCurrentView('library');
          setSelectedTemplate(null);
        }}
        onSave={handleContractSaved}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Contracts
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contract Templates</h1>
            <p className="text-muted-foreground">Choose from public templates or create your own</p>
          </div>
        </div>
        <Button onClick={() => setCurrentView('builder')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
              <SelectItem value="licensing">Licensing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="public" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
            <TabsTrigger value="public">Public Templates</TabsTrigger>
            <TabsTrigger value="custom">Your Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublicTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewTemplate(template);
                          setCurrentView('preview');
                        }}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success('PDF generation coming soon!')}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPublicTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No public templates found matching your criteria.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Use
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCustomTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {customTemplates.length === 0 
                    ? "You haven't created any templates yet."
                    : "No custom templates found matching your criteria."
                  }
                </p>
                <Button onClick={() => setCurrentView('builder')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Template
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TemplateLibrary;
