import { useMemo } from 'react';

// Memoized selectors for complex data transformations
export function useFilteredTracks(tracks: any[], searchTerm: string, selectedGenres: string[] = []) {
  return useMemo(() => {
    if (!tracks?.length) return [];
    
    return tracks.filter(track => {
      const nameMatch = track.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const genreMatch = selectedGenres.length === 0 || 
        selectedGenres.some(genre => track.genres?.includes(genre));
      
      return nameMatch && genreMatch;
    });
  }, [tracks, searchTerm, selectedGenres]);
}

export function useCalculatedValuation(
  baseValue: number,
  riskFactors: { popularity: number; genre: string; age: number },
  marketConditions: { multiplier: number; discount: number }
) {
  return useMemo(() => {
    if (!baseValue) return null;

    // Risk-adjusted calculations
    const popularityAdjustment = 0.8 + (riskFactors.popularity / 100) * 0.4; // 0.8 to 1.2
    const genreMultipliers: Record<string, number> = {
      'pop': 1.1,
      'hip-hop': 1.2,
      'rock': 0.9,
      'country': 0.95,
      'electronic': 1.05,
      'r&b': 1.15,
    };
    
    const genreAdjustment = genreMultipliers[riskFactors.genre.toLowerCase()] || 1.0;
    const ageAdjustment = Math.max(0.7, 1.0 - (riskFactors.age * 0.02)); // Decay over time
    
    const riskAdjustedValue = baseValue * popularityAdjustment * genreAdjustment * ageAdjustment;
    const marketAdjustedValue = riskAdjustedValue * marketConditions.multiplier * (1 - marketConditions.discount);
    
    return {
      baseValue,
      riskAdjustedValue,
      marketAdjustedValue,
      adjustments: {
        popularity: popularityAdjustment,
        genre: genreAdjustment,
        age: ageAdjustment,
        market: marketConditions.multiplier * (1 - marketConditions.discount),
      },
    };
  }, [baseValue, riskFactors, marketConditions]);
}

export function useProjectionData(
  baseRevenue: number,
  growthRate: number,
  projectionYears: number,
  discountRate: number = 0.12
) {
  return useMemo(() => {
    if (!baseRevenue || !projectionYears) return [];

    const projections = [];
    let cumulativeValue = 0;

    for (let year = 1; year <= projectionYears; year++) {
      const yearRevenue = baseRevenue * Math.pow(1 + growthRate, year - 1);
      const discountFactor = 1 / Math.pow(1 + discountRate, year);
      const presentValue = yearRevenue * discountFactor;
      
      cumulativeValue += presentValue;
      
      projections.push({
        year,
        revenue: yearRevenue,
        presentValue,
        cumulativeValue,
        growthRate: growthRate * 100,
        discountFactor,
      });
    }

    return projections;
  }, [baseRevenue, growthRate, projectionYears, discountRate]);
}

export function useComparableAnalysis(
  targetData: { streams: number; followers: number; genre: string },
  comparables: Array<{ name: string; streams: number; followers: number; valuation: number; genre: string }>
) {
  return useMemo(() => {
    if (!targetData || !comparables?.length) return null;

    // Filter comparables by genre similarity
    const genreComparables = comparables.filter(comp => 
      comp.genre.toLowerCase() === targetData.genre.toLowerCase()
    );

    // Calculate metrics
    const metrics = {
      streamMultiples: comparables.map(comp => comp.valuation / comp.streams).filter(Boolean),
      followerMultiples: comparables.map(comp => comp.valuation / comp.followers).filter(Boolean),
    };

    const avgStreamMultiple = metrics.streamMultiples.length > 0 
      ? metrics.streamMultiples.reduce((a, b) => a + b, 0) / metrics.streamMultiples.length 
      : 0;

    const avgFollowerMultiple = metrics.followerMultiples.length > 0
      ? metrics.followerMultiples.reduce((a, b) => a + b, 0) / metrics.followerMultiples.length
      : 0;

    // Estimate target valuation
    const streamBasedValuation = targetData.streams * avgStreamMultiple;
    const followerBasedValuation = targetData.followers * avgFollowerMultiple;
    const blendedValuation = (streamBasedValuation + followerBasedValuation) / 2;

    return {
      avgStreamMultiple,
      avgFollowerMultiple,
      streamBasedValuation,
      followerBasedValuation,
      blendedValuation,
      genreComparables,
      confidence: Math.min(comparables.length / 5, 1), // 0-1 based on sample size
    };
  }, [targetData, comparables]);
}

export function useChartData(
  rawData: any[],
  chartType: 'line' | 'bar' | 'pie',
  dataKeys: string[]
) {
  return useMemo(() => {
    if (!rawData?.length || !dataKeys?.length) return [];

    switch (chartType) {
      case 'line':
      case 'bar':
        return rawData.map((item, index) => ({
          ...item,
          index,
          ...dataKeys.reduce((acc, key) => ({
            ...acc,
            [key]: Number(item[key]) || 0
          }), {})
        }));

      case 'pie':
        return dataKeys.map(key => ({
          name: key,
          value: rawData.reduce((sum, item) => sum + (Number(item[key]) || 0), 0),
          percentage: 0, // Will be calculated by chart component
        }));

      default:
        return rawData;
    }
  }, [rawData, chartType, dataKeys]);
}