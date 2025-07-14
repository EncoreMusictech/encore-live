import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useWriterContracts } from '@/hooks/useWriterContracts';
import { useNavigate } from 'react-router-dom';

interface WriterAgreementSectionProps {
  writerName: string;
}

export const WriterAgreementSection: React.FC<WriterAgreementSectionProps> = ({ writerName }) => {
  const { contracts, loading } = useWriterContracts(writerName);
  const navigate = useNavigate();

  const handleOpenContract = (contractId: string) => {
    navigate(`/contract-management?id=${contractId}`);
  };

  if (!writerName || writerName.trim().length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Enter writer name to view agreements
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Searching agreements...
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No agreements found for this writer
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Agreements ({contracts.length})</div>
      <div className="space-y-1">
        {contracts.map((contract) => (
          <div key={contract.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {contract.contract_type}
              </Badge>
              <span className="truncate max-w-[120px]" title={contract.title}>
                {contract.title}
              </span>
              <Badge 
                variant={contract.contract_status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {contract.contract_status}
              </Badge>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => handleOpenContract(contract.id)}
              className="h-6 w-6 p-0"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};