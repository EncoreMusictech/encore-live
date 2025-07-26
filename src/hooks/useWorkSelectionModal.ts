import { create } from 'zustand';

interface WorkSelectionModalState {
  isOpen: boolean;
  contractId: string | null;
  isSpotifyFetching: boolean;
  
  // Actions
  openModal: (contractId: string) => void;
  closeModal: () => void;
  setSpotifyFetching: (isFetching: boolean) => void;
}

export const useWorkSelectionModal = create<WorkSelectionModalState>((set, get) => ({
  isOpen: false,
  contractId: null,
  isSpotifyFetching: false,
  
  openModal: (contractId: string) => {
    console.log('Global modal state - Opening modal for contract:', contractId);
    set({ isOpen: true, contractId });
  },
  
  closeModal: () => {
    const state = get();
    console.log('Global modal state - Close requested. Spotify fetching:', state.isSpotifyFetching);
    
    // Only close if not fetching Spotify data
    if (!state.isSpotifyFetching) {
      console.log('Global modal state - Closing modal');
      set({ isOpen: false, contractId: null });
    } else {
      console.log('Global modal state - Prevented close during Spotify fetch');
    }
  },
  
  setSpotifyFetching: (isFetching: boolean) => {
    console.log('Global modal state - Spotify fetching changed to:', isFetching);
    set({ isSpotifyFetching: isFetching });
  }
}));