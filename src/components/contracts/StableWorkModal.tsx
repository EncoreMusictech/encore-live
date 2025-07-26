import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkSelectionDialog } from './WorkSelectionDialog';

interface StableWorkModalProps {
  contractId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StableWorkModal({ contractId, isOpen, onClose, onSuccess }: StableWorkModalProps) {
  const [isSpotifyFetching, setIsSpotifyFetching] = useState(false);
  const modalStateRef = useRef({ isOpen: false, shouldStayOpen: false });
  
  // Track modal state in ref to prevent re-render closures
  useEffect(() => {
    modalStateRef.current.isOpen = isOpen;
  }, [isOpen]);

  // When Spotify starts fetching, lock the modal open
  useEffect(() => {
    if (isSpotifyFetching) {
      modalStateRef.current.shouldStayOpen = true;
      console.log('StableWorkModal - Locking modal open during Spotify fetch');
    } else {
      modalStateRef.current.shouldStayOpen = false;
      console.log('StableWorkModal - Unlocking modal after Spotify fetch');
    }
  }, [isSpotifyFetching]);

  const handleOpenChange = (open: boolean) => {
    console.log('StableWorkModal - Open change requested:', open, {
      isSpotifyFetching,
      shouldStayOpen: modalStateRef.current.shouldStayOpen,
      currentIsOpen: modalStateRef.current.isOpen
    });
    
    // Prevent closing if Spotify is fetching
    if (!open && modalStateRef.current.shouldStayOpen) {
      console.log('StableWorkModal - Prevented close due to Spotify fetch');
      return;
    }
    
    if (!open) {
      onClose();
    }
  };

  const handleSuccess = () => {
    console.log('StableWorkModal - Work added successfully');
    // Reset Spotify state and close
    setIsSpotifyFetching(false);
    modalStateRef.current.shouldStayOpen = false;
    onSuccess();
  };

  const handleCancel = () => {
    console.log('StableWorkModal - Cancel requested');
    // Only close if not fetching
    if (!modalStateRef.current.shouldStayOpen) {
      onClose();
    }
  };

  const handleSpotifyFetchChange = (isFetching: boolean) => {
    console.log('StableWorkModal - Spotify fetch state:', isFetching);
    setIsSpotifyFetching(isFetching);
  };

  console.log('StableWorkModal render:', {
    isOpen,
    contractId,
    isSpotifyFetching,
    shouldStayOpen: modalStateRef.current.shouldStayOpen
  });

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
          onSpotifyFetchChange={handleSpotifyFetchChange}
        />
      </DialogContent>
    </Dialog>
  );
}