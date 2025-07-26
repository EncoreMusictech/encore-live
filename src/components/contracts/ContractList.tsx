import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, MoreHorizontal, Edit, Eye, Download, Trash2, Loader2, Users, Calendar, DollarSign, Upload, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ContractViewDialog } from "./ContractViewDialog";
import { usePDFGeneration } from "@/hooks/usePDFGeneration";
import { Skeleton } from "@/components/ui/skeleton";

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
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'signed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'terminated':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'publishing':
        return <FileText className="h-4 w-4" />;
      case 'artist':
        return <Users className="h-4 w-4" />;
      case 'producer':
        return <DollarSign className="h-4 w-4" />;
      case 'sync':
        return <Calendar className="h-4 w-4" />;
      case 'distribution':
        return <Upload className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
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
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Contracts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="bg-muted/50 rounded-full p-6 w-fit mx-auto mb-6">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No contracts yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first contract to get started with professional contract management and automated royalty processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" size="sm">
                View Templates
              </Button>
              <Button size="sm">
                Create Contract
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Your Contracts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/20">
                <TableHead className="font-semibold">Contract</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Counterparty</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Start Date</TableHead>
                <TableHead className="font-semibold">End Date</TableHead>
                <TableHead className="font-semibold">Version</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-lg p-2">
                        {getTypeIcon(contract.contract_type)}
                      </div>
                      <div>
                        <div className="font-medium">{contract.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {format(new Date(contract.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {formatContractType(contract.contract_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{contract.counterparty_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contract.contract_status)}>
                      {contract.contract_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contract.start_date ? format(new Date(contract.start_date), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contract.end_date ? format(new Date(contract.end_date), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      v{contract.version}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                          className="text-destructive focus:text-destructive"
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
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-6">
          {contracts.map((contract) => (
            <Card key={contract.id} className="border border-muted shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-primary/10 rounded-lg p-2">
                      {getTypeIcon(contract.contract_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{contract.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {contract.counterparty_name}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(contract.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Type</p>
                    <Badge variant="outline" className="text-xs">
                      {formatContractType(contract.contract_type)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Status</p>
                    <Badge className={`text-xs ${getStatusColor(contract.contract_status)}`}>
                      {contract.contract_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Start Date</p>
                    <p className="text-foreground">
                      {contract.start_date ? format(new Date(contract.start_date), 'MMM d, yyyy') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Version</p>
                    <Badge variant="secondary" className="font-mono text-xs">
                      v{contract.version}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Created {format(new Date(contract.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
