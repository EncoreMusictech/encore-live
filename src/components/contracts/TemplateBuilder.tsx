import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Send, Save, Plus, Trash2, GripVertical, Edit3, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import { useClauseAI } from "@/hooks/useClauseAI";
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

interface TemplateBuilderProps {
  onBack: () => void;
  contractType?: string;
  existingTemplate?: {
    id: string;
    template_name: string;
    contract_type: string;
    template_data?: any;
  };
  onTemplateSaved?: (template: any) => void;
}

const FIELD_TEMPLATES: Record<string, ContractField[]> = {
  'artist_recording': [
    // Header
    { id: 'document_title', type: 'text', label: 'Document Title', required: false, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },

    // Core
    { id: 'artist_name', type: 'text', label: 'Artist Name', required: true, category: 'parties' },
    { id: 'label_name', type: 'text', label: 'Record Label', required: true, category: 'parties' },
    { id: 'album_title', type: 'text', label: 'Album/EP Title', required: true, category: 'work' },
    { id: 'advance_amount', type: 'number', label: 'Advance Amount ($)', required: false, category: 'financial' },
    { id: 'royalty_rate', type: 'select', label: 'Royalty Rate', required: true, options: ['10%', '12%', '15%', '18%', '20%'], category: 'financial' },
    { id: 'term_duration', type: 'select', label: 'Contract Term', required: true, options: ['1 Year', '2 Years', '3 Years', '5 Years'], category: 'terms' },
    { id: 'territory', type: 'select', label: 'Territory', required: true, options: ['Worldwide', 'North America', 'Europe', 'Specific Territories'], category: 'terms' },
    { id: 'delivery_date', type: 'date', label: 'Delivery Date', required: true, category: 'schedule' },

    // Signatures
    { id: 'party_one_name', type: 'text', label: 'Party One Name', required: true, category: 'signatures' },
    { id: 'party_one_title', type: 'text', label: 'Party One Title', required: false, category: 'signatures' },
    { id: 'party_two_name', type: 'text', label: 'Party Two Name', required: true, category: 'signatures' },
    { id: 'party_two_title', type: 'text', label: 'Party Two Title', required: false, category: 'signatures' },
    { id: 'signature_date', type: 'date', label: 'Signature Date', required: false, category: 'signatures' },
  ],
  'publishing': [
    // Header
    { id: 'document_title', type: 'text', label: 'Document Title', required: false, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },

    // Core
    { id: 'songwriter_name', type: 'text', label: 'Songwriter Name', required: true, category: 'parties' },
    { id: 'publisher_name', type: 'text', label: 'Publisher Name', required: true, category: 'parties' },
    { id: 'composition_title', type: 'text', label: 'Composition Title', required: true, category: 'work' },
    { id: 'publishing_split', type: 'select', label: 'Publishing Split', required: true, options: ['50/50', '60/40', '70/30', '80/20', '90/10'], category: 'financial' },
    { id: 'mechanical_rate', type: 'text', label: 'Mechanical Rate', placeholder: 'e.g., Statutory Rate', required: true, category: 'financial' },
    { id: 'performance_split', type: 'select', label: 'Performance Split', required: true, options: ['50/50', '60/40', '70/30', '80/20'], category: 'financial' },
    { id: 'sync_approval', type: 'select', label: 'Sync Approval Rights', required: true, options: ['Mutual Approval', 'Publisher Approval', 'Writer Approval'], category: 'terms' },
    { id: 'term_length', type: 'select', label: 'Term Length', required: true, options: ['Life of Copyright', '10 Years', '15 Years', '20 Years'], category: 'terms' },

    // Signatures
    { id: 'party_one_name', type: 'text', label: 'Party One Name', required: true, category: 'signatures' },
    { id: 'party_one_title', type: 'text', label: 'Party One Title', required: false, category: 'signatures' },
    { id: 'party_two_name', type: 'text', label: 'Party Two Name', required: true, category: 'signatures' },
    { id: 'party_two_title', type: 'text', label: 'Party Two Title', required: false, category: 'signatures' },
    { id: 'signature_date', type: 'date', label: 'Signature Date', required: false, category: 'signatures' },
  ],
  'distribution': [
    // Header
    { id: 'document_title', type: 'text', label: 'Document Title', required: false, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },

    // Core
    { id: 'artist_label', type: 'text', label: 'Artist/Label Name', required: true, category: 'parties' },
    { id: 'distributor_name', type: 'text', label: 'Distributor Name', required: true, category: 'parties' },
    { id: 'product_title', type: 'text', label: 'Product Title', required: true, category: 'work' },
    { id: 'distribution_fee', type: 'select', label: 'Distribution Fee', required: true, options: ['15%', '20%', '25%', '30%'], category: 'financial' },
    { id: 'platforms', type: 'select', label: 'Distribution Platforms', required: true, options: ['All Digital', 'Spotify/Apple Only', 'Physical Only', 'Custom Selection'], category: 'terms' },
    { id: 'territory_dist', type: 'select', label: 'Distribution Territory', required: true, options: ['Worldwide', 'Digital Worldwide', 'North America Only'], category: 'terms' },
    { id: 'term_years', type: 'select', label: 'Agreement Term', required: true, options: ['2 Years', '3 Years', '5 Years', 'Indefinite'], category: 'terms' },

    // Signatures
    { id: 'party_one_name', type: 'text', label: 'Party One Name', required: true, category: 'signatures' },
    { id: 'party_one_title', type: 'text', label: 'Party One Title', required: false, category: 'signatures' },
    { id: 'party_two_name', type: 'text', label: 'Party Two Name', required: true, category: 'signatures' },
    { id: 'party_two_title', type: 'text', label: 'Party Two Title', required: false, category: 'signatures' },
    { id: 'signature_date', type: 'date', label: 'Signature Date', required: false, category: 'signatures' },
  ],
  'licensing': [
    // Header
    { id: 'document_title', type: 'text', label: 'Document Title', required: false, category: 'header' },
    { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },

    // Core
    { id: 'licensor_name', type: 'text', label: 'Licensor Name', required: true, category: 'parties' },
    { id: 'licensee_name', type: 'text', label: 'Licensee Name', required: true, category: 'parties' },
    { id: 'track_title', type: 'text', label: 'Track Title', required: true, category: 'work' },
    { id: 'license_type', type: 'select', label: 'License Type', required: true, options: ['Synchronization', 'Mechanical', 'Performance', 'Master Use'], category: 'terms' },
    { id: 'usage_description', type: 'textarea', label: 'Usage Description', required: true, category: 'terms' },
    { id: 'license_fee', type: 'number', label: 'License Fee ($)', required: true, category: 'financial' },
    { id: 'territory_license', type: 'select', label: 'Licensed Territory', required: true, options: ['Worldwide', 'North America', 'Europe', 'Specific Country'], category: 'terms' },
    { id: 'duration', type: 'select', label: 'License Duration', required: true, options: ['1 Year', '2 Years', '3 Years', 'Perpetual'], category: 'terms' },

    // Signatures
    { id: 'party_one_name', type: 'text', label: 'Party One Name', required: true, category: 'signatures' },
    { id: 'party_one_title', type: 'text', label: 'Party One Title', required: false, category: 'signatures' },
    { id: 'party_two_name', type: 'text', label: 'Party Two Name', required: true, category: 'signatures' },
    { id: 'party_two_title', type: 'text', label: 'Party Two Title', required: false, category: 'signatures' },
    { id: 'signature_date', type: 'date', label: 'Signature Date', required: false, category: 'signatures' },
  ]
};

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ 
  onBack, 
  contractType = 'artist_recording', 
  existingTemplate,
  onTemplateSaved 
}) => {
  const [templateName, setTemplateName] = useState('');
  const [selectedContractType, setSelectedContractType] = useState(contractType);
  const [selectedFields, setSelectedFields] = useState<ContractField[]>([]);
  const [availableFields] = useState<ContractField[]>(FIELD_TEMPLATES[contractType] || []);
  const [currentView, setCurrentView] = useState<'builder' | 'preview' | 'edits'>('builder');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [edits, setEdits] = useState<Array<{ field: string; oldValue: string; newValue: string; timestamp: Date }>>([]);
  const [clausesById, setClausesById] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<ContractField | null>(null);
  const [clauseDraft, setClauseDraft] = useState("");
  const [clauseEdits, setClauseEdits] = useState<Array<{ field: string; oldClause: string; newClause: string; timestamp: Date }>>([]);

  const { loading: aiLoading, generateClause } = useClauseAI();

  useEffect(() => {
    if (existingTemplate) {
      console.log('Loading existing template:', existingTemplate);
      setTemplateName(existingTemplate.template_name || '');
      setSelectedContractType(existingTemplate.contract_type || contractType);
      const fields = existingTemplate.template_data?.fields || [];
      setSelectedFields(fields);
      const clauses = existingTemplate.template_data?.clauses || {};
      setClausesById(clauses);
    }
  }, [existingTemplate, contractType]);

  const getDefaultClause = useCallback((field: ContractField) => `${field.label}: {{${field.id}}}`,[ ]);

  const handleContractTypeChange = (newType: string) => {
    setSelectedContractType(newType);
    setSelectedFields([]);
    setPreviewData({});
    setClausesById({});
    setClauseEdits([]);
  };

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Only handle moves into or within selected-fields
    if (destination.droppableId === 'selected-fields' && source.droppableId === 'available-fields') {
      const field = (FIELD_TEMPLATES[selectedContractType] || []).find(f => f.id === draggableId);
      if (field && !selectedFields.find(f => f.id === field.id)) {
        setSelectedFields(prev => [...prev, field]);
        setClausesById(prev => ({ ...prev, [field.id]: prev[field.id] ?? getDefaultClause(field) }));
      }
    } else if (destination.droppableId === 'selected-fields' && source.droppableId === 'selected-fields') {
      const newFields = Array.from(selectedFields);
      const [removed] = newFields.splice(source.index, 1);
      newFields.splice(destination.index, 0, removed);
      setSelectedFields(newFields);
    }
  }, [selectedFields, selectedContractType, getDefaultClause]);

  const removeField = (fieldId: string) => {
    setSelectedFields(prev => prev.filter(f => f.id !== fieldId));
    setClausesById(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setPreviewData(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handlePreviewDataChange = (fieldId: string, value: any) => {
    const oldValue = previewData[fieldId] || '';
    if (oldValue !== value) {
      setEdits(prev => [...prev, {
        field: fieldId,
        oldValue: oldValue,
        newValue: value,
        timestamp: new Date()
      }]);
    }
    setPreviewData(prev => ({ ...prev, [fieldId]: value }));
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (selectedFields.length === 0) {
      toast.error("Please add at least one field to the template");
      return;
    }

    const mappedType = selectedContractType === 'artist_recording'
      ? 'artist'
      : (selectedContractType === 'licensing' ? 'sync' : selectedContractType);

    const templateData = {
      template_name: templateName,
      contract_type: mappedType,
      template_data: {
        fields: selectedFields,
        layout: 'standard',
        clauses: clausesById
      },
      is_public: false
    };

    try {
      let savedTemplate;
      
      if (existingTemplate?.id && existingTemplate.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        // Update existing template only if it has a valid UUID
        console.log('Updating existing template:', existingTemplate.id);
        const { data, error } = await supabase
          .from('contract_templates')
          .update(templateData as any)
          .eq('id', existingTemplate.id)
          .select()
          .single();
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        savedTemplate = data;
        
        toast.success('Template updated successfully!');
      } else {
        // Create new template
        console.log('Creating new template');
        const { data, error } = await supabase
          .from('contract_templates')
          .insert(templateData as any)
          .select()
          .single();
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        savedTemplate = data;
        
        toast.success('Template saved successfully!');
      }

      // Call the onTemplateSaved callback if provided
      if (onTemplateSaved) {
        onTemplateSaved({
          ...savedTemplate,
          isCustom: true
        });
      } else {
        onBack?.();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const sendContract = (method: 'docusign' | 'email') => {
    toast.success(`Contract sent via ${method === 'docusign' ? 'DocuSign' : 'email'}!`);
  };

  const renderFieldInput = (field: ContractField) => {
    const value = previewData[field.id] || '';
    
    switch (field.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(v) => handlePreviewDataChange(field.id, v)}>
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
            onChange={(e) => handlePreviewDataChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handlePreviewDataChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handlePreviewDataChange(field.id, e.target.value)}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handlePreviewDataChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const groupedFields = selectedFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ContractField[]>);

  const compileClauseText = useCallback(() => {
    return selectedFields.map((field) => {
      const clause = (clausesById[field.id] ?? getDefaultClause(field));
      return clause.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
        const val = previewData[key];
        if (val !== undefined && val !== "") return String(val);
        const label = (FIELD_TEMPLATES[selectedContractType] || []).find(f => f.id === key)?.label || key;
        return `[${label}]`;
      });
    }).join("\n\n");
  }, [selectedFields, clausesById, previewData, selectedContractType, getDefaultClause]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Template Builder</h1>
            <p className="text-muted-foreground">Create a custom contract template</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveTemplate} className="gap-2">
            <Save className="h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="edits">Review Edits</TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="flex-1 p-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Template Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Standard Recording Agreement"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractType">Contract Type</Label>
                    <Select value={selectedContractType} onValueChange={handleContractTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artist_recording">Artist Recording Contract</SelectItem>
                        <SelectItem value="publishing">Publishing Agreement</SelectItem>
                        <SelectItem value="distribution">Distribution Agreement</SelectItem>
                        <SelectItem value="licensing">Licensing Agreement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Available Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Fields</CardTitle>
                  <p className="text-sm text-muted-foreground">Drag fields to build your template</p>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="available-fields">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {(FIELD_TEMPLATES[selectedContractType] || []).map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 border rounded-lg cursor-move hover:bg-accent ${
                                  snapshot.isDragging ? 'bg-accent' : ''
                                } ${selectedFields.find(f => f.id === field.id) ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{field.label}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{field.category}</div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {field.type}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>

              {/* Selected Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Fields</CardTitle>
                  <p className="text-sm text-muted-foreground">Fields in your template</p>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="selected-fields">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {selectedFields.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="p-3 border rounded-lg bg-primary/5"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{field.label}</div>
                                      <div className="text-xs text-muted-foreground">{field.type}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingField(field);
                                        setClauseDraft(clausesById[field.id] ?? getDefaultClause(field));
                                      }}
                                      className="gap-2"
                                    >
                                      <Edit3 className="h-4 w-4" /> Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeField(field.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          </DragDropContext>

          <Dialog open={!!editingField} onOpenChange={(open) => setEditingField(open ? editingField : null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingField ? `Edit Clause: ${editingField.label}` : 'Edit Clause'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Clause Text</Label>
                <Textarea
                  value={clauseDraft}
                  onChange={(e) => setClauseDraft(e.target.value)}
                  rows={8}
                  placeholder={editingField ? getDefaultClause(editingField) : 'Enter clause text...'}
                />
                <p className="text-xs text-muted-foreground">
                  {"Use tokens like {{field_id}} to insert values. Example: "}
                  {editingField ? `{{${editingField.id}}}` : "{{field_id}}"}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (editingField) {
                      const def = getDefaultClause(editingField);
                      setClauseDraft(def);
                    }
                  }}
                >
                  Reset to Default
                </Button>
                <Button
                  variant="secondary"
                  disabled={aiLoading || !editingField}
                  onClick={async () => {
                    if (!editingField) return;
                    try {
                      const suggestion = await generateClause({
                        fieldId: editingField.id,
                        fieldLabel: editingField.label,
                        fieldType: editingField.type,
                        contractType: selectedContractType,
                        currentClause: clauseDraft,
                        values: previewData,
                        tone: 'standard',
                      });
                      if (suggestion) {
                        setClauseDraft(suggestion);
                        toast.success('AI suggestion generated');
                      } else {
                        toast.error('No suggestion generated');
                      }
                    } catch (e) {
                      toast.error('Failed to generate with AI');
                    }
                  }}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" /> {aiLoading ? 'Generating…' : 'Generate with AI'}
                </Button>
                <Button
                  onClick={() => {
                    if (!editingField) return;
                    const oldClause = clausesById[editingField.id] ?? getDefaultClause(editingField);
                    const newClause = clauseDraft;
                    if (oldClause !== newClause) {
                      setClauseEdits(prev => [...prev, { field: editingField.id, oldClause, newClause, timestamp: new Date() }]);
                    }
                    setClausesById(prev => ({ ...prev, [editingField.id]: newClause }));
                    setEditingField(null);
                    toast.success('Clause saved');
                  }}
                >
                  Save Clause
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{templateName || 'Contract Template'}</CardTitle>
                    <p className="text-muted-foreground capitalize">
                      {selectedContractType.replace('_', ' ')} Agreement
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => sendContract('email')} className="gap-2">
                      <Send className="h-4 w-4" />
                      Send via Email
                    </Button>
                    <Button onClick={() => sendContract('docusign')} className="gap-2">
                      <Send className="h-4 w-4" />
                      Send via DocuSign
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedFields.some(f => f.category === 'header') && (
                  <div className="text-center space-y-1">
                    <h2 className="text-2xl font-bold">
                      {previewData.document_title || templateName || 'Contract Template'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Effective Date: {previewData.effective_date || '—'}
                    </p>
                    <Separator className="mt-4" />
                  </div>
                )}

                {Object.entries(groupedFields).map(([category, fields]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-4 capitalize">{category.replace('_', ' ')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fields.map(field => (
                        <div key={field.id}>
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

                <Card className="mt-2">
                  <CardHeader>
                    <CardTitle>Contract Language Preview</CardTitle>
                    <p className="text-muted-foreground">Generated from selected fields and custom clauses</p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">{compileClauseText() || 'Add fields and clauses to see the preview.'}</pre>
                    </div>
                  </CardContent>
                </Card>

                {selectedFields.some(f => f.category === 'signatures') && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Signatures</CardTitle>
                      <p className="text-muted-foreground">Preview of signature section</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <div className="h-10 border-b mb-2" />
                          <div className="font-medium">{previewData.party_one_name || 'Party One Name'}</div>
                          <div className="text-sm text-muted-foreground">{previewData.party_one_title || 'Title'}</div>
                          <div className="text-sm text-muted-foreground mt-2">Date: {previewData.signature_date || previewData.effective_date || '—'}</div>
                        </div>
                        <div>
                          <div className="h-10 border-b mb-2" />
                          <div className="font-medium">{previewData.party_two_name || 'Party Two Name'}</div>
                          <div className="text-sm text-muted-foreground">{previewData.party_two_title || 'Title'}</div>
                          <div className="text-sm text-muted-foreground mt-2">Date: {previewData.signature_date || previewData.effective_date || '—'}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Edits Tab */}
        <TabsContent value="edits" className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Edits Review</CardTitle>
              <p className="text-muted-foreground">Review all changes made to the contract</p>
            </CardHeader>
            <CardContent>
              {(clauseEdits.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No clause edits have been made yet</p>
                  <p className="text-sm">Changes made in the clause editor will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {clauseEdits.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Custom Clause Changes</h4>
                      {clauseEdits.map((edit, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{selectedFields.find(f => f.id === edit.field)?.label || edit.field}</span>
                            <span className="text-xs text-muted-foreground">{edit.timestamp.toLocaleString()}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Default:</span>
                              <div className="p-2 bg-muted/50 rounded mt-1 whitespace-pre-wrap">{edit.oldClause}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Custom:</span>
                              <div className="p-2 bg-primary/10 rounded mt-1 whitespace-pre-wrap">{edit.newClause}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => { setEdits([]); setClauseEdits([]); }}>
                      Clear All Edits
                    </Button>
                    <Button onClick={() => toast.success("All edits approved!")}>Approve All Changes</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
