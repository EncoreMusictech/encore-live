import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { useContacts } from "@/hooks/useContacts";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";

interface RoyaltyAllocationFormProps {
  onCancel: () => void;
  allocation?: any;
}

export function RoyaltyAllocationForm({ onCancel, allocation }: RoyaltyAllocationFormProps) {
  const [writers, setWriters] = useState<any[]>(allocation?.writers || []);
  const { createAllocation, updateAllocation } = useRoyaltyAllocations();
  const { contacts } = useContacts();
  const { batches } = useReconciliationBatches();
  
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
          <Label htmlFor="song_title">Song Title *</Label>
          <Input
            id="song_title"
            {...register('song_title', { required: 'Song title is required' })}
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
          <Label htmlFor="artist">Artist</Label>
          <Input
            id="artist"
            {...register('artist')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gross_royalty_amount">Gross Royalty Amount</Label>
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
            <SelectContent>
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
            <SelectContent>
              {processedBatches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.batch_id} - {batch.source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="recoupable_expenses"
          checked={watch('recoupable_expenses')}
          onCheckedChange={(checked) => setValue('recoupable_expenses', checked)}
        />
        <Label htmlFor="recoupable_expenses">Recoupable Expenses</Label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact</Label>
                  <Select
                    value={writer.contact_id}
                    onValueChange={(value) => updateWriter(index, 'contact_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select writer" />
                    </SelectTrigger>
                    <SelectContent>
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
          {allocation ? 'Update Allocation' : 'Create Allocation'}
        </Button>
      </div>
    </form>
  );
}