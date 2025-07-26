import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleWorksTable } from '../../ScheduleWorksTable';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WorkSelectionDialog } from '../../WorkSelectionDialog';
import { AlertTriangle, Plus } from "lucide-react";
import { useCopyright } from '@/hooks/useCopyright';

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
  const { copyrights, loading } = useCopyright();
  
  const handleAddWork = () => {
    if (!data.contractId) {
      // If no contractId, show a message that works can be added after saving
      return;
    }
    setShowWorkSelection(true);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          {data.contractId ? (
            <ScheduleWorksTable contractId={data.contractId} />
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Save your contract as a draft first to add works to the schedule. Use the "Save Draft" button below to create the contract, then return to this step to add works.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {showWorkSelection && (
        <WorkSelectionDialog
          contractId={data.contractId}
          copyrights={copyrights}
          loading={loading}
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