import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";

interface ReconciliationBatchFormProps {
  onCancel: () => void;
  batch?: any;
}

export function ReconciliationBatchForm({ onCancel, batch }: ReconciliationBatchFormProps) {
  const [uploading, setUploading] = useState(false);
  const { createBatch, updateBatch } = useReconciliationBatches();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      source: batch?.source || 'DSP',
      statement_period_start: batch?.statement_period_start || '',
      statement_period_end: batch?.statement_period_end || '',
      date_received: batch?.date_received || new Date().toISOString().split('T')[0],
      total_gross_amount: batch?.total_gross_amount || 0,
      statement_file_url: batch?.statement_file_url || '',
      status: batch?.status || 'Pending',
      notes: batch?.notes || '',
    }
  });

  const onSubmit = async (data: any) => {
    try {
      if (batch) {
        await updateBatch(batch.id, data);
      } else {
        await createBatch(data);
      }
      onCancel();
    } catch (error) {
      console.error('Error saving batch:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // In a real implementation, you would upload to Supabase storage
      // For now, we'll just simulate the upload
      setTimeout(() => {
        setValue('statement_file_url', `uploads/${file.name}`);
        setUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="source">Source *</Label>
          <Select onValueChange={(value) => setValue('source', value)} defaultValue={watch('source')}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DSP">DSP</SelectItem>
              <SelectItem value="PRO">PRO</SelectItem>
              <SelectItem value="YouTube">YouTube</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_received">Date Received *</Label>
          <Input
            id="date_received"
            type="date"
            {...register('date_received', { required: 'Date received is required' })}
          />
          {errors.date_received && (
            <p className="text-sm text-red-600">{String(errors.date_received.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="statement_period_start">Statement Period Start</Label>
          <Input
            id="statement_period_start"
            type="date"
            {...register('statement_period_start')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="statement_period_end">Statement Period End</Label>
          <Input
            id="statement_period_end"
            type="date"
            {...register('statement_period_end')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_gross_amount">Total Gross Amount</Label>
          <Input
            id="total_gross_amount"
            type="number"
            step="0.01"
            {...register('total_gross_amount', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value) => setValue('status', value)} defaultValue={watch('status')}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Imported">Imported</SelectItem>
              <SelectItem value="Processed">Processed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Upload Royalty Statement</Label>
        <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-primary hover:text-primary/90">
                    Click to upload
                  </span>
                  <span className="text-sm text-muted-foreground"> or drag and drop</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="sr-only"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                CSV or Excel files only
              </p>
            </div>
          </CardContent>
        </Card>
        {watch('statement_file_url') && (
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-sm">{watch('statement_file_url')}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setValue('statement_file_url', '')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes..."
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : batch ? 'Update Batch' : 'Create Batch'}
        </Button>
      </div>
    </form>
  );
}