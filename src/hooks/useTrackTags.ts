import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TrackTag {
  id: string;
  user_id: string;
  file_url: string;
  filename: string;
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  duration_seconds?: number;
  mood_emotion?: string[];
  energy_level?: string;
  genre_subgenre?: string[];
  scene_use_case?: string[];
  vocal_type?: string;
  instrumentation?: string[];
  structure_tags?: string[];
  lyrical_themes?: string[];
  analysis_status: string;
  analysis_confidence?: number;
  manual_overrides?: any;
  created_at: string;
  updated_at: string;
}

export const useTrackTags = () => {
  const [trackTags, setTrackTags] = useState<TrackTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrackTags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('track_tags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrackTags(data || []);
    } catch (error: any) {
      console.error('Error fetching track tags:', error);
      toast({
        title: "Error",
        description: "Failed to load track tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrackTagByFileUrl = async (fileUrl: string): Promise<TrackTag | null> => {
    try {
      const { data, error } = await supabase
        .from('track_tags')
        .select('*')
        .eq('file_url', fileUrl)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching track tag:', error);
      return null;
    }
  };

  const updateTrackTag = async (id: string, updates: Partial<TrackTag>) => {
    try {
      const { error } = await supabase
        .from('track_tags')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTrackTags(prev => 
        prev.map(tag => 
          tag.id === id ? { ...tag, ...updates } : tag
        )
      );

      toast({
        title: "Success",
        description: "Track tags updated successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating track tag:', error);
      toast({
        title: "Error",
        description: "Failed to update track tags",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTrackTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('track_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTrackTags(prev => prev.filter(tag => tag.id !== id));

      toast({
        title: "Success",
        description: "Track tag deleted successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting track tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete track tag",
        variant: "destructive",
      });
      return false;
    }
  };

  const searchTrackTags = (query: string) => {
    if (!query.trim()) return trackTags;

    const lowercaseQuery = query.toLowerCase();
    return trackTags.filter(tag => 
      tag.title?.toLowerCase().includes(lowercaseQuery) ||
      tag.artist?.toLowerCase().includes(lowercaseQuery) ||
      tag.filename.toLowerCase().includes(lowercaseQuery) ||
      tag.genre?.toLowerCase().includes(lowercaseQuery) ||
      tag.mood_emotion?.some(mood => mood.toLowerCase().includes(lowercaseQuery)) ||
      tag.genre_subgenre?.some(genre => genre.toLowerCase().includes(lowercaseQuery)) ||
      tag.scene_use_case?.some(scene => scene.toLowerCase().includes(lowercaseQuery)) ||
      tag.instrumentation?.some(instrument => instrument.toLowerCase().includes(lowercaseQuery)) ||
      tag.lyrical_themes?.some(theme => theme.toLowerCase().includes(lowercaseQuery))
    );
  };

  const filterTrackTags = (filters: {
    energyLevel?: string;
    vocalType?: string;
    moodEmotion?: string[];
    genreSubgenre?: string[];
    sceneUseCase?: string[];
  }) => {
    return trackTags.filter(tag => {
      if (filters.energyLevel && tag.energy_level !== filters.energyLevel) {
        return false;
      }
      
      if (filters.vocalType && tag.vocal_type !== filters.vocalType) {
        return false;
      }
      
      if (filters.moodEmotion && filters.moodEmotion.length > 0) {
        const hasMatchingMood = filters.moodEmotion.some(mood => 
          tag.mood_emotion?.includes(mood)
        );
        if (!hasMatchingMood) return false;
      }
      
      if (filters.genreSubgenre && filters.genreSubgenre.length > 0) {
        const hasMatchingGenre = filters.genreSubgenre.some(genre => 
          tag.genre_subgenre?.includes(genre)
        );
        if (!hasMatchingGenre) return false;
      }
      
      if (filters.sceneUseCase && filters.sceneUseCase.length > 0) {
        const hasMatchingScene = filters.sceneUseCase.some(scene => 
          tag.scene_use_case?.includes(scene)
        );
        if (!hasMatchingScene) return false;
      }
      
      return true;
    });
  };

  useEffect(() => {
    fetchTrackTags();
  }, []);

  return {
    trackTags,
    loading,
    fetchTrackTags,
    getTrackTagByFileUrl,
    updateTrackTag,
    deleteTrackTag,
    searchTrackTags,
    filterTrackTags,
  };
};