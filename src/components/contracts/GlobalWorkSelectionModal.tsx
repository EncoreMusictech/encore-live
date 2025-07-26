import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkSelectionDialog } from './WorkSelectionDialog';
import { useWorkSelectionModal } from '@/hooks/useWorkSelectionModal';
import { useContracts } from '@/hooks/useContracts';

export function GlobalWorkSelectionModal() {
  const { isOpen, contractId, isSpotifyFetching, closeModal, setSpotifyFetching } = useWorkSelectionModal();
  const { refetch } = useContracts();

  console.log('GlobalWorkSelectionModal render:', {
    isOpen,
    contractId,
    isSpotifyFetching
  });

  const handleOpenChange = (open: boolean) => {
    console.log('GlobalWorkSelectionModal - Open change requested:', open, 'Spotify fetching:', isSpotifyFetching);
    
    if (!open) {
      // Try to close the modal - the global state will prevent it if Spotify is fetching
      closeModal();
    }
  };

  const handleSuccess = () => {
    console.log('GlobalWorkSelectionModal - Success callback');
    refetch(); // Refresh the contracts data
    // Force close regardless of Spotify state since operation completed
    useWorkSelectionModal.setState({ isOpen: false, contractId: null, isSpotifyFetching: false });
  };

  const handleCancel = () => {
    console.log('GlobalWorkSelectionModal - Cancel callback');
    closeModal();
  };

  // Only render if we have a contract ID
  if (!contractId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Work to Schedule</DialogTitle>
          <DialogDescription>
            Select existing works from your copyright catalog or create new works to add to this contract
          </DialogDescription>
        </DialogHeader>
        
        <WorkSelectionDialog 
          contractId={contractId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onSpotifyFetchChange={setSpotifyFetching}
        />
      </DialogContent>
    </Dialog>
  );
}