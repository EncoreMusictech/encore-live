import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChartmetricArtist {
  id: number;
  name: string;
  image_url?: string;
  spotify_followers?: number;
  spotify_monthly_listeners?: number;
}

export interface ChartmetricSpotifyStats {
  followers?: number;
  monthly_listeners?: number;
  popularity?: number;
  follower_to_listener_ratio?: number;
}

export interface ChartmetricPlaylist {
  id: string;
  name: string;
  owner_name?: string;
  followers?: number;
  is_editorial?: boolean;
}

export interface ChartmetricSocialStats {
  instagram?: { followers?: number; engagement_rate?: number };
  tiktok?: { followers?: number; likes?: number };
  youtube?: { subscribers?: number; views?: number };
  twitter?: { followers?: number };
}

export interface ChartmetricAnalytics {
  artist?: {
    id: number;
    name: string;
    image_url?: string;
    genres?: string[];
    cm_artist_rank?: number;
  };
  spotify?: {
    stats?: ChartmetricSpotifyStats;
    listeners?: { cities?: any[]; countries?: any[] };
    playlists?: ChartmetricPlaylist[];
  };
  social?: ChartmetricSocialStats;
  charts?: any[];
  career?: any;
}

export function useChartmetric() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchArtist = async (artistName: string): Promise<ChartmetricArtist[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chartmetric-analytics', {
        body: { action: 'search', artistName },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.data.artists || [];
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast({
        title: 'Chartmetric Search Failed',
        description: message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getFullAnalytics = async (artistId: number): Promise<ChartmetricAnalytics | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chartmetric-analytics', {
        body: { action: 'full-analytics', artistId: artistId.toString() },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.data;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast({
        title: 'Chartmetric Analytics Failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSpotifyStats = async (artistId: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chartmetric-analytics', {
        body: { action: 'spotify-stats', artistId: artistId.toString() },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.data;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSocialStats = async (artistId: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chartmetric-analytics', {
        body: { action: 'social-stats', artistId: artistId.toString() },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.data;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    searchArtist,
    getFullAnalytics,
    getSpotifyStats,
    getSocialStats,
  };
}
