import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";
import { ScheduleWorksTable } from "../ScheduleWorksTable";
import { useToast } from "@/hooks/use-toast";
import { useContracts } from "@/hooks/useContracts";

interface ArtistAgreementFormWorksProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

export const ArtistAgreementFormWorks: React.FC<ArtistAgreementFormWorksProps> = ({
  data,
  onChange
}) => {
  const { toast } = useToast();
  const { createContract, contracts } = useContracts();
  const [contractId, setContractId] = useState<string | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // Contract creation is now handled only by the Save Draft button
  // No automatic contract creation on component mount

  // Update the selected works from the actual contract data
  useEffect(() => {
    if (contractId) {
      // Fetch the contract to get the actual schedule works
      const contract = contracts.find(c => c.id === contractId);
      if (contract && contract.contract_schedule_works) {
        const works = contract.contract_schedule_works.map(work => ({
          id: work.id,
          title: work.song_title,
          artist: work.artist_name,
          album: work.album_title,
          genre: 'Unknown', // We don't have genre in the schedule works
          isrc: work.isrc
        }));
        onChange({ selectedWorks: works });
      }
    }
  }, [contractId, contracts, onChange]);

  if (isCreatingContract) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Creating contract...</div>
      </div>
    );
  }

  if (!contractId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Preparing works interface...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScheduleWorksTable contractId={contractId} />

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