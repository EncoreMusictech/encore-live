import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link, Unlink, FileText, Calendar, MapPin, Building, Users, CheckCircle, AlertTriangle, Percent } from 'lucide-react';
import { Copyright } from '@/hooks/useCopyright';
import { useContracts } from '@/hooks/useContracts';
import { useContractLinking } from '@/hooks/useContractLinking';
import { useToast } from '@/hooks/use-toast';

interface ContractIntegrationPanelProps {
  copyright: Copyright;
  onContractLinked?: (contractId: string) => void;
}

interface ContractSummary {
  id: string;
  title: string;
  contractType: string;
  status: string;
  parties: string;
  term: string;
  controlledPercentage: number;
  territories: string[];
  agreementType: string;
}

export const ContractIntegrationPanel: React.FC<ContractIntegrationPanelProps> = ({
  copyright,
  onContractLinked
}) => {
  const { contracts, loading } = useContracts();
  const { linkContractToCopyright, unlinkContractFromCopyright, getLinkedContracts, isLinking } = useContractLinking();
  const { toast } = useToast();
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [inheritWriters, setInheritWriters] = useState<boolean>(true);
  const [linkedContracts, setLinkedContracts] = useState<ContractSummary[]>([]);
  const [availableContracts, setAvailableContracts] = useState<ContractSummary[]>([]);

  useEffect(() => {
    if (contracts) {
      // Filter to only show publishing contracts that are active or signed
      const publishingContracts = contracts.filter(
        contract => contract.contract_type === 'publishing' && 
                   (contract.contract_status === 'active' || contract.contract_status === 'signed')
      );

      const contractSummaries: ContractSummary[] = publishingContracts.map(contract => ({
        id: contract.id,
        title: contract.title,
        contractType: contract.contract_type,
        status: contract.contract_status,
        parties: contract.counterparty_name,
        term: contract.start_date && contract.end_date 
          ? `${contract.start_date} to ${contract.end_date}` 
          : 'Term not specified',
        controlledPercentage: contract.controlled_percentage || 0,
        territories: contract.territories || ['Worldwide'],
        agreementType: (contract.contract_data as any)?.agreement_type || 'Not specified'
      }));

      setAvailableContracts(contractSummaries);
    }
  }, [contracts]);

  // Load linked contracts when copyright changes
  useEffect(() => {
    if (copyright?.id) {
      loadLinkedContracts();
    }
  }, [copyright?.id]);

  const loadLinkedContracts = async () => {
    if (!copyright?.id) return;
    
    const linked = await getLinkedContracts(copyright.id);
    const contractSummaries: ContractSummary[] = linked.map(contract => ({
      id: contract.id,
      title: contract.title,
      contractType: contract.contract_type,
      status: contract.contract_status,
      parties: 'Contract Party', // Would come from contract data
      term: contract.start_date && contract.end_date 
        ? `${contract.start_date} to ${contract.end_date}` 
        : 'Term not specified',
      controlledPercentage: contract.controlled_percentage || 0,
      territories: contract.territories || ['Worldwide'],
      agreementType: 'Publishing Agreement'
    }));
    
    setLinkedContracts(contractSummaries);
  };

  const handleLinkContract = async () => {
    if (!selectedContract || !copyright?.id) return;

    const contractToLink = availableContracts.find(c => c.id === selectedContract);
    if (!contractToLink) return;

    const result = await linkContractToCopyright({
      contractId: selectedContract,
      copyrightId: copyright.id,
      workTitle: copyright.work_title,
      inheritWriters
    });

    if (result.success) {
      await loadLinkedContracts();
      setSelectedContract('');
      onContractLinked?.(contractToLink.id);
    }
  };

  const handleUnlinkContract = async (contractId: string) => {
    if (!copyright?.id) return;
    
    const contractToUnlink = linkedContracts.find(c => c.id === contractId);
    if (!contractToUnlink) return;

    const result = await unlinkContractFromCopyright(contractId, copyright.id);
    
    if (result.success) {
      await loadLinkedContracts();
    }
  };

  const getContractStatusColor = (contract: ContractSummary) => {
    const now = new Date();
    const endDate = contract.term.includes('to') ? new Date(contract.term.split(' to ')[1]) : null;
    
    if (endDate && endDate < now) {
      return 'destructive';
    }
    if (contract.controlledPercentage < 50) {
      return 'secondary';
    }
    return 'default';
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
            <Link className="h-4 w-4" />
            Link Publishing Agreement
          </h4>
          
          {availableContracts.length > 0 ? (
            <div className="space-y-3">
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
                  disabled={!selectedContract || isLinking}
                  className="ml-2"
                >
                  <Link className="h-4 w-4 mr-2" />
                  {isLinking ? 'Linking...' : 'Link Contract'}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="inherit-writers" 
                  checked={inheritWriters} 
                  onCheckedChange={(checked) => setInheritWriters(checked === true)}
                />
                <Label htmlFor="inherit-writers" className="text-sm">
                  Inherit controlled writers as interested parties
                </Label>
              </div>
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
                        {contract.parties}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getContractStatusColor(contract)}>
                        {contract.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkContract(contract.id)}
                        disabled={isLinking}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Term</div>
                        <div className="text-muted-foreground">
                          {contract.term}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Controlled</div>
                        <div className="text-muted-foreground">
                          {contract.controlledPercentage}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Territories</div>
                        <div className="text-muted-foreground">
                          {contract.territories.length} territories
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Type</div>
                        <div className="text-muted-foreground">
                          {contract.agreementType}
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