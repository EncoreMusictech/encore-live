import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ArtistEnrichmentData {
  artistName: string;
  imageUrl: string | null;
  biography: string | null;
  topTracks: Array<{
    name: string;
    popularity: number;
    spotifyUrl?: string;
  }>;
  recentSyncs: Array<{
    title: string;
    placement: string;
    year?: number;
  }>;
  recentPerformances: Array<{
    event: string;
    date?: string;
    location?: string;
  }>;
  spotifyFollowers?: number;
  monthlyListeners?: number;
  genres: string[];
}

export function useArtistEnrichment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ArtistEnrichmentData | null>(null);

  const fetchEnrichment = useCallback(async (artistName: string): Promise<ArtistEnrichmentData | null> => {
    if (!artistName) return null;
    
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching enrichment data for: ${artistName}`);
      
      const { data: result, error: fnError } = await supabase.functions.invoke('artist-enrichment', {
        body: { artistName },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw fnError;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to fetch artist data');
      }

      const enrichmentData = result.data as ArtistEnrichmentData;
      setData(enrichmentData);
      return enrichmentData;
    } catch (err) {
      const message = (err as Error).message;
      console.error('Artist enrichment error:', message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    data,
    fetchEnrichment,
    clearData,
  };
}
