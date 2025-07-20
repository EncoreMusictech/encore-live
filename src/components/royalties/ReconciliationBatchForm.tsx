import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ExternalLink, Check, ChevronsUpDown, CalendarIcon, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BatchRoyaltyManager } from "./BatchRoyaltyManager";

interface ReconciliationBatchFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
  batch?: any;
}

export function ReconciliationBatchForm({ onCancel, onSuccess, batch }: ReconciliationBatchFormProps) {
  const [availableStatements, setAvailableStatements] = useState<any[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [linkRoyaltiesOpen, setLinkRoyaltiesOpen] = useState(false);
  const [sourceValue, setSourceValue] = useState(batch?.source || "");
  const [dateReceived, setDateReceived] = useState<Date | undefined>(
    batch?.date_received ? new Date(batch.date_received) : new Date()
  );
  const [statementRoyalties, setStatementRoyalties] = useState<any[]>([]);
  const { createBatch, updateBatch } = useReconciliationBatches();
  const { allocations, updateAllocation } = useRoyaltyAllocations();
  const { user } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      source: batch?.source || '',
      date_received: batch?.date_received || new Date().toISOString().split('T')[0],
      total_gross_amount: batch?.total_gross_amount || 0,
      linked_statement_id: batch?.linked_statement_id || '',
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

  // Fetch royalties from linked statement
  const fetchStatementRoyalties = async (statementId: string) => {
    if (!user || !statementId) {
      setStatementRoyalties([]);
      return;
    }
    
    console.log('Fetching statement royalties for statement ID:', statementId);
    
    try {
      // Check multiple possible relationships between statement and royalties
      // 1. Direct statement_id match
      let { data: royalties, error } = await supabase
        .from('royalty_allocations')
        .select('*')
        .eq('user_id', user.id)
        .eq('statement_id', statementId);

      if (error) throw error;
      
      // 2. If no direct match, try staging_record_id (this might be how they're linked)
      if (!royalties || royalties.length === 0) {
        const { data: stagingRoyalties, error: stagingError } = await supabase
          .from('royalty_allocations')
          .select('*')
          .eq('user_id', user.id)
          .eq('staging_record_id', statementId);
          
        if (!stagingError && stagingRoyalties) {
          royalties = stagingRoyalties;
        }
      }
      
      // 3. If still no match, check if there are royalties that were created from this batch's statement
      // by looking at the staging data and finding royalties created around the same time
      if (!royalties || royalties.length === 0) {
        const { data: allRoyalties, error: allError } = await supabase
          .from('royalty_allocations')
          .select('*')
          .eq('user_id', user.id)
          .is('batch_id', null); // Only get unlinked royalties
          
        if (!allError && allRoyalties) {
          // Filter royalties that might be from this statement based on staging_record_id
          royalties = allRoyalties.filter(royalty => 
            royalty.staging_record_id === statementId
          );
        }
      }
      
      console.log('Found statement royalties:', royalties);
      setStatementRoyalties(royalties || []);
    } catch (error) {
      console.error('Error fetching statement royalties:', error);
      setStatementRoyalties([]);
    }
  };

  // Fetch statement royalties when batch changes or linked statement changes
  useEffect(() => {
    if (batch?.linked_statement_id) {
      fetchStatementRoyalties(batch.linked_statement_id);
    } else {
      setStatementRoyalties([]);
    }
  }, [batch?.linked_statement_id, user]);

  const onSubmit = async (data: any) => {
    try {
      // Clean up the data before submitting
      const cleanedData = {
        ...data,
        // Convert empty string to null for linked_statement_id
        linked_statement_id: data.linked_statement_id || null,
        // Ensure numeric values are properly handled
        total_gross_amount: Number(data.total_gross_amount) || 0,
      };

      if (batch) {
        await updateBatch(batch.id, cleanedData);
        toast({
          title: "Success",
          description: "Batch updated successfully",
        });
      } else {
        await createBatch(cleanedData);
        toast({
          title: "Success", 
          description: "Batch created successfully",
        });
      }
      
      // Call onSuccess if provided, otherwise onCancel
      if (onSuccess) {
        onSuccess();
      } else {
        onCancel();
      }
    } catch (error) {
      console.error("Error saving batch:", error);
      toast({
        title: "Error",
        description: `Failed to ${batch ? 'update' : 'create'} batch`,
        variant: "destructive",
      });
    }
  };

  // Update source value when it changes
  useEffect(() => {
    setValue('source', sourceValue);
  }, [sourceValue, setValue]);

  // Update date received when it changes
  useEffect(() => {
    if (dateReceived) {
      setValue('date_received', format(dateReceived, 'yyyy-MM-dd'));
    }
  }, [dateReceived, setValue]);

  // Get linked royalties for the current batch
  const linkedRoyalties = batch ? allocations.filter(allocation => allocation.batch_id === batch.id) : [];

  // Calculate total royalty amount (linked royalties + statement royalties)
  const linkedRoyaltiesTotal = linkedRoyalties.reduce((sum, royalty) => sum + (royalty.gross_royalty_amount || 0), 0);
  const statementRoyaltiesTotal = statementRoyalties.reduce((sum, royalty) => sum + (royalty.gross_royalty_amount || 0), 0);
  const totalRoyaltyAmount = linkedRoyaltiesTotal + statementRoyaltiesTotal;

  // Handle unlinking a royalty from the batch
  const handleUnlinkRoyalty = async (royaltyId: string) => {
    try {
      await updateAllocation(royaltyId, { batch_id: null });
      toast({
        title: "Success",
        description: "Royalty has been unlinked from the batch",
      });
    } catch (error) {
      console.error("Error unlinking royalty:", error);
      toast({
        title: "Error",
        description: "Failed to unlink royalty from batch",
        variant: "destructive",
      });
    }
  };

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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateReceived && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateReceived ? format(dateReceived, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateReceived}
                onSelect={setDateReceived}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {errors.date_received && (
            <p className="text-sm text-red-600">{String(errors.date_received.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_gross_amount">Batch Amount ($)</Label>
          <Input
            id="total_gross_amount"
            type="number"
            step="0.01"
            {...register('total_gross_amount', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="royalty_amount">Royalty Amount ($)</Label>
          <Input
            id="royalty_amount"
            type="text"
            value={`$${totalRoyaltyAmount.toLocaleString()}`}
            readOnly
            className="bg-muted text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Total from linked royalties ({linkedRoyalties.length}) + statement royalties ({statementRoyalties.length})
          </p>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Linked Royalties ({linkedRoyalties.length})
                </CardTitle>
                <CardDescription>
                  Royalty allocations linked to this reconciliation batch
                </CardDescription>
              </div>
              <Dialog open={linkRoyaltiesOpen} onOpenChange={setLinkRoyaltiesOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Link Royalties
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Link Royalties to Batch</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
                    <BatchRoyaltyManager 
                      batchId={batch.id}
                      embedded={true}
                      onLinkComplete={() => {
                        // Close the dialog first
                        setLinkRoyaltiesOpen(false);
                        // Then refresh the allocations data without full page reload
                        if (onSuccess) {
                          onSuccess();
                        }
                      }} 
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          // Navigate to royalties page with this royalty highlighted
                          // This could be implemented as needed
                          console.log("Navigate to royalty:", royalty.royalty_id);
                        }}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="flex items-center gap-1 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Linked Royalty</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove "{royalty.song_title}" from this batch? This will unlink the royalty but won't delete it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleUnlinkRoyalty(royalty.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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