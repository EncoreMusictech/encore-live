import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ReconciliationBatchFormProps {
  onCancel: () => void;
  batch?: any;
}

export function ReconciliationBatchForm({ onCancel, batch }: ReconciliationBatchFormProps) {
  const [availableStatements, setAvailableStatements] = useState<any[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const { createBatch, updateBatch } = useReconciliationBatches();
  const { user } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      source: batch?.source || 'DSP',
      statement_period_start: batch?.statement_period_start || '',
      statement_period_end: batch?.statement_period_end || '',
      date_received: batch?.date_received || new Date().toISOString().split('T')[0],
      total_gross_amount: batch?.total_gross_amount || 0,
      linked_statement_id: batch?.linked_statement_id || '',
      status: batch?.status || 'Pending',
      notes: batch?.notes || '',
    }
  });

  // Fetch available statements that aren't already linked to other batches
  const fetchAvailableStatements = async () => {
    if (!user) return;
    
    setLoadingStatements(true);
    try {
      // Get all royalties import staging records
      const { data: statements, error: statementsError } = await supabase
        .from('royalties_import_staging')
        .select('id, original_filename, detected_source, created_at, batch_id')
        .order('created_at', { ascending: false });

      if (statementsError) throw statementsError;

      // Get all batch IDs that already have linked statements
      const { data: linkedBatches, error: batchesError } = await supabase
        .from('reconciliation_batches')
        .select('id, linked_statement_id')
        .not('linked_statement_id', 'is', null);

      if (batchesError) throw batchesError;

      // Filter out statements that are already linked to other batches (excluding current batch if editing)
      const linkedStatementIds = new Set(
        linkedBatches
          ?.filter(b => batch ? b.id !== batch.id : true)
          ?.map(b => b.linked_statement_id)
          ?.filter(Boolean) || []
      );

      const available = statements?.filter(statement => 
        !linkedStatementIds.has(statement.id)
      ) || [];

      setAvailableStatements(available);
    } catch (error) {
      console.error('Error fetching available statements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available statements",
        variant: "destructive",
      });
    } finally {
      setLoadingStatements(false);
    }
  };

  useEffect(() => {
    fetchAvailableStatements();
  }, [user]);

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
          <Label htmlFor="linked_statement_id">Link Statement</Label>
          <Select 
            onValueChange={(value) => setValue('linked_statement_id', value)} 
            defaultValue={watch('linked_statement_id')}
            disabled={loadingStatements}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingStatements ? "Loading statements..." : "Select a statement to link"} />
            </SelectTrigger>
            <SelectContent>
              {availableStatements.map((statement) => (
                <SelectItem key={statement.id} value={statement.id}>
                  {statement.original_filename} ({statement.detected_source})
                </SelectItem>
              ))}
              {availableStatements.length === 0 && !loadingStatements && (
                <SelectItem value="no-statements" disabled>No available statements</SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Only statements not linked to other batches are shown
          </p>
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
        <Button type="submit" disabled={loadingStatements}>
          {batch ? 'Update Batch' : 'Create Batch'}
        </Button>
      </div>
    </form>
  );
}