import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SongMatchHistoryRecord {
  id: string;
  user_id: string;
  source_name: string;
  song_title: string;
  artist_name: string | null;
  copyright_id: string | null;
  match_confidence: number;
  match_type: string;
  created_at: string;
  updated_at: string;
}

export interface SavedSongMatch {
  song_title: string;
  artist_name?: string;
  copyright_id?: string;
  match_confidence?: number;
  match_type?: string;
}

export function useSongMatchHistory() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getSavedMatches = async (sourceName: string): Promise<SongMatchHistoryRecord[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('song_match_history')
        .select(`
          *,
          copyrights:copyright_id (
            id,
            work_title,
            internal_id
          )
        `)
        .eq('user_id', user.id)
        .eq('source_name', sourceName)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching saved matches:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveMatch = async (
    sourceName: string,
    songTitle: string,
    artistName: string | null,
    copyrightId: string | null,
    matchType: string = 'manual',
    confidence: number = 1.0
  ): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('song_match_history')
        .upsert({
          user_id: user.id,
          source_name: sourceName,
          song_title: songTitle,
          artist_name: artistName,
          copyright_id: copyrightId,
          match_confidence: confidence,
          match_type: matchType,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,source_name,song_title,artist_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving match:', error);
      throw error;
    }
  };

  const saveMultipleMatches = async (
    sourceName: string,
    matches: SavedSongMatch[]
  ): Promise<void> => {
    if (!user || matches.length === 0) return;

    try {
      const records = matches.map(match => ({
        user_id: user.id,
        source_name: sourceName,
        song_title: match.song_title,
        artist_name: match.artist_name || null,
        copyright_id: match.copyright_id || null,
        match_confidence: match.match_confidence || 1.0,
        match_type: match.match_type || 'manual',
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('song_match_history')
        .upsert(records, {
          onConflict: 'user_id,source_name,song_title,artist_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving multiple matches:', error);
      throw error;
    }
  };

  const deleteMatch = async (
    sourceName: string,
    songTitle: string,
    artistName: string | null
  ): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('song_match_history')
        .delete()
        .eq('user_id', user.id)
        .eq('source_name', sourceName)
        .eq('song_title', songTitle)
        .eq('artist_name', artistName);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  };

  const clearAllMatches = async (sourceName?: string): Promise<void> => {
    if (!user) return;

    try {
      let query = supabase
        .from('song_match_history')
        .delete()
        .eq('user_id', user.id);

      if (sourceName) {
        query = query.eq('source_name', sourceName);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error('Error clearing matches:', error);
      throw error;
    }
  };

  return {
    loading,
    getSavedMatches,
    saveMatch,
    saveMultipleMatches,
    deleteMatch,
    clearAllMatches,
  };
}