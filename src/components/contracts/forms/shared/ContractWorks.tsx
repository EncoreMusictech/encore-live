import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleWorksTable } from '../../ScheduleWorksTable';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WorkSelectionDialog } from '../../WorkSelectionDialog';
import { AlertTriangle, Plus } from "lucide-react";

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
  const [showWorkSelection, setShowWorkSelection] = useState(false);
  
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Schedule of Works</CardTitle>
            <CardDescription>
              Works linked to this contract inherit royalty and party metadata
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowWorkSelection(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Work
          </Button>
        </CardHeader>
        <CardContent>
          <ScheduleWorksTable contractId={data.contractId} />
          
          {(!data.selectedWorks || data.selectedWorks.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No works in schedule yet. Click "Add Work" to link works to this contract.
            </div>
          )}
        </CardContent>
      </Card>
      
      {showWorkSelection && (
        <WorkSelectionDialog
          contractId={data.contractId}
          onSuccess={() => {
            setShowWorkSelection(false);
            // Optionally trigger a refresh of the works table
          }}
          onCancel={() => setShowWorkSelection(false)}
        />
      )}
    </>
  );
};