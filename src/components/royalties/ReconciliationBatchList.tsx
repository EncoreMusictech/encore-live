import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Search, RefreshCw, Edit, Trash2, Play } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { ReconciliationBatchForm } from "./ReconciliationBatchForm";
import { ProcessBatchDialog } from "./ProcessBatchDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function ReconciliationBatchList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [reconciliationFilter, setReconciliationFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processingBatch, setProcessingBatch] = useState<any>(null);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [batchProgressData, setBatchProgressData] = useState<Map<string, { progress: number; allocatedAmount: number }>>(new Map());
  
  const { batches, loading, deleteBatch, refreshBatches } = useReconciliationBatches();
  const { allocations } = useRoyaltyAllocations();
  const { user } = useAuth();

  // Calculate progress for all batches
  useEffect(() => {
    const calculateAllProgress = async () => {
      console.log('=== PROGRESS CALCULATION TRIGGERED ===');
      console.log('User:', !!user);
      console.log('Batches length:', batches.length);
      console.log('Allocations length:', allocations.length);
      
      if (!user) {
        console.log('No user, skipping progress calculation');
        return;
      }
      
      if (!batches.length) {
        console.log('No batches, skipping progress calculation');
        return;
      }
      
      console.log('=== CALCULATING PROGRESS FOR ALL BATCHES ===');
      
      const progressMap = new Map();
      
      for (const batch of batches) {
        console.log(`\n--- Processing batch ${batch.batch_id} ---`);
        console.log('Batch total gross amount:', batch.total_gross_amount);
        console.log('Batch linked_statement_id:', batch.linked_statement_id);
        
        // Get linked royalties (allocations with batch_id)
        const batchAllocations = allocations.filter(a => a.batch_id === batch.id);
        const linkedRoyaltiesTotal = batchAllocations.reduce((sum, a) => sum + (a.gross_royalty_amount || 0), 0);
        
        console.log('Linked allocations count:', batchAllocations.length);
        console.log('Linked royalties total:', linkedRoyaltiesTotal);
        
        // Get statement royalties if there's a linked statement
        let statementRoyaltiesTotal = 0;
        if (batch.linked_statement_id) {
          try {
            // First, get the statement_id from the staging record
            const { data: stagingRecord } = await supabase
              .from('royalties_import_staging')
              .select('statement_id')
              .eq('id', batch.linked_statement_id)
              .single();
            
            console.log('Staging record:', stagingRecord);
            
            if (stagingRecord?.statement_id) {
              // Then query royalty allocations using the statement_id
              const { data: statementRoyalties, error } = await supabase
                .from('royalty_allocations')
                .select('*')
                .eq('user_id', user.id)
                .eq('statement_id', stagingRecord.statement_id);
              
              console.log('Statement royalties query error:', error);
              console.log('Statement royalties count:', statementRoyalties?.length || 0);
              console.log('All statement royalties:', statementRoyalties);
              
              if (statementRoyalties && statementRoyalties.length > 0) {
                // Check if any of these royalties are already linked to THIS batch
                const unlinkedStatementRoyalties = statementRoyalties.filter(r => 
                  !r.batch_id || r.batch_id !== batch.id
                );
                
                console.log('Unlinked statement royalties:', unlinkedStatementRoyalties.length);
                console.log('Unlinked royalties details:', unlinkedStatementRoyalties.map(r => ({ 
                  id: r.id, 
                  amount: r.gross_royalty_amount, 
                  batch_id: r.batch_id,
                  song_title: r.song_title
                })));
                
                statementRoyaltiesTotal = unlinkedStatementRoyalties.reduce((sum, r) => sum + (r.gross_royalty_amount || 0), 0);
                console.log('Statement royalties total (unlinked only):', statementRoyaltiesTotal);
              }
            } else {
              console.log('No statement_id found in staging record');
            }
          } catch (error) {
            console.error('Error fetching statement royalties for progress calculation:', error);
          }
        } else {
          console.log('No linked statement ID');
        }
        
        const totalAllocatedAmount = linkedRoyaltiesTotal + statementRoyaltiesTotal;
        const progress = batch.total_gross_amount > 0 ? (totalAllocatedAmount / batch.total_gross_amount) * 100 : 0;
        
        console.log('Total allocated amount:', totalAllocatedAmount);
        console.log('Calculated progress:', progress);
        console.log('---');
        
        progressMap.set(batch.id, {
          progress,
          allocatedAmount: totalAllocatedAmount
        });
      }
      
      console.log('=== SETTING BATCH PROGRESS DATA ===');
      console.log('Progress map size:', progressMap.size);
      console.log('Progress map entries:', Array.from(progressMap.entries()));
      setBatchProgressData(progressMap);
    };
    
    // Add a small delay to ensure all data is loaded
    const timeoutId = setTimeout(() => {
      calculateAllProgress();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [batches, allocations, user]);

  // Also trigger on mount to ensure calculation runs
  useEffect(() => {
    console.log('=== RECONCILIATION BATCH LIST MOUNTED ===');
    console.log('Initial batches:', batches.length);
    console.log('Initial allocations:', allocations.length);
    console.log('Initial user:', !!user);
  }, []); // Empty dependency array for mount only

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batch_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    const matchesSource = sourceFilter === "all" || batch.source === sourceFilter;
    
    // Use calculated progress for filtering
    const progressData = batchProgressData.get(batch.id);
    const reconciliationProgress = progressData?.progress || 0;
    
    let matchesReconciliation = true;
    if (reconciliationFilter === "complete") {
      matchesReconciliation = Math.abs(reconciliationProgress - 100) < 0.01;
    } else if (reconciliationFilter === "incomplete") {
      matchesReconciliation = Math.abs(reconciliationProgress - 100) >= 0.01;
    }
    
    return matchesSearch && matchesStatus && matchesSource && matchesReconciliation;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Incomplete': return 'bg-yellow-100 text-yellow-800';
      case 'Processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'SESAC': return 'bg-purple-100 text-purple-800';
      case 'Sondahland': return 'bg-blue-100 text-blue-800';
      case 'BMI': return 'bg-green-100 text-green-800';
      case 'ASCAP': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBatch(id);
      toast({
        title: "Batch Deleted",
        description: "Reconciliation batch has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: "Error",
        description: "Failed to delete batch. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getBatchStatus = (progress: number) => {
    if (Math.abs(progress - 100) < 0.01) { // Account for floating point precision
      return 'Complete';
    } else {
      return 'Incomplete';
    }
  };

  const canProcessBatch = (progress: number, batch: any) => {
    const status = getBatchStatus(progress);
    return status === 'Complete' && batch.status !== 'Processed';
  };

  const uniqueSources = [...new Set(batches.map(batch => batch.source).filter(Boolean))];

  if (loading) {
    return <div className="p-8 text-center">Loading reconciliation batches...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search batches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Incomplete">Incomplete</SelectItem>
            <SelectItem value="Complete">Complete</SelectItem>
            <SelectItem value="Processed">Processed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={reconciliationFilter} onValueChange={setReconciliationFilter}>
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="All Reconciliation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reconciliation</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={refreshBatches} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Date Received</TableHead>
              <TableHead>Gross Amount</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBatches.map((batch) => {
              const progressData = batchProgressData.get(batch.id);
              const progress = progressData?.progress || 0;
              const allocatedAmount = progressData?.allocatedAmount || 0;
              
              return (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batch_id}</TableCell>
                  <TableCell>
                    <Badge className={getSourceColor(batch.source || '')}>
                      {batch.source}
                    </Badge>
                  </TableCell>
                  <TableCell>{batch.statement_period_start || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(batch.date_received).toLocaleDateString()}
                  </TableCell>
                  <TableCell>${batch.total_gross_amount.toLocaleString()}</TableCell>
                  <TableCell className="w-[200px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>${allocatedAmount.toLocaleString()}</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(getBatchStatus(progress))}>
                      {getBatchStatus(progress)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingBatch(batch)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setProcessingBatch(batch)}
                        disabled={!canProcessBatch(progress, batch)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(batch.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create Batch Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Reconciliation Batch</DialogTitle>
          </DialogHeader>
          <ReconciliationBatchForm onCancel={() => setShowCreateForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Batch Dialog */}
      <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reconciliation Batch</DialogTitle>
          </DialogHeader>
          <ReconciliationBatchForm 
            batch={editingBatch}
            onCancel={() => setEditingBatch(null)}
            onSuccess={() => {
              setEditingBatch(null);
              refreshBatches();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Process Batch Dialog */}
      <ProcessBatchDialog
        batch={processingBatch}
        open={!!processingBatch}
        onOpenChange={(open) => !open && setProcessingBatch(null)}
      />
    </div>
  );
}