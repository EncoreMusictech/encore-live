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
  
  // Create stable snapshot of copyrights to pass to dialog
  const [stableCopyrights, setStableCopyrights] = useState<any[]>([]);
  const [stableLoading, setStableLoading] = useState(true);
  
  // Only update stable references when component first loads or count changes
  React.useEffect(() => {
    if (copyrights.length > 0 && stableCopyrights.length === 0) {
      // Initial load
      setStableCopyrights(copyrights);
      setStableLoading(loading);
    } else if (copyrights.length !== stableCopyrights.length) {
      // Count changed - update the stable reference
      setStableCopyrights(copyrights);
    }
    
    if (loading !== stableLoading) {
      setStableLoading(loading);
    }
  }, [copyrights.length, loading]);
  
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
          copyrights={stableCopyrights}
          loading={stableLoading}
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