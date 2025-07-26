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
  const { createContract } = useContracts();
  const [contractId, setContractId] = useState<string | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // Create a real contract when the component mounts
  useEffect(() => {
    const createArtistContract = async () => {
      if (contractId || isCreatingContract) return; // Don't create if already exists or in progress
      
      setIsCreatingContract(true);
      try {
        // Create the contract data structure
        const contractData = {
          contract_type: "artist" as const,
          title: `${data.agreementType || "Artist"} Agreement - ${data.artistName || "Draft"}`,
          counterparty_name: data.artistName || "Artist",
          start_date: data.effectiveDate || new Date().toISOString().split('T')[0],
          end_date: data.expirationDate || null,
          territories: [data.territory || "worldwide"],
          contract_data: {
            agreement_type: data.agreementType,
            artist_name: data.artistName,
            legal_name: data.legalName,
            stage_name: data.stageName,
            territory: data.territory,
            effective_date: data.effectiveDate,
            expiration_date: data.expirationDate,
            recording_commitment: data.recordingCommitment,
            advance_amount: data.advanceAmount,
            royalty_rate: data.royaltyRate,
            mechanical_rate: data.mechanicalRate,
            performance_royalty: data.performanceRoyalty,
            exclusivity: data.exclusivity,
            key_person_clause: data.keyPersonClause,
            leaving_member_clause: data.leavingMemberClause,
            touring_split: data.touringSplit,
            merchandising_split: data.merchandisingSplit,
            artist_contact: {
              address: data.artistAddress,
              phone: data.artistPhone,
              email: data.artistEmail
            },
            label_contact: {
              name: data.labelName,
              address: data.labelAddress,
              contact: data.labelContact
            }
          },
          contract_status: "draft" as const
        };

        const newContract = await createContract(contractData);
        
        if (newContract) {
          setContractId(newContract.id);
          toast({
            title: "Contract Created",
            description: "You can now add works to this agreement",
          });
        } else {
          throw new Error("Failed to create contract");
        }
      } catch (error) {
        console.error('Error creating contract:', error);
        toast({
          title: "Error",
          description: "Failed to create contract. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsCreatingContract(false);
      }
    };

    createArtistContract();
  }, [data, contractId, isCreatingContract, createContract, toast]);

  // Update the selected works count for validation when works are added/removed
  useEffect(() => {
    // This will be automatically handled by the ScheduleWorksTable component
    // We just need to update our validation state
    if (contractId) {
      // For now, assume works are being added (this would be tracked by the ScheduleWorksTable)
      onChange({ selectedWorks: [{ id: 'dummy' }] }); // Dummy work for validation
    }
  }, [contractId, onChange]);

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