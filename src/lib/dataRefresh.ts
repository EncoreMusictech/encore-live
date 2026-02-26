/**
 * Centralized data refresh system.
 * 
 * Components that mutate data call `emitDataRefresh('contracts')` after a successful save.
 * Data hooks call `useDataRefreshListener('contracts', refetchFn)` to auto-refetch.
 */

type DataType = 
  | 'contracts' 
  | 'copyrights' 
  | 'publishing-entities'
  | 'payees'
  | 'writers'
  | 'original-publishers'
  | 'royalties'
  | 'sync-licenses'
  | 'catalog-works'
  | 'contacts'
  | 'payouts';

type Listener = () => void;

const listeners = new Map<DataType, Set<Listener>>();

export function onDataRefresh(dataType: DataType, listener: Listener): () => void {
  if (!listeners.has(dataType)) {
    listeners.set(dataType, new Set());
  }
  listeners.get(dataType)!.add(listener);
  
  // Return unsubscribe function
  return () => {
    listeners.get(dataType)?.delete(listener);
  };
}

export function emitDataRefresh(dataType: DataType) {
  console.log(`[DataRefresh] Emitting refresh for: ${dataType}`);
  const typeListeners = listeners.get(dataType);
  if (typeListeners) {
    typeListeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error(`[DataRefresh] Error in listener for ${dataType}:`, err);
      }
    });
  }
}

export type { DataType };
