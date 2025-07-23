import { useState } from "react";
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
import { usePayouts } from "@/hooks/usePayouts";
import { PayoutForm } from "./PayoutForm";

export function PayoutList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingPayout, setEditingPayout] = useState<any>(null);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const { payouts, loading, deletePayout, updateWorkflowStage, bulkUpdatePayouts } = usePayouts();

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.period.toLowerCase().includes(searchTerm.toLowerCase());
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
    await deletePayout(id);
  };

  const handleExportStatement = (payout: any) => {
    // This would generate and download a PDF statement
    console.log('Exporting statement for:', payout);
  };

  const handleWorkflowUpdate = async (payoutId: string, newStage: string) => {
    await updateWorkflowStage(payoutId, newStage);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPayouts.length === 0) return;
    await bulkUpdatePayouts(selectedPayouts, action);
    setSelectedPayouts([]);
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
              <Button variant="outline">
                Bulk Actions ({selectedPayouts.length}) <ChevronDown className="ml-2 h-4 w-4" />
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
              <TableHead>Client</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Gross Royalties</TableHead>
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
                  Client Name
                </TableCell>
                <TableCell>{payout.period}</TableCell>
                <TableCell>${payout.gross_royalties.toLocaleString()}</TableCell>
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
                      title="Export PDF Statement"
                    >
                      <FileText className="h-4 w-4" />
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