import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ExternalLink, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationBatchFormProps {
  onCancel: () => void;
  batch?: any;
}

export function ReconciliationBatchForm({ onCancel, batch }: ReconciliationBatchFormProps) {
  const [availableStatements, setAvailableStatements] = useState<any[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceValue, setSourceValue] = useState(batch?.source || "");
  const { createBatch, updateBatch } = useReconciliationBatches();
  const { allocations } = useRoyaltyAllocations();
  const { user } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      source: batch?.source || '',
      statement_period_start: batch?.statement_period_start || '',
      statement_period_end: batch?.statement_period_end || '',
      date_received: batch?.date_received || new Date().toISOString().split('T')[0],
      total_gross_amount: batch?.total_gross_amount || 0,
      linked_statement_id: batch?.linked_statement_id || '',
      status: batch?.status || 'Pending',
      notes: batch?.notes || '',
    }
  });

  // Predefined source options
  const sourceOptions = [
    { value: "DSP", label: "DSP" },
    { value: "PRO", label: "PRO" },
    { value: "YouTube", label: "YouTube" },
    { value: "Spotify", label: "Spotify" },
    { value: "Apple Music", label: "Apple Music" },
    { value: "Amazon Music", label: "Amazon Music" },
    { value: "Other", label: "Other" },
  ];

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
      // Clean up the data before submitting
      const cleanedData = {
        ...data,
        // Convert empty strings to null for optional date fields
        statement_period_start: data.statement_period_start || null,
        statement_period_end: data.statement_period_end || null,
        // Convert empty string to null for linked_statement_id
        linked_statement_id: data.linked_statement_id || null,
        // Ensure numeric values are properly handled
        total_gross_amount: Number(data.total_gross_amount) || 0,
      };

      if (batch) {
        await updateBatch(batch.id, cleanedData);
      } else {
        await createBatch(cleanedData);
      }
      onCancel();
    } catch (error) {
      console.error('Error saving batch:', error);
    }
  };

  // Update source value when it changes
  useEffect(() => {
    setValue('source', sourceValue);
  }, [sourceValue, setValue]);

  // Get linked royalties for the current batch
  const linkedRoyalties = batch ? allocations.filter(allocation => allocation.batch_id === batch.id) : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="source">Source *</Label>
          <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={sourceOpen}
                className="w-full justify-between"
              >
                {sourceValue || "Select or enter source..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput 
                  placeholder="Search or enter source..." 
                  value={sourceValue}
                  onValueChange={setSourceValue}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground mb-2">No predefined source found.</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSourceOpen(false);
                        }}
                        className="text-xs"
                      >
                        Use "{sourceValue}" as custom source
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {sourceOptions.map((source) => (
                      <CommandItem
                        key={source.value}
                        value={source.value}
                        onSelect={(currentValue) => {
                          setSourceValue(currentValue);
                          setSourceOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            sourceValue === source.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {source.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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

      {/* Linked Royalties Section - only show when editing existing batch */}
      {batch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Linked Royalties ({linkedRoyalties.length})
            </CardTitle>
            <CardDescription>
              Royalty allocations linked to this reconciliation batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {linkedRoyalties.length > 0 ? (
              <div className="space-y-3">
                {linkedRoyalties.map((royalty) => (
                  <div key={royalty.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {royalty.royalty_id}
                        </Badge>
                        <span className="font-medium">{royalty.song_title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {royalty.artist && `${royalty.artist} • `}
                        ${royalty.gross_royalty_amount.toLocaleString()}
                        {royalty.source && ` • ${royalty.source}`}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        // Navigate to royalties page with this royalty highlighted
                        // This could be implemented as needed
                        console.log('Navigate to royalty:', royalty.royalty_id);
                      }}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No royalties linked to this batch yet</p>
                <p className="text-sm">Use the Batch Royalty Manager to link royalties</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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