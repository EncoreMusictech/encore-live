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
import { Search, Edit, Trash2, Download, FileText, DollarSign, ChevronDown, Play, CheckCircle, AlertCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePayouts } from "@/hooks/usePayouts";
import { useAuth } from "@/hooks/useAuth";
import { useClientPortal } from "@/hooks/useClientPortal";
import { PayoutForm } from "./PayoutForm";
import { toast } from "@/hooks/use-toast";

export function PayoutList() {
  const { user } = useAuth();
  const { isClient } = useClientPortal();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingPayout, setEditingPayout] = useState<any>(null);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [exportingStatement, setExportingStatement] = useState<string | null>(null);
  const [isClientPortal, setIsClientPortal] = useState(false);
  const { payouts, loading, deletePayout, updateWorkflowStage, bulkUpdatePayouts, refreshPayouts, getPayoutExpenses, recalculatePayoutExpenses } = usePayouts();

  // Check if this is client portal view - only hide columns for actual client portal routes
  useEffect(() => {
    const checkClientStatus = async () => {
      // Only hide columns if we're actually in a client portal route context
      const isClientRoute = window.location.pathname.includes('/client-portal');
      const clientStatus = isClientRoute ? await isClient() : false;
      setIsClientPortal(clientStatus);
    };
    checkClientStatus();
    
    // Force refresh payouts to ensure we get the latest data with new columns
    refreshPayouts();
  }, [isClient, refreshPayouts]);

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

  const handleExportStatement = async (payout: any, format: 'pdf' | 'xlsx' = 'pdf') => {
    setExportingStatement(payout.id);
    try {
      toast({
        title: "Generating Statement",
        description: `Creating ${format.toUpperCase()} statement...`,
      });

      console.log('Starting statement generation for payout:', payout.id, 'format:', format);

      // Get the session token
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Making request to edge function...');

      // Call the Supabase edge function to generate statement
      const response = await supabase.functions.invoke('generate-payout-statement', {
        body: { 
          payoutId: payout.id,
          format: format
        }
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(`Failed to generate statement: ${response.error.message || 'Unknown error'}`);
      }

      // The response data should be the content
      if (!response.data) {
        throw new Error('No data received from statement generator');
      }

      console.log('Statement generated successfully');

      // Check if the response is HTML content (for PDF format)
      const isHtmlResponse = format === 'pdf' && typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>');
      
      if (isHtmlResponse) {
        // For HTML responses, open in a new tab
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(response.data);
          newWindow.document.close();
        } else {
          // Fallback: create a blob URL and open it
          const blob = new Blob([response.data], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          // Clean up the URL after a delay
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        }
      } else {
        // For other formats (xlsx or actual binary PDF), download as before
        const blob = new Blob([response.data], { 
          type: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payout-statement-${payout.period || payout.id}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Statement Ready",
        description: isHtmlResponse 
          ? `${format.toUpperCase()} statement opened in new tab. Use your browser's print function to save as PDF.`
          : `${format.toUpperCase()} statement downloaded successfully`,
      });
    } catch (error) {
      console.error('Error exporting statement:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate statement. Please try again.",
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

  const handleBulkExport = async (format: 'pdf' | 'xlsx' | 'both' = 'pdf') => {
    toast({
      title: "Export Started",
      description: `Generating ${selectedPayouts.length} statements as ${format.toUpperCase()}...`,
    });
    
    try {
      console.log('Starting bulk export:', { payoutIds: selectedPayouts, format });

      // Generate statements using Supabase edge function
      const response = await supabase.functions.invoke('generate-bulk-statements', {
        body: { 
          payoutIds: selectedPayouts,
          format: format
        }
      });

      if (response.error) {
        console.error('Bulk export edge function error:', response.error);
        throw new Error(`Failed to generate bulk statements: ${response.error.message || 'Unknown error'}`);
      }

      if (!response.data) {
        throw new Error('No data received from bulk statement generator');
      }

      console.log('Bulk statements generated successfully');

      // Convert response to blob for download
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulk-payout-statements-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Downloaded ${selectedPayouts.length} statements (${(blob.size / 1024).toFixed(1)} KB)`,
      });
    } catch (error) {
      console.error('Error in bulk export:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate bulk statements",
        variant: "destructive",
      });
    }
  };

  const handleRecalculateExpenses = async (payoutId: string) => {
    try {
      await recalculatePayoutExpenses(payoutId);
    } catch (error) {
      console.error('Error recalculating expenses:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate expenses",
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
              <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>
                Export as PDF ZIP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkExport('xlsx')}>
                Export as Excel ZIP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkExport('both')}>
                Export as PDF + Excel ZIP
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
              <TableHead>Period</TableHead>
              <TableHead>Payee Name</TableHead>
              {!isClientPortal && <TableHead>Total Royalties</TableHead>}
              {!isClientPortal && <TableHead>Commissions</TableHead>}
              <TableHead>Gross Royalties</TableHead>
              <TableHead>Total Expenses</TableHead>
              <TableHead>Net Royalties</TableHead>
              <TableHead>Royalties to Date</TableHead>
              <TableHead>Payments to Date</TableHead>
              <TableHead>Net Payable</TableHead>
              <TableHead>Amount Due</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell>{payout.period}</TableCell>
                <TableCell className="font-medium">
                  {payout.contacts?.name || 'No Contact Assigned'}
                </TableCell>
                {!isClientPortal && (
                  <TableCell className="text-blue-600 font-medium">
                    ${payout.total_royalties?.toLocaleString() || '0'}
                  </TableCell>
                )}
                {!isClientPortal && (
                  <TableCell className="text-orange-600">
                    ${payout.commissions_amount?.toLocaleString() || '0'}
                  </TableCell>
                )}
                <TableCell>${payout.gross_royalties?.toLocaleString() || '0'}</TableCell>
                <TableCell className="text-red-600">
                  ${payout.total_expenses?.toLocaleString() || '0'}
                </TableCell>
                <TableCell>${payout.net_royalties?.toLocaleString() || '0'}</TableCell>
                <TableCell>${payout.royalties_to_date?.toLocaleString() || '0'}</TableCell>
                <TableCell>${payout.payments_to_date?.toLocaleString() || '0'}</TableCell>
                <TableCell>${payout.net_payable?.toLocaleString() || '0'}</TableCell>
                <TableCell className="font-medium text-green-600">
                  ${payout.amount_due?.toLocaleString() || '0'}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditingPayout(payout)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Payout
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRecalculateExpenses(payout.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Recalculate Expenses
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportStatement(payout, 'pdf')}>
                          <FileText className="h-4 w-4 mr-2" />
                          {exportingStatement === payout.id ? "Generating..." : "Export PDF"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportStatement(payout, 'xlsx')}>
                          <Download className="h-4 w-4 mr-2" />
                          {exportingStatement === payout.id ? "Generating..." : "Export Excel"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Edit Dialog */}
      {editingPayout && (
        <Dialog open={!!editingPayout} onOpenChange={() => setEditingPayout(null)}>
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
      )}
    </div>
  );
}