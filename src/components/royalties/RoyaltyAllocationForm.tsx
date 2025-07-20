import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Music } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { useContacts } from "@/hooks/useContacts";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RoyaltyAllocationFormProps {
  onCancel: () => void;
  allocation?: any;
}

export function RoyaltyAllocationForm({ onCancel, allocation }: RoyaltyAllocationFormProps) {
  const [writers, setWriters] = useState<any[]>(allocation?.writers || []);
  const [availableCopyrights, setAvailableCopyrights] = useState<any[]>([]);
  const [loadingCopyrights, setLoadingCopyrights] = useState(false);
  const { createAllocation, updateAllocation } = useRoyaltyAllocations();
  const { contacts } = useContacts();
  const { batches } = useReconciliationBatches();
  const { user } = useAuth();
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      song_title: allocation?.song_title || '',
      isrc: allocation?.isrc || '',
      artist: allocation?.artist || '',
      gross_royalty_amount: allocation?.gross_royalty_amount || 0,
      controlled_status: allocation?.controlled_status || 'Non-Controlled',
      recoupable_expenses: allocation?.recoupable_expenses || false,
      batch_id: allocation?.batch_id || '',
      copyright_id: allocation?.copyright_id || '',
      comments: allocation?.comments || '',
    }
  });

  const availableContacts = contacts.filter(c => c.contact_type === 'writer');
  const processedBatches = batches.filter(b => b.status === 'Processed');

  // Load available copyrights
  useEffect(() => {
    const loadCopyrights = async () => {
      if (!user) return;
      
      setLoadingCopyrights(true);
      try {
        const { data, error } = await supabase
          .from('copyrights')
          .select(`
            id,
            work_title,
            internal_id,
            copyright_writers (
              id,
              writer_name,
              ownership_percentage,
              performance_share,
              mechanical_share,
              synchronization_share,
              ipi_number,
              pro_affiliation,
              writer_role,
              controlled_status
            )
          `)
          .eq('user_id', user.id)
          .order('work_title');

        if (error) throw error;
        setAvailableCopyrights(data || []);
      } catch (error) {
        console.error('Error loading copyrights:', error);
        toast({
          title: "Error",
          description: "Failed to load copyrights",
          variant: "destructive",
        });
      } finally {
        setLoadingCopyrights(false);
      }
    };

    loadCopyrights();
  }, [user]);

  // Handle copyright selection and auto-populate writers
  const handleCopyrightChange = (copyrightId: string) => {
    console.log('Copyright selected:', copyrightId);
    setValue('copyright_id', copyrightId === 'none' ? '' : copyrightId);
    
    if (copyrightId && copyrightId !== 'none') {
      const selectedCopyright = availableCopyrights.find(c => c.id === copyrightId);
      console.log('Selected copyright:', selectedCopyright);
      console.log('Copyright writers:', selectedCopyright?.copyright_writers);
      
      if (selectedCopyright && selectedCopyright.copyright_writers) {
        // Auto-populate writers from the selected copyright
        const copyrightWriters = selectedCopyright.copyright_writers.map((writer: any) => {
          // Try to find a matching contact by name
          const matchingContact = availableContacts.find(contact => 
            contact.name.toLowerCase().trim() === writer.writer_name.toLowerCase().trim()
          );
          
          return {
            id: Date.now() + Math.random(), // Temporary ID for form
            contact_id: matchingContact?.id || '', // Auto-select if found, otherwise empty
            writer_name: writer.writer_name,
            writer_ipi: writer.ipi_number || '',
            pro_affiliation: writer.pro_affiliation || '',
            writer_role: writer.writer_role || '',
            controlled_status: writer.controlled_status || '',
            writer_share_percentage: writer.ownership_percentage || 0,
            performance_share: writer.performance_share || 0,
            mechanical_share: writer.mechanical_share || 0,
            synchronization_share: writer.synchronization_share || 0,
          };
        });
        
        console.log('Mapped writers:', copyrightWriters);
        setWriters(copyrightWriters);
        
        if (copyrightWriters.length > 0) {
          toast({
            title: "Writers Loaded",
            description: `Loaded ${copyrightWriters.length} writers from copyright`,
          });
        } else {
          toast({
            title: "No Writers Found",
            description: "This copyright doesn't have any writers. Add writers in the Copyright Management module first.",
            variant: "destructive",
          });
        }
      } else {
        console.log('No writers found for this copyright');
        toast({
          title: "No Writers Found",
          description: "This copyright doesn't have any writers associated with it",
          variant: "destructive",
        });
      }
    } else {
      // Clear writers when no copyright is selected
      setWriters([]);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const allocationData = {
        ...data,
        ownership_splits: writers.reduce((acc, writer) => {
          acc[writer.contact_id] = {
            writer_share: writer.writer_share_percentage,
            performance_share: writer.performance_share,
            mechanical_share: writer.mechanical_share,
            synchronization_share: writer.synchronization_share,
          };
          return acc;
        }, {}),
      };

      if (allocation) {
        await updateAllocation(allocation.id, allocationData);
      } else {
        await createAllocation(allocationData);
      }
      onCancel();
    } catch (error) {
      console.error('Error saving allocation:', error);
    }
  };

  const addWriter = () => {
    setWriters([...writers, {
      id: Date.now(),
      contact_id: '',
      writer_share_percentage: 0,
      performance_share: 0,
      mechanical_share: 0,
      synchronization_share: 0,
    }]);
  };

  const removeWriter = (index: number) => {
    setWriters(writers.filter((_, i) => i !== index));
  };

  const updateWriter = (index: number, field: string, value: any) => {
    const updatedWriters = [...writers];
    updatedWriters[index] = { ...updatedWriters[index], [field]: value };
    setWriters(updatedWriters);
  };

  const totalWriterShares = writers.reduce((sum, writer) => sum + (writer.writer_share_percentage || 0), 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="song_title">Work Title *</Label>
          <Input
            id="song_title"
            {...register('song_title', { required: 'Work title is required' })}
          />
          {errors.song_title && (
            <p className="text-sm text-red-600">{String(errors.song_title.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="isrc">ISRC</Label>
          <Input
            id="isrc"
            placeholder="USRC17607839"
            {...register('isrc')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gross_royalty_amount">Royalty Amount</Label>
          <Input
            id="gross_royalty_amount"
            type="number"
            step="0.01"
            {...register('gross_royalty_amount', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="controlled_status">Controlled Status</Label>
          <Select onValueChange={(value) => setValue('controlled_status', value)} defaultValue={watch('controlled_status')}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value="Controlled">Controlled</SelectItem>
              <SelectItem value="Non-Controlled">Non-Controlled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch_id">Source Batch</Label>
          <Select onValueChange={(value) => setValue('batch_id', value)} defaultValue={watch('batch_id')}>
            <SelectTrigger>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {processedBatches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.batch_id} - {batch.source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Display selected batch details (view-only) */}
          {watch('batch_id') && (() => {
            const selectedBatch = processedBatches.find(b => b.id === watch('batch_id'));
            if (!selectedBatch) return null;
            
            return (
              <Card className="mt-3 bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="outline">View Only</Badge>
                    Reconciliation Batch Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Batch ID:</span> {selectedBatch.batch_id}
                    </div>
                    <div>
                      <span className="font-medium">Source:</span> {selectedBatch.source}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> 
                      <Badge variant="secondary" className="ml-2">{selectedBatch.status}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Date Received:</span> {new Date(selectedBatch.date_received).toLocaleDateString()}
                    </div>
                    {selectedBatch.statement_period_start && selectedBatch.statement_period_end && (
                      <div className="col-span-2">
                        <span className="font-medium">Statement Period:</span> {new Date(selectedBatch.statement_period_start).toLocaleDateString()} - {new Date(selectedBatch.statement_period_end).toLocaleDateString()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Total Gross Amount:</span> ${selectedBatch.total_gross_amount?.toLocaleString() || '0.00'}
                    </div>
                    <div>
                      <span className="font-medium">Allocated Amount:</span> ${selectedBatch.allocated_amount?.toLocaleString() || '0.00'}
                    </div>
                    {selectedBatch.notes && (
                      <div className="col-span-2">
                        <span className="font-medium">Notes:</span> 
                        <p className="text-muted-foreground mt-1">{selectedBatch.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        <div className="space-y-2">
          <Label htmlFor="copyright_id">Linked Copyright</Label>
          <Select 
            onValueChange={handleCopyrightChange} 
            defaultValue={watch('copyright_id')}
            disabled={loadingCopyrights}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingCopyrights ? "Loading copyrights..." : "Select a copyright"} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value="none">No copyright linked</SelectItem>
              {availableCopyrights.map((copyright) => (
                <SelectItem key={copyright.id} value={copyright.id}>
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    <span>{copyright.work_title}</span>
                    {copyright.internal_id && (
                      <Badge variant="outline" className="text-xs">
                        {copyright.internal_id}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selecting a copyright will automatically populate writers and their shares
          </p>
        </div>
      </div>


      {/* Writers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Writers & Shares</h3>
          <Button type="button" onClick={addWriter} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Writer
          </Button>
        </div>

        {totalWriterShares > 100 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Warning: Total writer shares exceed 100% ({totalWriterShares}%)
            </p>
          </div>
        )}

        {writers.map((writer, index) => (
          <Card key={writer.id || index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Writer {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWriter(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Read-only Writer Details from Copyright */}
              {writer.writer_name ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer Name *</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">{writer.writer_name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer IPI</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm text-muted-foreground">
                          {writer.writer_ipi || 'Not provided'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Writer Share %</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm font-medium">{writer.writer_share_percentage}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">PRO Affiliation</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">
                          {writer.pro_affiliation || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Writer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Performance Share %</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">{writer.performance_share}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Mechanical Share %</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">{writer.mechanical_share}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Controlled?</Label>
                      <div className="px-3 py-2 bg-muted/50 border rounded-md">
                        <span className="text-sm">
                          {writer.controlled_status === 'C' ? 'C (Controlled)' : 'NC (Non-Controlled)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Assignment */}
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Link to Contact (for payments)</Label>
                      <Select
                        value={writer.contact_id}
                        onValueChange={(value) => updateWriter(index, 'contact_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact for payments" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-50">
                          <SelectItem value="">No contact linked</SelectItem>
                          {availableContacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Link this writer to an existing contact for royalty payments
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Fallback for manually added writers (when no copyright is linked)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Select
                      value={writer.contact_id}
                      onValueChange={(value) => updateWriter(index, 'contact_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        {availableContacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Writer Share %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      max="100"
                      value={writer.writer_share_percentage}
                      onChange={(e) => updateWriter(index, 'writer_share_percentage', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Performance Share %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      max="100"
                      value={writer.performance_share}
                      onChange={(e) => updateWriter(index, 'performance_share', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mechanical Share %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      max="100"
                      value={writer.mechanical_share}
                      onChange={(e) => updateWriter(index, 'mechanical_share', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {writers.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-md">
            <p className="text-muted-foreground">No writers added yet</p>
            <Button type="button" onClick={addWriter} size="sm" className="mt-2">
              Add First Writer
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Comments</Label>
        <Textarea
          id="comments"
          placeholder="Add any additional notes..."
          {...register('comments')}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {allocation ? 'Update Royalty' : 'Create Royalty'}
        </Button>
      </div>
    </form>
  );
}