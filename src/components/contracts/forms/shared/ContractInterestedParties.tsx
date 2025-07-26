import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Interested Parties</CardTitle>
        <CardDescription>
          Manage the writers, publishers, and other interested parties for the works in this {contractType} agreement.
          Define ownership percentages and roles for each party.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
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
      </CardContent>
    </Card>
  );
};