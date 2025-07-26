import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkSelectionDialog } from './WorkSelectionDialog';

interface WorkAdditionModalProps {
  contractId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkAdditionModal({ contractId, isOpen, onClose, onSuccess }: WorkAdditionModalProps) {
  const [isSpotifyFetching, setIsSpotifyFetching] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  // When the modal should be open, force it to stay open during Spotify operations
  useEffect(() => {
    if (isOpen) {
      setForceOpen(true);
    }
  }, [isOpen]);

  // Handle dialog close attempts
  const handleOpenChange = (open: boolean) => {
    console.log('WorkAdditionModal - Open change requested:', open, 'Spotify fetching:', isSpotifyFetching);
    
    if (!open && isSpotifyFetching) {
      console.log('Preventing modal close during Spotify fetch');
      return; // Prevent closing during Spotify fetch
    }
    
    if (!open) {
      setForceOpen(false);
      onClose();
    }
  };

  const handleSuccess = () => {
    console.log('WorkAdditionModal - Success callback');
    setForceOpen(false);
    onSuccess();
  };

  const handleCancel = () => {
    console.log('WorkAdditionModal - Cancel callback');
    if (!isSpotifyFetching) {
      setForceOpen(false);
      onClose();
    }
  };

  const handleSpotifyFetchChange = (isFetching: boolean) => {
    console.log('WorkAdditionModal - Spotify fetch change:', isFetching);
    setIsSpotifyFetching(isFetching);
  };

  // Modal is open if either isOpen prop is true OR we're forcing it to stay open
  const modalIsOpen = isOpen || forceOpen;

  console.log('WorkAdditionModal render:', {
    isOpen,
    forceOpen,
    modalIsOpen,
    isSpotifyFetching,
    contractId
  });

  return (
    <Dialog open={modalIsOpen} onOpenChange={handleOpenChange}>
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
          onSpotifyFetchChange={handleSpotifyFetchChange}
        />
      </DialogContent>
    </Dialog>
  );
}