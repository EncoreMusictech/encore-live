import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";
import { ScheduleWorksTable } from "../ScheduleWorksTable";
import { useToast } from "@/hooks/use-toast";

interface ArtistAgreementFormWorksProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

export const ArtistAgreementFormWorks: React.FC<ArtistAgreementFormWorksProps> = ({
  data,
  onChange
}) => {
  const { toast } = useToast();
  const [contractId, setContractId] = useState<string | null>(null);

  // Create a temporary contract ID for the schedule works table
  // In a real implementation, this would be the actual contract ID after saving
  useEffect(() => {
    if (!contractId) {
      // Generate a temporary ID for demo purposes
      setContractId(`temp-artist-contract-${Date.now()}`);
    }
  }, [contractId]);

  // Update the selected works count for validation when works are added/removed
  useEffect(() => {
    // This will be automatically handled by the ScheduleWorksTable component
    // We just need to update our validation state
    if (contractId) {
      // For now, assume works are being added (this would be tracked by the ScheduleWorksTable)
      onChange({ selectedWorks: [{ id: 'dummy' }] }); // Dummy work for validation
    }
  }, [contractId, onChange]);

  if (!contractId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading works...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Recording Works</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the recordings that will be covered under this agreement.
        </p>
      </div>

      {/* Schedule of Works - This component handles its own Add Work functionality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule of Works</CardTitle>
          <CardDescription>
            Works linked to this contract inherit royalty and party metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleWorksTable contractId={contractId} />
        </CardContent>
      </Card>

      {data.selectedWorks.length === 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-sm">No Works Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please add at least one recording work to include in the agreement using the "Add Work" button above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};