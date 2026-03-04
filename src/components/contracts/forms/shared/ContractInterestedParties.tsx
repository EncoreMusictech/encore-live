import React from 'react';
import { InterestedPartiesTable } from '../../InterestedPartiesTable';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ContractInterestedPartiesProps {
  data: any;
  onChange: (data: any) => void;
  contractType?: string;
}

export const ContractInterestedParties: React.FC<ContractInterestedPartiesProps> = ({
  data,
  onChange,
  contractType
}) => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Interested parties are automatically populated based on the copyright registrations of the selected works.
          You can modify ownership percentages and add additional parties as needed.
        </AlertDescription>
      </Alert>
      
      {data.contractId ? (
        <InterestedPartiesTable contractId={data.contractId} />
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Contract must be created before managing interested parties. This will happen automatically when you proceed through the form.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
