import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  LinkIcon, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Users,
  Percent,
  MapPin
} from 'lucide-react';
import { Copyright } from '@/hooks/useCopyright';
import { useContracts } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';

interface ContractIntegrationPanelProps {
  copyright: Copyright;
  onContractLinked?: (contractId: string) => void;
}

interface ContractSummary {
  id: string;
  title: string;
  type: string;
  parties: string[];
  startDate?: string;
  endDate?: string;
  controlledPercentage?: number;
  territories?: string[];
}

export const ContractIntegrationPanel: React.FC<ContractIntegrationPanelProps> = ({
  copyright,
  onContractLinked
}) => {
  const { contracts, loading } = useContracts();
  const { toast } = useToast();
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [linkedContracts, setLinkedContracts] = useState<ContractSummary[]>([]);
  const [availableContracts, setAvailableContracts] = useState<ContractSummary[]>([]);

  useEffect(() => {
    if (contracts) {
      // Filter contracts that could be linked to this copyright
      const available = contracts
        .filter(contract => 
          contract.contract_type === 'publishing' && 
          contract.contract_status === 'signed'
        )
        .map(contract => ({
          id: contract.id,
          title: contract.title,
          type: contract.contract_type,
          parties: [contract.counterparty_name],
          startDate: contract.start_date,
          endDate: contract.end_date,
          controlledPercentage: contract.controlled_percentage,
          territories: contract.territories || []
        }));

      setAvailableContracts(available);

      // Check if this copyright is already linked to any contracts
      // This would typically come from a contract_schedule_works join
      // For now, we'll simulate this check
      const linked = available.filter(contract => 
        // Simulate linking logic - in reality this would check the database
        false
      );
      setLinkedContracts(linked);
    }
  }, [contracts, copyright.id]);

  const handleLinkContract = async () => {
    if (!selectedContract) return;

    try {
      // This would normally update the contract_schedule_works table
      // For now, we'll simulate the linking
      const contract = availableContracts.find(c => c.id === selectedContract);
      if (contract) {
        setLinkedContracts(prev => [...prev, contract]);
        setAvailableContracts(prev => prev.filter(c => c.id !== selectedContract));
        setSelectedContract('');
        
        toast({
          title: "Contract linked successfully",
          description: `Work "${copyright.work_title}" has been linked to contract "${contract.title}".`
        });

        onContractLinked?.(selectedContract);
      }
    } catch (error) {
      toast({
        title: "Error linking contract",
        description: "Failed to link the contract. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUnlinkContract = async (contractId: string) => {
    try {
      const contract = linkedContracts.find(c => c.id === contractId);
      if (contract) {
        setLinkedContracts(prev => prev.filter(c => c.id !== contractId));
        setAvailableContracts(prev => [...prev, contract]);
        
        toast({
          title: "Contract unlinked",
          description: `Work has been unlinked from contract "${contract.title}".`
        });
      }
    } catch (error) {
      toast({
        title: "Error unlinking contract",
        description: "Failed to unlink the contract. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getContractStatusColor = (contract: ContractSummary) => {
    const now = new Date();
    const endDate = contract.endDate ? new Date(contract.endDate) : null;
    
    if (endDate && endDate < now) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (!contract.controlledPercentage || contract.controlledPercentage < 50) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Contract Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Link New Contract */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Link Publishing Agreement
          </h4>
          
          {availableContracts.length > 0 ? (
            <div className="flex gap-2">
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a publishing agreement" />
                </SelectTrigger>
                <SelectContent>
                  {availableContracts.map(contract => (
                    <SelectItem key={contract.id} value={contract.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{contract.title}</span>
                        <Badge variant="outline" className="ml-2">
                          {contract.controlledPercentage}% controlled
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleLinkContract}
                disabled={!selectedContract}
              >
                Link Contract
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No signed publishing agreements available for linking. 
                Create and sign a publishing agreement first.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Linked Contracts */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Linked Agreements ({linkedContracts.length})
          </h4>

          {linkedContracts.length > 0 ? (
            <div className="space-y-3">
              {linkedContracts.map(contract => (
                <div key={contract.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{contract.title}</h5>
                      <p className="text-sm text-muted-foreground">
                        {contract.parties.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getContractStatusColor(contract)}>
                        Active
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnlinkContract(contract.id)}
                      >
                        Unlink
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Term</div>
                        <div className="text-muted-foreground">
                          {contract.startDate} - {contract.endDate || 'Perpetual'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Controlled</div>
                        <div className="text-muted-foreground">
                          {contract.controlledPercentage || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Territories</div>
                        <div className="text-muted-foreground">
                          {contract.territories?.length || 0} territories
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Type</div>
                        <div className="text-muted-foreground capitalize">
                          {contract.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                No contracts linked to this work yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Link a publishing agreement to auto-populate ownership and territory information.
              </p>
            </div>
          )}
        </div>

        {/* Contract Benefits */}
        {linkedContracts.length > 0 && (
          <>
            <Separator />
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Contract Integration Active:</strong> Writer and publisher information, 
                ownership percentages, and territory rights will be automatically inherited 
                from linked agreements during CWR export.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};