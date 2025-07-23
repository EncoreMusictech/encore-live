import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from './use-toast';

interface BulkOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  result?: any;
}

interface BulkOperationOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  continueOnError?: boolean;
  onProgress?: (completed: number, total: number, failed: number) => void;
  onBatchComplete?: (batchResults: any[]) => void;
}

export function useBulkOperations<T = any>(options: BulkOperationOptions = {}) {
  const {
    batchSize = 10,
    delayBetweenBatches = 1000,
    continueOnError = true,
    onProgress,
    onBatchComplete,
  } = options;

  const { toast } = useToast();
  const [operations, setOperations] = useState<BulkOperation<T>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);

  // Add operations to the queue
  const addOperations = useCallback((newOperations: Omit<BulkOperation<T>, 'id' | 'status'>[]) => {
    const opsWithIds = newOperations.map((op, index) => ({
      ...op,
      id: `${Date.now()}_${index}`,
      status: 'pending' as const,
    }));

    setOperations(prev => [...prev, ...opsWithIds]);
    return opsWithIds.map(op => op.id);
  }, []);

  // Clear all operations
  const clearOperations = useCallback(() => {
    setOperations([]);
    setCurrentBatch(0);
  }, []);

  // Remove specific operations
  const removeOperations = useCallback((operationIds: string[]) => {
    setOperations(prev => prev.filter(op => !operationIds.includes(op.id)));
  }, []);

  // Process operations in batches
  const processOperations = useCallback(async (
    processor: (operations: BulkOperation<T>[]) => Promise<any[]>
  ) => {
    if (operations.length === 0 || isProcessing) return;

    setIsProcessing(true);
    const batches = [];
    
    // Split operations into batches
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }

    let completedCount = 0;
    let failedCount = 0;

    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        setCurrentBatch(batchIndex + 1);

        // Mark batch as processing
        setOperations(prev => prev.map(op => 
          batch.find(bOp => bOp.id === op.id)
            ? { ...op, status: 'processing' as const }
            : op
        ));

        try {
          const results = await processor(batch);
          
          // Mark batch as completed
          setOperations(prev => prev.map(op => {
            const batchOp = batch.find(bOp => bOp.id === op.id);
            if (batchOp) {
              const result = results[batch.indexOf(batchOp)];
              completedCount++;
              return {
                ...op,
                status: 'completed' as const,
                result,
              };
            }
            return op;
          }));

          onBatchComplete?.(results);
        } catch (error: any) {
          console.error(`Batch ${batchIndex + 1} failed:`, error);
          
          if (continueOnError) {
            // Mark batch operations as failed but continue
            setOperations(prev => prev.map(op => {
              const batchOp = batch.find(bOp => bOp.id === op.id);
              if (batchOp) {
                failedCount++;
                return {
                  ...op,
                  status: 'failed' as const,
                  error: error.message || 'Operation failed',
                };
              }
              return op;
            }));
          } else {
            // Stop processing on error
            throw error;
          }
        }

        // Update progress
        onProgress?.(completedCount, operations.length, failedCount);

        // Delay between batches (except for the last batch)
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      // Show completion summary
      if (failedCount === 0) {
        toast({
          title: "Bulk Operation Complete",
          description: `Successfully processed ${completedCount} operations`,
        });
      } else {
        toast({
          title: "Bulk Operation Complete with Errors",
          description: `Completed: ${completedCount}, Failed: ${failedCount}`,
          variant: failedCount > completedCount ? "destructive" : "default",
        });
      }

    } catch (error: any) {
      console.error('Bulk operation failed:', error);
      toast({
        title: "Bulk Operation Failed",
        description: error.message || "Failed to process operations",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentBatch(0);
    }
  }, [operations, isProcessing, batchSize, delayBetweenBatches, continueOnError, onProgress, onBatchComplete, toast]);

  // Statistics about current operations
  const statistics = useMemo(() => {
    const total = operations.length;
    const completed = operations.filter(op => op.status === 'completed').length;
    const failed = operations.filter(op => op.status === 'failed').length;
    const processing = operations.filter(op => op.status === 'processing').length;
    const pending = operations.filter(op => op.status === 'pending').length;

    return {
      total,
      completed,
      failed,
      processing,
      pending,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      progress: total > 0 ? ((completed + failed) / total) * 100 : 0,
    };
  }, [operations]);

  // Get operations by status
  const getOperationsByStatus = useCallback((status: BulkOperation<T>['status']) => {
    return operations.filter(op => op.status === status);
  }, [operations]);

  // Retry failed operations
  const retryFailedOperations = useCallback(async (
    processor: (operations: BulkOperation<T>[]) => Promise<any[]>
  ) => {
    const failedOps = getOperationsByStatus('failed');
    if (failedOps.length === 0) return;

    // Reset failed operations to pending
    setOperations(prev => prev.map(op => 
      op.status === 'failed' 
        ? { ...op, status: 'pending' as const, error: undefined }
        : op
    ));

    // Process only the previously failed operations
    await processOperations(processor);
  }, [getOperationsByStatus, processOperations]);

  // Cancel processing (marks pending/processing as failed)
  const cancelProcessing = useCallback(() => {
    if (!isProcessing) return;

    setOperations(prev => prev.map(op => 
      op.status === 'pending' || op.status === 'processing'
        ? { ...op, status: 'failed' as const, error: 'Cancelled by user' }
        : op
    ));

    setIsProcessing(false);
    setCurrentBatch(0);

    toast({
      title: "Processing Cancelled",
      description: "Bulk operation was cancelled",
      variant: "destructive",
    });
  }, [isProcessing, toast]);

  // Export results
  const exportResults = useCallback(() => {
    const results = operations
      .filter(op => op.status === 'completed')
      .map(op => ({
        id: op.id,
        type: op.type,
        data: op.data,
        result: op.result,
      }));

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-operation-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Results Exported",
      description: "Bulk operation results downloaded",
    });
  }, [operations, toast]);

  return {
    // Operations management
    operations,
    addOperations,
    removeOperations,
    clearOperations,
    
    // Processing
    processOperations,
    retryFailedOperations,
    cancelProcessing,
    
    // State
    isProcessing,
    currentBatch,
    statistics,
    
    // Utilities
    getOperationsByStatus,
    exportResults,
  };
}