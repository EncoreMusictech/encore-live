import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, MoreHorizontal, Edit, Eye, Download, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ContractViewDialog } from "./ContractViewDialog";
import { usePDFGeneration } from "@/hooks/usePDFGeneration";

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
  const { toast } = useToast();
  const { generatePDF, downloadPDF, isGenerating } = usePDFGeneration();

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
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const handleDelete = async (contractId: string) => {
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
        <Table>
          <TableHeader>
            <TableRow>
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
      />
    </Card>
  );
}
