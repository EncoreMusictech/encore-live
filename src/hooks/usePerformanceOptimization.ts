import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Debounced value hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled function hook
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunRef = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRunRef.current >= delay) {
        lastRunRef.current = now;
        return func(...args);
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        func(...args);
      }, delay - (now - lastRunRef.current));
    }) as T,
    [func, delay]
  );
}

// Memoized calculations for catalog valuations with historical data support
export function useCatalogCalculations(
  tracks: any[],
  dealTerms: any,
  projectionLength: number = 5,
  historicalData?: any[]
) {
  return useMemo(() => {
    if (!tracks.length || !dealTerms) return null;

    let baseRevenue: number;
    let growthRate: number;
    let useHistoricalData = false;

    // Use historical data if available (at least 2 quarters)
    if (historicalData && historicalData.length >= 2) {
      useHistoricalData = true;
      
      // Calculate average quarterly revenue
      const avgQuarterlyRevenue = historicalData.reduce((sum, s) => sum + s.net_revenue, 0) / historicalData.length;
      baseRevenue = avgQuarterlyRevenue * 4; // Annualize

      // Calculate growth rate from historical trends
      const qoqGrowths = [];
      for (let i = 1; i < historicalData.length; i++) {
        if (historicalData[i - 1].net_revenue > 0) {
          qoqGrowths.push(((historicalData[i].net_revenue - historicalData[i - 1].net_revenue) / historicalData[i - 1].net_revenue));
        }
      }
      
      // Weighted average (more recent quarters weighted higher)
      const weights = qoqGrowths.map((_, i) => 1 + i * 0.5);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      growthRate = qoqGrowths.reduce((sum, g, i) => sum + g * weights[i], 0) / totalWeight;
      
      // Cap growth rate at realistic limits
      growthRate = Math.max(-0.5, Math.min(2.0, growthRate));
    } else {
      // Fallback to stream-based estimates
      const baseStreams = tracks.reduce((total, track) => {
        if (track.isAlbum) {
          const avgPopularity = track.popularity || 50;
          const estimatedStreamsPerTrack = avgPopularity * 100000;
          return total + (estimatedStreamsPerTrack * track.total_tracks);
        } else {
          const popularity = track.popularity || 50;
          return total + (popularity * 200000);
        }
      }, 0);

      baseRevenue = baseStreams * 0.003;
      growthRate = 0.15; // Default 15% initial growth
    }

    const projections = [];
    let currentRecoupment = dealTerms.advance || 0;
    
    for (let year = 1; year <= projectionLength; year++) {
      // Apply growth rate (with decay for non-historical estimates)
      const yearGrowthRate = useHistoricalData 
        ? growthRate 
        : Math.max(0.02, growthRate - (year * 0.02));
      
      const yearlyRevenue = baseRevenue * Math.pow(1 + yearGrowthRate, year - 1);
      const grossRevenue = yearlyRevenue;
      const netRevenue = grossRevenue * 0.7;
      const ownedRevenue = netRevenue * ((dealTerms.ownershipPercentage || 100) / 100);
      
      const acquirerShare = dealTerms.dealType === 'acquisition' ? 100 : (dealTerms.royaltyRate || 50);
      const acquirerEarnings = (ownedRevenue * acquirerShare) / 100;
      
      const recoupmentPayment = Math.min(
        currentRecoupment, 
        acquirerEarnings * ((dealTerms.recoupmentRate || 75) / 100)
      );
      currentRecoupment = Math.max(0, currentRecoupment - recoupmentPayment);
      
      const totalInvested = (dealTerms.advance || 0) + (year * 10000);
      const totalReturned = projections.reduce((sum, p) => sum + p.acquirerEarnings, 0) + acquirerEarnings;
      const roi = ((totalReturned - totalInvested) / totalInvested) * 100;

      projections.push({
        year,
        grossRevenue,
        netRevenue,
        acquirerEarnings,
        recoupmentBalance: currentRecoupment,
        roi
      });
    }

    return {
      baseRevenue,
      projections,
      totalProjectedRevenue: projections.reduce((sum, p) => sum + p.acquirerEarnings, 0),
      finalROI: projections[projections.length - 1]?.roi || 0,
      paybackPeriod: projections.findIndex(p => p.roi > 0) + 1 || null,
      useHistoricalData,
      historicalDataCount: historicalData?.length || 0
    };
  }, [tracks, dealTerms, projectionLength, historicalData]);
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    ...visibleItems,
    handleScroll,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      const renderTime = Date.now() - startTimeRef.current;
      console.log(`${componentName} rendered ${renderCountRef.current} times, last render took ${renderTime}ms`);
    }
    
    startTimeRef.current = Date.now();
  });

  return {
    renderCount: renderCountRef.current,
  };
}