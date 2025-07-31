import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FileText, Eye } from 'lucide-react';

interface InvoiceTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  template_data: any;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface InvoiceTemplateManagerProps {
  onTemplateSelect?: (template: InvoiceTemplate) => void;
  selectedTemplateId?: string;
}

export const InvoiceTemplateManager: React.FC<InvoiceTemplateManagerProps> = ({
  onTemplateSelect,
  selectedTemplateId
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    header_text: '',
    footer_text: '',
    payment_terms: '',
    custom_fields: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('invoice_templates' as any)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return (data || []) as unknown as InvoiceTemplate[];
      } catch (error) {
        console.error('Error fetching templates:', error);
        return [] as InvoiceTemplate[];
      }
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const { data, error } = await supabase
        .from('invoice_templates' as any)
        .insert({
          name: templateData.name,
          description: templateData.description,
          template_data: {
            header_text: templateData.header_text,
            footer_text: templateData.footer_text,
            payment_terms: templateData.payment_terms,
            custom_fields: templateData.custom_fields ? JSON.parse(templateData.custom_fields) : {}
          },
          is_default: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Template Created",
        description: "Invoice template has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create template: " + error.message,
        variant: "destructive"
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, templateData }: { id: string; templateData: any }) => {
      const { data, error } = await supabase
        .from('invoice_templates' as any)
        .update({
          name: templateData.name,
          description: templateData.description,
          template_data: {
            header_text: templateData.header_text,
            footer_text: templateData.footer_text,
            payment_terms: templateData.payment_terms,
            custom_fields: templateData.custom_fields ? JSON.parse(templateData.custom_fields) : {}
          }
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      setIsEditOpen(false);
      resetForm();
      toast({
        title: "Template Updated",
        description: "Invoice template has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update template: " + error.message,
        variant: "destructive"
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoice_templates' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      toast({
        title: "Template Deleted",
        description: "Invoice template has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete template: " + error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      header_text: '',
      footer_text: '',
      payment_terms: '',
      custom_fields: ''
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: InvoiceTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      header_text: template.template_data?.header_text || '',
      footer_text: template.template_data?.footer_text || '',
      payment_terms: template.template_data?.payment_terms || '',
      custom_fields: template.template_data?.custom_fields ? JSON.stringify(template.template_data.custom_fields, null, 2) : ''
    });
    setIsEditOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        templateData: formData
      });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Invoice Templates</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage customizable invoice templates
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Invoice Template</DialogTitle>
              <DialogDescription>
                Design a custom template for your sync licensing invoices
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Standard Invoice, Premium Template"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this template"
                />
              </div>
              
              <div>
                <Label htmlFor="header_text">Header Text</Label>
                <Textarea
                  id="header_text"
                  value={formData.header_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, header_text: e.target.value }))}
                  placeholder="Custom header text for the invoice"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="footer_text">Footer Text</Label>
                <Textarea
                  id="footer_text"
                  value={formData.footer_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="Custom footer text for the invoice"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Textarea
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder="Default payment terms and conditions"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="custom_fields">Custom Fields (JSON)</Label>
                <Textarea
                  id="custom_fields"
                  value={formData.custom_fields}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_fields: e.target.value }))}
                  placeholder='{"field_name": "default_value"}'
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onTemplateSelect?.(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  {template.is_default && (
                    <Badge variant="outline" className="text-xs">Default</Badge>
                  )}
                </div>
              </div>
              {template.description && (
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Created {new Date(template.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(template);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this template?')) {
                        deleteTemplateMutation.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice Template</DialogTitle>
            <DialogDescription>
              Update your invoice template settings
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Template Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard Invoice, Premium Template"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this template"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-header">Header Text</Label>
              <Textarea
                id="edit-header"
                value={formData.header_text}
                onChange={(e) => setFormData(prev => ({ ...prev, header_text: e.target.value }))}
                placeholder="Custom header text for the invoice"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-footer">Footer Text</Label>
              <Textarea
                id="edit-footer"
                value={formData.footer_text}
                onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                placeholder="Custom footer text for the invoice"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-terms">Payment Terms</Label>
              <Textarea
                id="edit-terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                placeholder="Default payment terms and conditions"
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-fields">Custom Fields (JSON)</Label>
              <Textarea
                id="edit-fields"
                value={formData.custom_fields}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_fields: e.target.value }))}
                placeholder='{"field_name": "default_value"}'
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTemplateMutation.isPending}>
                {updateTemplateMutation.isPending ? 'Updating...' : 'Update Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};