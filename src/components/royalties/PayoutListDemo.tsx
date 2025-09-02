import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Edit, Trash2, FileText, ChevronDown, Play, CheckCircle, AlertCircle, Clock, XCircle, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Demo data to show the enhanced features
const demoPayouts = [
  {
    id: "1",
    period: "Q3 2025",
    payee_name: "Janishia Jones",
    total_royalties: 500120.44,
    commissions: 75018.066,
    gross_royalties: 425102.37,
    total_expenses: 100000,
    net_royalties: 325102.37,
    royalties_to_date: 500120.44,
    payments_to_date: 0,
    net_payable: 325102.37,
    amount_due: 325102.37,
    payment_method: "",
    status: "paid"
  }
];

export function PayoutListDemo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);

  const filteredPayouts = demoPayouts.filter(payout => {
    const matchesSearch = payout.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.payee_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter;
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

  const handleWorkflowUpdate = (payoutId: string, newStage: string) => {
    console.log(`Updating payout ${payoutId} to stage: ${newStage}`);
    // Note: This is demo data only - changes won't affect the dashboard
    toast({
      title: "Demo Mode",
      description: "This is demo data. Create real payouts to see dashboard updates.",
      variant: "default",
    });
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for payouts:`, selectedPayouts);
    // In real implementation, this would call the API
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

  return (
    <div className="space-y-4">
      {/* Demo Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> This tab shows sample payout data for demonstration purposes. 
          The dashboard statistics above reflect your actual database (currently empty). 
          Use "New Payout" to create real payouts that will update the dashboard.
        </AlertDescription>
      </Alert>

      {/* Enhanced Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by period or payee name..."
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

      {/* Enhanced Table with Workflow Management */}
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
               <TableHead>Total Royalties</TableHead>
               <TableHead>Commissions</TableHead>
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
                   {payout.payee_name}
                 </TableCell>
                 <TableCell className="text-blue-600 font-medium">
                   ${payout.total_royalties.toLocaleString()}
                 </TableCell>
                 <TableCell className="text-orange-600">
                   ${payout.commissions.toLocaleString()}
                 </TableCell>
                 <TableCell>${payout.gross_royalties.toLocaleString()}</TableCell>
                 <TableCell className="text-red-600">
                   ${payout.total_expenses.toLocaleString()}
                 </TableCell>
                 <TableCell>${payout.net_royalties.toLocaleString()}</TableCell>
                 <TableCell>${payout.royalties_to_date.toLocaleString()}</TableCell>
                 <TableCell>${payout.payments_to_date.toLocaleString()}</TableCell>
                 <TableCell>${payout.net_payable.toLocaleString()}</TableCell>
                 <TableCell className="text-green-600 font-medium">
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
                         <Badge className={getWorkflowStageColor(payout.status)}>
                           {getWorkflowStageIcon(payout.status)}
                           {payout.status.replace('_', ' ')}
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
                       onClick={() => console.log('Export statement for:', payout)}
                       title="Export PDF Statement"
                     >
                       <FileText className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="sm">
                       <Edit className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="sm">
                       <Trash2 className="h-4 w-4" />
                     </Button>
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