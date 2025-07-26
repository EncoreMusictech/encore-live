import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";
import { ScheduleWorksTable } from "../ScheduleWorksTable";
import { WorkSelectionDialog } from "../WorkSelectionDialog";
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

  // Create a temporary contract ID for the schedule works table
  // In a real implementation, this would be the actual contract ID after saving
  useEffect(() => {
    if (!contractId) {
      // Generate a temporary ID for demo purposes
      setContractId(`temp-artist-contract-${Date.now()}`);
    }
  }, [contractId]);

  const handleWorkAdded = () => {
    setIsAddDialogOpen(false);
    toast({
      title: "Work Added",
      description: "The work has been successfully added to the contract schedule.",
    });
    
    // Update the selected works count for validation
    onChange({ selectedWorks: [...data.selectedWorks, { id: Date.now() }] });
  };

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

      {/* Schedule of Works */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Schedule of Works</CardTitle>
              <CardDescription>
                Works linked to this contract inherit royalty and party metadata
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Work
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScheduleWorksTable contractId={contractId} />
        </CardContent>
      </Card>

      {/* Add Work Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Work to Schedule</DialogTitle>
            <DialogDescription>
              Select existing works from your copyright catalog or create new works to add to this contract
            </DialogDescription>
          </DialogHeader>
          
          <WorkSelectionDialog 
            contractId={contractId}
            onSuccess={handleWorkAdded}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {data.selectedWorks.length === 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-sm">No Works Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please add at least one recording work to include in the agreement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};