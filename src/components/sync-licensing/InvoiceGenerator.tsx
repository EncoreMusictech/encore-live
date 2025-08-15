import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Eye, Send, Loader2 } from 'lucide-react';
import { InvoiceTemplateManager } from './InvoiceTemplateManager';

interface InvoiceGeneratorProps {
  license: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: any;
  is_default: boolean;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  license,
  open,
  onOpenChange
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'generator' | 'templates'>('generator');
  
  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setGeneratedInvoice(null);
      setPreviewHtml('');
      setCustomFields({});
      setNewFieldKey('');
      setNewFieldValue('');
      setActiveTab('generator');
    }
  }, [open]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateInvoiceMutation = useMutation({
    mutationFn: async ({
      licenseId,
      templateId,
      customFields
    }: {
      licenseId: string;
      templateId?: string;
      customFields?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-sync-invoice', {
        body: {
          licenseId,
          templateId,
          customFields
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedInvoice(data.invoice);
      setPreviewHtml(data.html);
      toast({
        title: "Invoice Generated",
        description: "Your sync licensing invoice has been created successfully."
      });
    },
    onError: (error) => {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice: " + error.message,
        variant: "destructive"
      });
    }
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
      const { data, error } = await supabase
        .from('sync_invoices' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-invoices'] });
      toast({
        title: "Invoice Updated",
        description: "Invoice status has been updated successfully."
      });
    }
  });

  const handleAddCustomField = () => {
    if (newFieldKey && newFieldValue) {
      setCustomFields(prev => ({
        ...prev,
        [newFieldKey]: newFieldValue
      }));
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const handleRemoveCustomField = (key: string) => {
    setCustomFields(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleGenerateInvoice = () => {
    generateInvoiceMutation.mutate({
      licenseId: license.id,
      templateId: selectedTemplate?.id,
      customFields
    });
  };

  const handleDownloadInvoice = () => {
    if (previewHtml) {
      // Convert HTML to PDF using jsPDF and html2canvas
      import('jspdf').then(({ jsPDF }) => {
        import('html2canvas').then((html2canvas) => {
          // Create a temporary iframe for rendering
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.left = '-9999px';
          iframe.style.top = '0';
          iframe.style.width = '794px';
          iframe.style.height = '1123px';
          document.body.appendChild(iframe);
          
          const doc = iframe.contentDocument!;
          doc.open();
          doc.write(previewHtml);
          doc.close();
          
          // Wait for content to render
          setTimeout(() => {
            const target = doc.body;
            if (target) {
              html2canvas.default(target, { 
                scale: 2, 
                useCORS: true, 
                logging: false, 
                backgroundColor: '#ffffff' 
              }).then((canvas) => {
                const pdf = new jsPDF('p', 'pt', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 48;
                const imgWidth = pageWidth - margin * 2;
                const scale = imgWidth / canvas.width;
                const pageHeightPx = Math.floor((pageHeight - margin * 2) / scale);
                
                let y = 0;
                let pageIndex = 0;
                
                while (y < canvas.height) {
                  const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
                  const pageCanvas = document.createElement('canvas');
                  pageCanvas.width = canvas.width;
                  pageCanvas.height = sliceHeight;
                  const ctx = pageCanvas.getContext('2d')!;
                  ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
                  const imgData = pageCanvas.toDataURL('image/png');
                  
                  if (pageIndex > 0) pdf.addPage();
                  pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, sliceHeight * scale);
                  
                  y += sliceHeight;
                  pageIndex++;
                }
                
                pdf.save(`invoice-${license.license_id || 'draft'}.pdf`);
                document.body.removeChild(iframe);
                
                toast({
                  title: "Success",
                  description: "Invoice PDF downloaded successfully",
                });
              }).catch((error) => {
                console.error('Canvas rendering error:', error);
                document.body.removeChild(iframe);
                toast({
                  title: "Error", 
                  description: "Failed to render PDF",
                  variant: "destructive",
                });
              });
            }
          }, 500);
        });
      });
    }
  };

  const handlePreviewInvoice = () => {
    if (previewHtml) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(previewHtml);
        newWindow.document.close();
      }
    }
  };

  const handleSendInvoice = () => {
    if (generatedInvoice) {
      updateInvoiceStatusMutation.mutate({
        invoiceId: generatedInvoice.id,
        status: 'sent'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Invoice - {license?.project_title || 'Untitled License'}
          </DialogTitle>
          <DialogDescription>
            Create a professional invoice for this sync license
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'generator'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('generator')}
            >
              Generate Invoice
            </button>
            <button
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'templates'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('templates')}
            >
              Manage Templates
            </button>
          </div>

          {activeTab === 'generator' ? (
            <div className="space-y-6">
              {/* License Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">License Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Project</Label>
                    <p className="font-medium">{license?.project_title || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Licensee</Label>
                    <p className="font-medium">{license?.licensee_company || license?.licensee_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">License Fee</Label>
                    <p className="font-medium">
                      {license?.currency || 'USD'} {(license?.license_fee || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <p className="font-medium">{license?.license_status || 'Draft'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Selection</CardTitle>
                  <CardDescription>
                    Choose a template for your invoice or use the default format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTemplate ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{selectedTemplate.name}</p>
                        {selectedTemplate.description && (
                          <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(null)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No template selected. Default format will be used.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('templates')}
                      >
                        Select Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Custom Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Fields</CardTitle>
                  <CardDescription>
                    Add additional information to your invoice
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(customFields).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(customFields).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveCustomField(key)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input
                      placeholder="Field name"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                    />
                    <Input
                      placeholder="Field value"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                    />
                    <Button
                      onClick={handleAddCustomField}
                      disabled={!newFieldKey || !newFieldValue}
                    >
                      Add Field
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generated Invoice Actions */}
              {generatedInvoice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Invoice</CardTitle>
                    <CardDescription>
                      Invoice #{generatedInvoice.invoice_number} has been created
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={handlePreviewInvoice}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" onClick={handleDownloadInvoice}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSendInvoice}
                        disabled={updateInvoiceStatusMutation.isPending}
                      >
                        {updateInvoiceStatusMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Mark as Sent
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generate Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={generateInvoiceMutation.isPending}
                >
                  {generateInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <InvoiceTemplateManager
              onTemplateSelect={(template) => {
                setSelectedTemplate(template);
                setActiveTab('generator');
              }}
              selectedTemplateId={selectedTemplate?.id}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};