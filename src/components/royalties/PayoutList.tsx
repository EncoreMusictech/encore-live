import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Edit, Trash2, Download, FileText, DollarSign, ChevronDown, Play, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePayouts } from "@/hooks/usePayouts";
import { useAuth } from "@/hooks/useAuth";
import { PayoutForm } from "./PayoutForm";
import { toast } from "@/hooks/use-toast";

export function PayoutList() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingPayout, setEditingPayout] = useState<any>(null);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [exportingStatement, setExportingStatement] = useState<string | null>(null);
  const [payoutExpenses, setPayoutExpenses] = useState<{[key: string]: number}>({});
  const { payouts, loading, deletePayout, updateWorkflowStage, bulkUpdatePayouts, refreshPayouts, getPayoutExpenses } = usePayouts();

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.period?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === "all" || payout.workflow_stage === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getWorkflowStageColor = (stage: string) => {
    switch (stage) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkflowStageIcon = (stage: string) => {
    switch (stage) {
      case 'draft': return <Edit className="h-3 w-3" />;
      case 'pending_review': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'processing': return <Play className="h-3 w-3" />;
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      case 'failed': return <XCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'ACH': return 'bg-blue-100 text-blue-800';
      case 'Wire': return 'bg-purple-100 text-purple-800';
      case 'PayPal': return 'bg-indigo-100 text-indigo-800';
      case 'Check': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePayout(id);
      toast({
        title: "Payout Deleted",
        description: "Payout has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting payout:', error);
      toast({
        title: "Error",
        description: "Failed to delete payout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportStatement = async (payout: any) => {
    setExportingStatement(payout.id);
    try {
      toast({
        title: "Generating Statement",
        description: "Creating PDF statement...",
      });

      // Call the edge function to generate PDF
      const response = await fetch('/api/generate-payout-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payoutId: payout.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate statement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payout-statement-${payout.period || payout.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Statement Ready",
        description: "PDF statement downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting statement:', error);
      toast({
        title: "Error",
        description: "Failed to generate statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportingStatement(null);
    }
  };

  const handleWorkflowUpdate = async (payoutId: string, newStage: string) => {
    try {
      await updateWorkflowStage(payoutId, newStage, `Updated to ${newStage} via UI`);
      toast({
        title: "Workflow Updated",
        description: `Payout status updated to ${newStage.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow stage",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPayouts.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select payouts to perform bulk actions",
        variant: "destructive",
      });
      return;
    }

    setBulkActionLoading(true);
    try {
      switch (action) {
        case 'bulk_approve':
          await bulkUpdatePayouts(selectedPayouts, 'update_workflow_stage', { stage: 'approved' });
          toast({
            title: "Bulk Approval",
            description: `${selectedPayouts.length} payouts approved successfully`,
          });
          break;
        case 'bulk_process':
          await bulkUpdatePayouts(selectedPayouts, 'update_workflow_stage', { stage: 'processing' });
          toast({
            title: "Bulk Processing",
            description: `${selectedPayouts.length} payouts set to processing`,
          });
          break;
        case 'bulk_export':
          await handleBulkExport();
          break;
      }
      setSelectedPayouts([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkExport = async () => {
    toast({
      title: "Export Started",
      description: "Generating statements for selected payouts...",
    });
    
    try {
      // Generate statements for all selected payouts
      const response = await fetch('/api/generate-bulk-statements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payoutIds: selectedPayouts }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate bulk statements');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulk-payout-statements-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Bulk statements downloaded successfully",
      });
    } catch (error) {
      console.error('Error in bulk export:', error);
      toast({
        title: "Error",
        description: "Failed to generate bulk statements",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayouts(filteredPayouts.map(p => p.id));
    } else {
      setSelectedPayouts([]);
    }
  };

  const handleSelectPayout = (payoutId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayouts([...selectedPayouts, payoutId]);
    } else {
      setSelectedPayouts(selectedPayouts.filter(id => id !== payoutId));
    }
  };

  // Fetch expenses for all payees (writers)
  useEffect(() => {
    const fetchAllExpenses = async () => {
      if (!payouts.length) return;
      
      // Get unique client IDs from payouts (contact IDs)
      const clientIds = [...new Set(payouts.map(payout => payout.client_id).filter(Boolean))];
      
      const expensePromises = clientIds.map(async (clientId) => {
        try {
          // First, find the payee record that corresponds to this client (contact)
          // The payees table links writer_id (contact) to payee_id (expense recipient)
          const { data: payees, error: payeeError } = await supabase
            .from('payees')
            .select('id')
            .eq('writer_id', clientId)
            .eq('user_id', user?.id);

          if (payeeError) throw payeeError;

          // If no payee found for this client, return 0 expenses
          if (!payees || payees.length === 0) {
            return { clientId, total: 0 };
          }

          // Get all payee IDs for this client (there might be multiple payees per writer)
          const payeeIds = payees.map(p => p.id);

          // Fetch all expenses for these payees
          const { data: expenses, error: expenseError } = await supabase
            .from('payout_expenses')
            .select('*')
            .in('payee_id', payeeIds)
            .eq('user_id', user?.id);

          if (expenseError) throw expenseError;

          // Calculate total recoupable expenses for this client
          const recoupableTotal = (expenses || [])
            .filter(expense => {
              // Check the legacy boolean field first
              if (expense.is_recoupable) return true;
              
              // Check the new JSON field if it exists
              if (expense.expense_flags && typeof expense.expense_flags === 'object') {
                const flags = expense.expense_flags as { recoupable?: boolean };
                return flags.recoupable === true;
              }
              
              return false;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);
            
          return { clientId, total: recoupableTotal };
        } catch (error) {
          console.error('Error fetching expenses for client:', clientId, error);
          return { clientId, total: 0 };
        }
      });
      
      const results = await Promise.all(expensePromises);
      // Map by client_id to store total recoupable expenses per client
      const expenseMap = results.reduce((acc, { clientId, total }) => {
        acc[clientId] = total;
        return acc;
      }, {} as {[key: string]: number});
      
      setPayoutExpenses(expenseMap);
    };

    fetchAllExpenses();
  }, [payouts, user?.id]);

  if (loading) {
    return <div className="p-8 text-center">Loading payouts...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by period or client name..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        
        {selectedPayouts.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={bulkActionLoading}>
                {bulkActionLoading ? "Processing..." : `Bulk Actions (${selectedPayouts.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkAction('bulk_approve')}>
                Approve Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('bulk_process')}>
                Process Payments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('bulk_export')}>
                Export Statements
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Payee Name</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Gross Royalties</TableHead>
              <TableHead>Expenses</TableHead>
              <TableHead>Net Payable</TableHead>
              <TableHead>Amount Due</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Workflow Stage</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPayouts.includes(payout.id)}
                    onCheckedChange={(checked) => handleSelectPayout(payout.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {payout.contacts?.name || 'No Contact Assigned'}
                </TableCell>
                <TableCell>{payout.period}</TableCell>
                <TableCell>${payout.gross_royalties.toLocaleString()}</TableCell>
                <TableCell className="text-red-600">
                  ${(payoutExpenses[payout.client_id] || 0).toLocaleString()}
                </TableCell>
                <TableCell>${payout.net_payable.toLocaleString()}</TableCell>
                <TableCell className="font-medium">
                  ${payout.amount_due.toLocaleString()}
                </TableCell>
                <TableCell>
                  {payout.payment_method && (
                    <Badge className={getPaymentMethodColor(payout.payment_method)}>
                      {payout.payment_method}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Badge className={getWorkflowStageColor(payout.workflow_stage || 'draft')}>
                          {getWorkflowStageIcon(payout.workflow_stage || 'draft')}
                          {payout.workflow_stage?.replace('_', ' ') || 'draft'}
                        </Badge>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleWorkflowUpdate(payout.id, 'pending_review')}>
                        Move to Pending Review
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleWorkflowUpdate(payout.id, 'approved')}>
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleWorkflowUpdate(payout.id, 'processing')}>
                        Start Processing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleWorkflowUpdate(payout.id, 'paid')}>
                        Mark as Paid
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportStatement(payout)}
                      disabled={exportingStatement === payout.id}
                      title="Export PDF Statement"
                    >
                      {exportingStatement === payout.id ? (
                        <Download className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPayout(payout)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Payout</DialogTitle>
                        </DialogHeader>
                        <PayoutForm
                          payout={editingPayout}
                          onCancel={() => setEditingPayout(null)}
                        />
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
                            This will permanently delete the payout for "{payout.period}" and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(payout.id)}>
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

      {filteredPayouts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || statusFilter !== "all"
            ? "No payouts found matching your filters."
            : "No payouts found. Create your first payout to get started."}
        </div>
      )}
    </div>
  );
}