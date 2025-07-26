import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleWorksTable } from '../../ScheduleWorksTable';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ContractWorksProps {
  data: any;
  onChange: (data: any) => void;
  contractType?: string;
}

export const ContractWorks: React.FC<ContractWorksProps> = ({
  data,
  onChange,
  contractType
}) => {
  // If contractId is not available yet, show loading state
  if (!data.contractId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule of Works</CardTitle>
          <CardDescription>
            Select the musical works that will be included in this {contractType} agreement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Contract must be created before adding works. This will happen automatically when you proceed to this step.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule of Works</CardTitle>
        <CardDescription>
          Select the musical works that will be included in this {contractType} agreement.
          These works will be subject to the terms and conditions specified in this contract.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScheduleWorksTable contractId={data.contractId} />
        
        {(!data.selectedWorks || data.selectedWorks.length === 0) && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No works have been selected for this agreement. Please add at least one work to continue.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};