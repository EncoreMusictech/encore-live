import { useEffect } from 'react';
import { onDataRefresh, type DataType } from '@/lib/dataRefresh';

/**
 * Hook that listens for data refresh events and calls the provided callback.
 * Use this in data hooks to auto-refetch when data changes elsewhere.
 */
export function useDataRefreshListener(dataType: DataType, callback: () => void) {
  useEffect(() => {
    const unsubscribe = onDataRefresh(dataType, callback);
    return unsubscribe;
  }, [dataType, callback]);
}
