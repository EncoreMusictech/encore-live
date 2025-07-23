import { useState, useCallback, useRef } from 'react';

interface OptimisticUpdate<T> {
  id: string;
  data: T;
  originalData?: T;
  type: 'create' | 'update' | 'delete';
}

export function useOptimisticUpdates<T extends { id: string }>(
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate<T>>>(
    new Map()
  );
  const updateIdCounter = useRef(0);

  const generateUpdateId = useCallback(() => {
    return `optimistic_${Date.now()}_${++updateIdCounter.current}`;
  }, []);

  const addOptimisticUpdate = useCallback(
    (type: 'create' | 'update' | 'delete', item: T, originalItem?: T) => {
      const updateId = generateUpdateId();
      const update: OptimisticUpdate<T> = {
        id: updateId,
        data: item,
        originalData: originalItem,
        type,
      };

      setPendingUpdates(prev => new Map(prev).set(updateId, update));

      // Apply optimistic update to data
      setData(prevData => {
        switch (type) {
          case 'create':
            return [...prevData, item];
          case 'update':
            return prevData.map(d => d.id === item.id ? item : d);
          case 'delete':
            return prevData.filter(d => d.id !== item.id);
          default:
            return prevData;
        }
      });

      return updateId;
    },
    [generateUpdateId]
  );

  const confirmUpdate = useCallback((updateId: string) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(updateId);
      return newMap;
    });
  }, []);

  const revertUpdate = useCallback((updateId: string) => {
    setPendingUpdates(prev => {
      const update = prev.get(updateId);
      if (!update) return prev;

      // Revert the optimistic update
      setData(prevData => {
        switch (update.type) {
          case 'create':
            return prevData.filter(d => d.id !== update.data.id);
          case 'update':
            if (update.originalData) {
              return prevData.map(d => 
                d.id === update.data.id ? update.originalData! : d
              );
            }
            return prevData;
          case 'delete':
            return [...prevData, update.data];
          default:
            return prevData;
        }
      });

      const newMap = new Map(prev);
      newMap.delete(updateId);
      return newMap;
    });
  }, []);

  const clearAllPending = useCallback(() => {
    // Revert all pending updates
    Array.from(pendingUpdates.keys()).forEach(updateId => {
      revertUpdate(updateId);
    });
  }, [pendingUpdates, revertUpdate]);

  return {
    data,
    setData,
    pendingUpdates: Array.from(pendingUpdates.values()),
    hasPendingUpdates: pendingUpdates.size > 0,
    addOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    clearAllPending,
  };
}