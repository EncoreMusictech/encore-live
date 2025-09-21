import { useState, useCallback } from 'react';
import { MLCLookupResult } from '@/hooks/useMLCLookup';
import { createMLCCacheKey, isCacheValid } from '@/lib/mlc-utils';

interface CachedMLCResult extends MLCLookupResult {
  timestamp: string;
  searchType: 'ISWC' | 'ISRC';
  searchValue: string;
}

/**
 * Hook for managing 24-hour in-memory cache of MLC lookup results
 */
export function useMLCCache() {
  const [cache, setCache] = useState<Map<string, CachedMLCResult>>(new Map());

  const getCachedResult = useCallback((type: 'ISWC' | 'ISRC', identifier: string): CachedMLCResult | null => {
    const key = createMLCCacheKey(type, identifier);
    const cached = cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is still valid (24 hours)
    if (!isCacheValid(cached.timestamp)) {
      // Remove expired cache entry
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }
    
    return cached;
  }, [cache]);

  const setCachedResult = useCallback((
    type: 'ISWC' | 'ISRC', 
    identifier: string, 
    result: MLCLookupResult
  ) => {
    const key = createMLCCacheKey(type, identifier);
    const cachedResult: CachedMLCResult = {
      ...result,
      timestamp: new Date().toISOString(),
      searchType: type,
      searchValue: identifier
    };
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, cachedResult);
      return newCache;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const validEntries = Array.from(cache.values()).filter(entry => 
      isCacheValid(entry.timestamp)
    );
    
    return {
      totalCached: cache.size,
      validEntries: validEntries.length,
      expiredEntries: cache.size - validEntries.length,
      oldestEntry: validEntries.length > 0 
        ? Math.min(...validEntries.map(e => new Date(e.timestamp).getTime()))
        : null,
      newestEntry: validEntries.length > 0
        ? Math.max(...validEntries.map(e => new Date(e.timestamp).getTime()))
        : null
    };
  }, [cache]);

  const cleanExpiredEntries = useCallback(() => {
    setCache(prev => {
      const newCache = new Map();
      prev.forEach((value, key) => {
        if (isCacheValid(value.timestamp)) {
          newCache.set(key, value);
        }
      });
      return newCache;
    });
  }, []);

  return {
    getCachedResult,
    setCachedResult,
    clearCache,
    getCacheStats,
    cleanExpiredEntries
  };
}