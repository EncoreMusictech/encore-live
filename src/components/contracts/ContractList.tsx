import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, MoreHorizontal, Edit, Eye, Download, Trash2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ContractViewDialog } from "./ContractViewDialog";
import { usePDFGeneration } from "@/hooks/usePDFGeneration";
import { useBulkOperations } from "@/hooks/useBulkOperations";

interface Contract {
  id: string;
  title: string;
  contract_type: string;
  contract_status: string;
  counterparty_name: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  version: number;
  template_id?: string;
  original_pdf_url?: string;
  agreement_id?: string;
}

interface ContractConnectionCheck {
  has_connections: boolean;
  royalty_connections: number;
  active_payouts: number;
  royalty_allocations: number;
  can_delete: boolean;
}

interface ContractListProps {
  onEdit?: (contract: Contract) => void;
}

export function ContractList({ onEdit }: ContractListProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [downloadingContractId, setDownloadingContractId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { generatePDF, downloadPDF, isGenerating } = usePDFGeneration();
  
  const {
    operations,
    addOperations,
    processOperations,
    clearOperations,
    statistics,
    isProcessing
  } = useBulkOperations<Contract>();

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        toast({
          title: "Error",
          description: "Failed to load contracts",
          variant: "destructive",
        });
        return;
      }

      setContracts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (contract: Contract) => {
    setDownloadingContractId(contract.id);
    
    try {
      console.log('Starting PDF download for contract:', contract.title);
      
      const result = await generatePDF(contract.id);
      
      if (result && result.success && result.pdfData) {
        const fileName = `${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_Agreement`;
        downloadPDF(result.pdfData, fileName);
      }
    } catch (error) {
      console.error('PDF download failed:', error);
    } finally {
      setDownloadingContractId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'signed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'terminated':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const formatContractType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'publishing': 'Publishing Agreement',
      'artist': 'Artist Agreement',
      'distribution': 'Distribution Deal',
      'producer': 'Producer Agreement',
      'sync': 'TV Sync License',
      'management': 'Management Agreement',
      'label': 'Label Agreement',
      'songwriter': 'Songwriter Agreement'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const getCreationMethod = (contract: Contract) => {
    if (contract.original_pdf_url) {
      return 'Uploaded';
    } else if (contract.template_id) {
      return 'Template';
    } else {
      return 'Created';
    }
  };

  const getCreationMethodColor = (method: string) => {
    switch (method) {
      case 'Uploaded':
        return 'bg-blue-50 text-blue-700';
      case 'Template':
        return 'bg-purple-50 text-purple-700';
      case 'Created':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const checkContractConnections = async (contractId: string): Promise<ContractConnectionCheck> => {
    try {
      const { data, error } = await supabase
        .rpc('check_contract_payee_connections', { contract_id_param: contractId });

      if (error) {
        console.error('Error checking contract connections:', error);
        return { can_delete: false, has_connections: true, royalty_connections: 0, active_payouts: 0, royalty_allocations: 0 };
      }

      return (data as unknown as ContractConnectionCheck) || { can_delete: false, has_connections: true, royalty_connections: 0, active_payouts: 0, royalty_allocations: 0 };
    } catch (error) {
      console.error('Error:', error);
      return { can_delete: false, has_connections: true, royalty_connections: 0, active_payouts: 0, royalty_allocations: 0 };
    }
  };

  const handleDelete = async (contractId: string) => {
    // Check for royalty connections before deletion
    const connectionCheck = await checkContractConnections(contractId);
    
    if (!connectionCheck.can_delete) {
      toast({
        title: "Cannot Delete Contract",
        description: `This contract cannot be deleted because it has active connections to the Royalties Processing system (${connectionCheck.royalty_connections || 0} royalty connections, ${connectionCheck.active_payouts || 0} active payouts, ${connectionCheck.royalty_allocations || 0} royalty allocations).`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) {
        console.error('Error deleting contract:', error);
        toast({
          title: "Error",
          description: "Failed to delete contract",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Contract deleted successfully",
      });
      
      fetchContracts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(contracts.map(contract => contract.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (contractId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(contractId);
    } else {
      newSelection.delete(contractId);
    }
    setSelectedItems(newSelection);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Bulk delete functionality
  const handleBulkDelete = async () => {
    const selectedContracts = contracts.filter(contract => selectedItems.has(contract.id));
    
    // Check each contract for connections before proceeding
    const contractsWithConnections: (Contract & { connections: ContractConnectionCheck })[] = [];
    const contractsToDelete: Contract[] = [];
    
    for (const contract of selectedContracts) {
      const connectionCheck = await checkContractConnections(contract.id);
      if (!connectionCheck.can_delete) {
        contractsWithConnections.push({
          ...contract,
          connections: connectionCheck
        });
      } else {
        contractsToDelete.push(contract);
      }
    }
    
    // If some contracts have connections, show warning
    if (contractsWithConnections.length > 0) {
      const hasOnlyProtectedContracts = contractsToDelete.length === 0;
      
      toast({
        title: hasOnlyProtectedContracts ? "Cannot Delete Any Selected Contracts" : "Some Contracts Cannot Be Deleted",
        description: hasOnlyProtectedContracts 
          ? `All ${contractsWithConnections.length} selected contract(s) have active connections to the Royalties Processing system and cannot be deleted.`
          : `${contractsWithConnections.length} contract(s) have active royalty connections and will be skipped. Only ${contractsToDelete.length} contract(s) will be deleted.`,
        variant: "destructive",
      });
      
      // If no contracts can be deleted, return early
      if (hasOnlyProtectedContracts) {
        return;
      }
    }
    
    // Proceed with deleting only the contracts without connections
    if (contractsToDelete.length === 0) {
      return;
    }
    
    // Clear current operations and add delete operations
    clearOperations();
    addOperations(
      contractsToDelete.map(contract => ({
        type: 'delete' as const,
        data: contract
      }))
    );

    // Process deletions
    await processOperations(async (operations) => {
      const results = [];
      
      for (const operation of operations) {
        try {
          const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', operation.data.id);

          if (error) throw error;
          
          results.push({ success: true, id: operation.data.id });
        } catch (error) {
          console.error(`Failed to delete contract ${operation.data.id}:`, error);
          results.push({ success: false, id: operation.data.id, error });
        }
      }
      
      return results;
    });

    // Show success message and refresh
    const deletedCount = statistics.completed;
    const failedCount = statistics.failed;
    const skippedCount = contractsWithConnections.length;
    
    if (deletedCount > 0) {
      toast({
        title: "Bulk Delete Complete",
        description: `Successfully deleted ${deletedCount} contract(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}${skippedCount > 0 ? `, ${skippedCount} skipped (have royalty connections)` : ''}`,
      });
      fetchContracts();
    }
    
    clearSelection();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading contracts...</div>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No contracts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first contract to get started with contract management.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Contracts</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Bulk Actions Bar */}
        {selectedItems.size > 0 && (
          <Card className="border-orange-200 bg-orange-50/50 mb-4">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedItems.size} contract{selectedItems.size > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Selection
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Contracts</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedItems.size} contract{selectedItems.size > 1 ? 's' : ''}? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedItems.size === contracts.length && contracts.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all contracts"
                />
              </TableHead>
              <TableHead>Agreement ID</TableHead>
              <TableHead>Contract</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.has(contract.id)}
                    onCheckedChange={(checked) => handleSelectItem(contract.id, checked as boolean)}
                    aria-label={`Select ${contract.title}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm font-medium text-muted-foreground">
                    {contract.agreement_id || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(contract.contract_type)}
                    <div>
                      <div className="font-medium">{contract.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Created {format(new Date(contract.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatContractType(contract.contract_type)}
                  </Badge>
                </TableCell>
                <TableCell>{contract.counterparty_name}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(contract.contract_status)}>
                    {contract.contract_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {contract.start_date ? format(new Date(contract.start_date), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell>
                  {contract.end_date ? format(new Date(contract.end_date), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell>v{contract.version}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setViewContract(contract);
                        setIsViewDialogOpen(true);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(contract)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDownloadPDF(contract)}
                        disabled={downloadingContractId === contract.id || isGenerating}
                      >
                        {downloadingContractId === contract.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(contract.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      <ContractViewDialog
        contract={viewContract}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        onEdit={onEdit}
      />
    </Card>
  );
}
