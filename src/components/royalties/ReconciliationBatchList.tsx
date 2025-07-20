import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, MoreHorizontal, Edit, Trash2, Download, FileText, Upload, RefreshCw } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { ReconciliationBatchForm } from "./ReconciliationBatchForm";

interface ReconciliationBatchListProps {
  onSelectBatch?: (batchId: string) => void;
}

export function ReconciliationBatchList({ onSelectBatch }: ReconciliationBatchListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const { batches, loading, deleteBatch, refreshBatches } = useReconciliationBatches();

  const filteredBatches = batches.filter(batch => {
    const batchId = batch.batch_id || '';
    const matchesSearch = batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    const matchesSource = sourceFilter === "all" || batch.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Imported': return 'bg-blue-100 text-blue-800';
      case 'Processed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'DSP': return 'bg-purple-100 text-purple-800';
      case 'PRO': return 'bg-indigo-100 text-indigo-800';
      case 'YouTube': return 'bg-red-100 text-red-800';
      case 'Other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBatch(id);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading batches...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Reconciliation Batches</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshBatches}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Imported">Imported</SelectItem>
            <SelectItem value="Processed">Processed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="DSP">DSP</SelectItem>
            <SelectItem value="PRO">PRO</SelectItem>
            <SelectItem value="YouTube">YouTube</SelectItem>
            <SelectItem value="BMI">BMI</SelectItem>
            <SelectItem value="ASCAP">ASCAP</SelectItem>
            <SelectItem value="SESAC">SESAC</SelectItem>
            <SelectItem value="SOCAN">SOCAN</SelectItem>
            <SelectItem value="Spotify">Spotify</SelectItem>
            <SelectItem value="Apple Music">Apple Music</SelectItem>
            <SelectItem value="Amazon Music">Amazon Music</SelectItem>
            <SelectItem value="Tidal">Tidal</SelectItem>
            <SelectItem value="Pandora">Pandora</SelectItem>
            <SelectItem value="SiriusXM">SiriusXM</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
           <TableHeader>
             <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Date Received</TableHead>
                <TableHead>Gross Amount</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {filteredBatches.map((batch) => (
               <TableRow key={batch.id}>
                 <TableCell className="font-medium">{batch.batch_id || 'Generating...'}</TableCell>
                 <TableCell>
                   <Badge className={getSourceColor(batch.source)}>
                     {batch.source}
                   </Badge>
                 </TableCell>
                 <TableCell>
                   {batch.statement_period_start && batch.statement_period_end
                     ? `${batch.statement_period_start} - ${batch.statement_period_end}`
                     : 'N/A'}
                 </TableCell>
                 <TableCell>
                   {new Date(batch.date_received).toLocaleDateString()}
                 </TableCell>
                 <TableCell>${batch.total_gross_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[120px]">
                      {(() => {
                        const allocatedAmount = batch.allocated_amount || 0;
                        const totalAmount = batch.total_gross_amount || 1; // Avoid division by zero
                        const progressPercentage = totalAmount > 0 ? (allocatedAmount / totalAmount) * 100 : 0;
                        const clampedProgress = Math.min(Math.max(progressPercentage, 0), 100);
                        
                        return (
                          <>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>${allocatedAmount.toLocaleString()}</span>
                              <span>{clampedProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={clampedProgress} className="h-2" />
                          </>
                        );
                      })()}
                    </div>
                 </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {onSelectBatch && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onSelectBatch(batch.id)}
                        title="Import Statements"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                    {batch.statement_file_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={batch.statement_file_url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingBatch(batch)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Reconciliation Batch</DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
                          <ReconciliationBatchForm
                            batch={editingBatch}
                            onCancel={() => setEditingBatch(null)}
                            onSuccess={() => {
                              setEditingBatch(null);
                              refreshBatches();
                            }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the reconciliation batch "{batch.batch_id}" and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(batch.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredBatches.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || statusFilter !== "all" || sourceFilter !== "all"
            ? "No batches found matching your filters."
            : "No reconciliation batches found. Create your first batch to get started."}
        </div>
      )}
    </div>
  );
}